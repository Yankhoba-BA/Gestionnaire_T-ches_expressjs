const express = require('express');
const path    = require('path');
const app     = express();

// ── Dire à Express d'utiliser EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'page')); // ton dossier s'appelle 'page'

// ── Middlewares (indispensables)
app.use(express.urlencoded({ extended: true })); // pour lire les formulaires
app.use(express.json());
app.use(express.static('public')); // pour servir ton CSS/images

// ── Tes routes
const tachesRoutes = require('./route/taches'); // adapte selon ton fichier
app.use('/', tachesRoutes);

// ── Lancer le serveur
app.listen(3000, () => {
  console.log('Serveur lancé sur http://localhost:3000');
});