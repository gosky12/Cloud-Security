const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const mysql = require('mysql2');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(helmet());

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Trop de tentatives de connexion, réessayez plus tard.',
});

app.use(express.static(path.join(__dirname, 'public')));

require('dotenv').config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const secret_name = "rds!db-e1a9bd1e-76ec-4f14-9aee-c6203a0a1c5d";
const client = new SecretsManagerClient({ region: "eu-west-3" });

async function getDBCredentials() {
    try {
        const data = await client.send(
            new GetSecretValueCommand({
                SecretId: secret_name,
                VersionStage: "AWSCURRENT",
            })
        );
        const secret = JSON.parse(data.SecretString);
        return {
            username: secret.username,
            password: secret.password,
        };
    } catch (error) {
        console.error("Erreur lors de la récupération du secret:", error);
        throw error;
    }
}

let db;

async function connectToDatabase() {
    try {
        const credentials = await getDBCredentials();

        db = mysql.createConnection({
            host: "netwish.clqkyo2eoald.eu-west-3.rds.amazonaws.com",
            user: credentials.username,
            password: credentials.password,
            database: "netwish",
            port: 3306
        });

        db.connect((err) => {
            if (err) {
                console.error('Erreur de connexion à la base de données:', err);
                return;
            }
            console.log('Connexion à la base de données réussie');
        });

    } catch (err) {
        console.error('Erreur de connexion à la base de données:', err);
    }
}

connectToDatabase();

const secret = crypto.randomBytes(64).toString('hex');
app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, //process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: null
    }
}));

app.get('/login', (req, res) => {
    const errorMessage = req.query.error;
    res.render('login', { errorMessage });
});

app.get('/register', (req, res) => {
    res.render('register', { errorMessage: {} });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erreur lors de la déconnexion');
        }
        res.redirect('/login');
    });
});

app.get('/home', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});
const validateRegistration = [
    body('email').isEmail().withMessage('Email invalide'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Le mot de passe doit faire au moins 6 caractères')
        .matches(/[a-z]/)
        .withMessage('Le mot de passe doit contenir au moins une lettre minuscule')
        .matches(/[A-Z]/)
        .withMessage('Le mot de passe doit contenir au moins une lettre majuscule')
        .matches(/[\W_]/)
        .withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Les mots de passe ne correspondent pas');
        }
        return true;
    })
];

app.post('/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Erreur de requête SQL:', err);
            return res.render('login', { errorMessage: 'Erreur interne du serveur.' });
        }

        if (results.length === 0) {
            return res.render('login', { errorMessage: 'Email ou mot de passe incorrect.' });
        }
        const user = results[0];
        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) {
                return res.render('login', { errorMessage: 'Erreur interne du serveur.' });
            }
            if (isMatch) {
                req.session.user = user;
                const currentTime = new Date();
                db.query('UPDATE users SET last_login = ? WHERE email = ?', [currentTime, email], (err, results) => {
                    if (err) {
                        console.error('Erreur lors de la mise à jour de la dernière connexion:', err);
                    }
                });
                res.redirect('/home');
            } else {
                res.render('login', { errorMessage: 'Email ou mot de passe incorrect.' });
            }
        });
    });
});

app.post('/register', validateRegistration, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errorMessages = [];
        errors.array().forEach(error => {
            errorMessages.push(error.msg);
        });
        return res.render('register', { errorMessages });
    }
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.render('register', { errorMessages: ['Erreur lors de la vérification de l\'email.'] });
        }
        if (results.length > 0) {
            return res.render('register', { errorMessages: ['Email déjà utilisé'] });
        }
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.send('Erreur lors du hachage du mot de passe.');
            }
            db.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hashedPassword], (err, results) => {
                if (err) {
                    return res.send('Erreur lors de l\'inscription.');
                }
                console.log(`Nouvel utilisateur : ${email}, mot de passe haché : ${hashedPassword}`);
                res.redirect('/login');
            });
        });
    });
});

app.use((req, res, next) => {
    res.status(404).send('Page non trouvée');
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Erreur interne du serveur');
});

const PORT = 5000;
const IP = "localhost"
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://${IP}:${PORT}`);
});