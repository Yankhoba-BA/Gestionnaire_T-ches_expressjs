const express = require('express');
const router  = express.Router();
const db      = require('../config/db');


// GET / — Afficher toutes les tâches
// + recherche et filtrage

router.get('/', (req, res) => {

  // Récupérer les filtres depuis l'URL
  const recherche = req.query.recherche || '';
  const statut    = req.query.statut    || '';
  const priorite  = req.query.priorite  || '';

  // Construire la requête dynamiquement
  let sql    = 'SELECT * FROM tache WHERE 1=1';
  let params = [];

  // Filtre recherche (titre OU description)
  if (recherche) {
    sql += ' AND (titre LIKE ? OR description LIKE ?)';
    params.push(`%${recherche}%`, `%${recherche}%`);
  }

  // Filtre statut
  if (statut) {
    sql += ' AND statut = ?';
    params.push(statut);
  }

  // Filtre priorité
  if (priorite) {
    sql += ' AND priorite = ?';
    params.push(priorite);
  }

  sql += ' ORDER BY date_creation DESC';

  db.query(sql, params, (err, taches) => {
    if (err) {
      console.log('Erreur :', err);
      return res.send('Erreur serveur');
    }

    res.render('index', {
      taches,
      recherche,
      statut,
      priorite
    });
  });
});

// POST /taches/ajouter — Ajouter une tâche

router.post('/taches/ajouter', (req, res) => {

  const { titre, description, responsable, date_limite, priorite } = req.body;

  const sql = `
    INSERT INTO tache (titre, description, responsable, date_limite, priorite)
    VALUES (?, ?, ?, ?, ?)
  `;

  const params = [
    titre,
    description || null,
    responsable,
    date_limite || null,
    priorite
  ];

  db.query(sql, params, (err) => {
    if (err) {
      console.log('Erreur :', err);
      return res.send('Erreur serveur');
    }
    res.redirect('/');
  });
});

// GET /taches/:id/statut — Changer statut
// à faire → en cours → terminée

router.get('/taches/:id/statut', (req, res) => {

  const id = req.params.id;

  // D'abord récupérer le statut actuel
  db.query('SELECT statut FROM tache WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      return res.redirect('/');
    }

    const statutActuel = results[0].statut;

    // Calculer le prochain statut
    let prochainStatut;
    if (statutActuel === 'a faire') {
      prochainStatut = 'en cours';
    } else if (statutActuel === 'en cours') {
      prochainStatut = 'termine';
    } else {
      // Déjà terminée → on ne change rien
      return res.redirect('/');
    }

    // Mettre à jour dans la BDD
    db.query(
      'UPDATE tache SET statut = ? WHERE id = ?',
      [prochainStatut, id],
      (err) => {
        if (err) {
          console.log('Erreur :', err);
          return res.send('Erreur serveur');
        }
        res.redirect('/');
      }
    );
  });
});


// GET /taches/:id/modifier — Afficher formulaire

router.get('/taches/:id/modifier', (req, res) => {

  const id = req.params.id;

  db.query('SELECT * FROM tache WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      return res.redirect('/');
    }

    const tache = results[0];

    // Vérifier que la tâche est modifiable
    if (tache.statut === 'termine') {
      return res.redirect('/');
    }

    res.render('modifier', { tache });
  });
});


// POST /taches/:id/modifier — Sauvegarder

router.post('/taches/:id/modifier', (req, res) => {

  const id = req.params.id;
  const { titre, description, responsable, date_limite, priorite } = req.body;

  const sql = `
    UPDATE tache
    SET titre = ?, description = ?, responsable = ?, date_limite = ?, priorite = ?
    WHERE id = ?
  `;

  const params = [
    titre,
    description || null,
    responsable,
    date_limite || null,
    priorite,
    id
  ];

  db.query(sql, params, (err) => {
    if (err) {
      console.log('Erreur :', err);
      return res.send('Erreur serveur');
    }
    res.redirect('/');
  });
});


// POST /taches/:id/supprimer — Supprimer

router.post('/taches/:id/supprimer', (req, res) => {

  const id = req.params.id;

  db.query('DELETE FROM tache WHERE id = ?', [id], (err) => {
    if (err) {
      console.log('Erreur :', err);
      return res.send('Erreur serveur');
    }
    res.redirect('/');
  });
});


// GET /dashboard — Statistiques

router.get('/dashboard', (req, res) => {

  // Récupérer toutes les tâches
  db.query('SELECT * FROM tache', (err, taches) => {
    if (err) {
      console.log('Erreur :', err);
      return res.send('Erreur serveur');
    }

    const aujourdhui = new Date();

    // Calculer les stats
    const total     = taches.length;
    const aFaire    = taches.filter(t => t.statut === 'a faire').length;
    const enCours   = taches.filter(t => t.statut === 'en cours').length;
    const terminees = taches.filter(t => t.statut === 'termine').length;

    // Pourcentage terminées
    const pourcentage = total > 0
      ? Math.round((terminees / total) * 100)
      : 0;

    // Tâches en retard
    const tachesEnRetard = taches.filter(t => {
      const dateLimit = t.date_limite ? new Date(t.date_limite) : null;
      return dateLimit && t.statut !== 'termine' && dateLimit < aujourdhui;
    });

    res.render('dashboard', {
      stats: {
        total,
        aFaire,
        enCours,
        terminees,
        pourcentage,
        enRetard: tachesEnRetard.length
      },
      tachesEnRetard
    });
  });
});

module.exports = router;