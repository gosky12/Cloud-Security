# Site web réalisé pour mon projet de Sécurité Cloud à l'Efrei

Ce site web a été développé dans le cadre de ma dernière année d'école d'ingénieur (Ingénieur 3) à l'Efrei. Le projet met en œuvre des concepts de sécurité cloud et des technologies web modernes.

---

## Fonctionnalités

- Templates dynamiques : Utilisation d'EJS pour générer des pages dynamiques comme `register.ejs` et `login.ejs`.
- Fichiers statiques : Gestion des fichiers HTML, CSS et images via le dossier `public`.
- Serveur Node.js : Serveur léger et performant pour répondre aux requêtes des utilisateurs.

---

## Installation et exécution

1. Clonez le dépôt :  
   git clone https://github.com/gosky12/projet-securite-cloud.git

2. Accédez au répertoire du projet :  
   cd projet-securite-cloud

3. Installez les dépendances :  
   npm install

4. Mettez à jour les informations de connexion à la base de données dans le fichier `server.js`.

5. Modifiez l'adresse IP et le port du site dans le fichier `server.js`.

6. Lancez l'application :  
   node server.js

7. Accédez au site web :  
   Ouvrez votre navigateur et rendez-vous sur [http://<adresse_ip>:3000](http://<adresse_ip>:3000) (ou tout autre port configuré dans `server.js`).

---

## Structure du projet

Voici la structure des fichiers et dossiers de ce projet :

mon-projet/  
├── server.js                  # Point d'entrée du serveur  
├── package.json               # Liste des dépendances  
├── package-lock.json          # Détails des versions des dépendances  
├── node_modules/              # Répertoire des dépendances (généré automatiquement par npm)  
├── views/                     # Templates EJS pour les pages dynamiques  
│   ├── register.ejs  
│   └── login.ejs  
├── public/                    # Fichiers statiques accessibles publiquement  
│   ├── home.html  
│   ├── styles.css  
│   └── images/  
│       ├── image1.jpg  
│       └── image2.jpg  
├── .gitignore                 # Fichier pour exclure les fichiers inutiles du dépôt Git  
└── README.md                  # Documentation du projet  

---

## Technologies utilisées

Ce projet repose sur les technologies suivantes :

- Node.js : Serveur backend léger et extensible.
- EJS : Génération des templates dynamiques côté serveur.
- HTML/CSS : Construction et stylisation des pages.

---