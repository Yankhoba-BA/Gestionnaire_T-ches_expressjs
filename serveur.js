const express = require('express');
const path    = require('path');
const app     = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'page')); 


app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.use(express.static('public'));


const tachesRoutes = require('./route/taches'); // adapte selon ton fichier
app.use('/', tachesRoutes);


app.listen(3000, () => {
  console.log('Serveur lancé sur http://localhost:3000');
});