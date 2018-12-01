// server.js
// where your node app starts

// init project
const express = require('express');
var body_parser =require('body-parser');
const Chatkit    = require('pusher-chatkit-server')
var express_session=require('express-session');
var app = express();
var cookie_parser =require('cookie-parser');
var nunjucks = require("nunjucks");
const util = require('./utilitaire.js');
var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./db.sqlite3"
    },
    debug: true,
    useNullAsDefault: true
});
app.use(express.static('public'));
nunjucks.configure('views', {
    express: app,
    autoescape: true                 
});

app.use(body_parser.json())
app.use(body_parser.urlencoded({extended: false}));
app.use(cookie_parser());
app.use(express_session({
    secret: '12345',
    resave: false,
    saveUninitialized: false,
}));

const server = app.listen(3000);
const io =require("socket.io")(server);

const SparqlClient = require('sparql-client-2');
const SPARQL = SparqlClient.SPARQL;
const endpoint = 'http://dbpedia.org/sparql';

const client = new SparqlClient(endpoint)
  .register({db: 'http://dbpedia.org/resource/'})
  .register({dbpedia: 'http://dbpedia.org/property/'});
 
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/',async function(request, response) {
  var evenements = await knex('Event').select('*');
  if(request.session.user)
  {
    var userInfo = await knex.raw('SELECT * FROM client WHERE pseudo = ?', [request.session.user]).catch((error) => { console.log(error) });
    response.render('index.html', {userInfo: userInfo, evenements:evenements,user:request.session.user, sportFavoris:request.session.sportsFavoris});
  }
  else
    response.render('index.html', {evenements:evenements});
}); 

// ---------------------------------
app.get("/inscription", function (request, response) {
  response.render('inscription.html', {erreur:[]});
});

app.post("/inscription", async function(req,res) {
  var letters = /^[0-9A-Za-z]+$/;
  var emailBienFormee = /^[-.0-9a-zA-Z]+@[a-z]+\.(fr|com|ca)$/;
  var ok = true;
  
  var erreur = [];
   // on verifie que les mdp matches et sont ecrit en lettres 
  if ((req.body.pass != req.body.passVerif))
    erreur.push('1');
  
  if ((!req.body.pseudo.match(letters)))
    erreur.push('2');
    
  // on vérifie que l'adresse mail est bien formée
  if (!req.body.email.match(emailBienFormee))
    erreur.push('3');
  
  // vérifier que l'adresse mail et le pseudo ne sont pas déjà utilisé
  var userEmail = await knex('Client').where({email:req.body.email}).select('*').first();
  console.log(userEmail);
  if (userEmail)
    erreur.push('4');

  
  var userPseudo = await knex('Client').where({pseudo:req.body.pseudo}).select('*').first();
  if (userPseudo) {
    erreur.push('5');
  }
  
  // Si tout est ok
  if (erreur.length > 0)
    res.render("inscription.html" ,{info:req.body, user:req.session.user, erreur:erreur, sportFavoris:req.session.sportsFavoris});
  else {
    await knex.raw('INSERT INTO Client (email, pseudo, mdp) VALUES (?, ?, ?)',[req.body.email, req.body.pseudo, req.body.pass ]).catch((error) => { console.log(error) }); //insert into BD
    req.session.user = req.body.pseudo; 
    var userInfo = await knex.raw('SELECT * FROM client WHERE email = ?',[req.body.email]).catch((error) => { console.log(error) });
    var events = await knex('Event').select('*');
    res.render('index.html', {userInfo: userInfo,user:req.session.user, evenements:events, sportFavoris:req.session.sportsFavoris});
  }
});

// -------------------------------------------

app.post("/supprimerCompte", async function(req, res) {
  /*var userInfo = await knex("Client").where({
    pseudo: req.session.user}).select('*').first();
  
  console.log(userInfo.email);*/
  
  await knex.raw('DELETE FROM Participe WHERE pseudoParticipant = ?',[req.session.user]).catch((error) => { console.log(error) });
  await knex.raw('DELETE FROM Interesse WHERE pseudoInteresse = ?',[req.session.user]).catch((error) => { console.log(error) });
  await knex.raw('DELETE FROM Event WHERE emailCreateur = ?',[req.session.user]).catch((error) => { console.log(error) });
  await knex.raw('DELETE FROM Client WHERE pseudo = ?',[req.session.user]).catch((error) => { console.log(error) });

  res.redirect('/');
});

// -------------------------------------------

app.get("/profil", async function (req, res) {
  var page;
  if (req.query.page)
    page = req.query.page;
  else 
    page = "infos";

  if(req.session.user)
  {
    var userInfo = await knex.raw('SELECT * FROM client WHERE pseudo = ?',[req.session.user]).catch((error) => { console.log(error) });
    var evenements;
    if (page == "events")
        evenements = await knex.raw('SELECT * FROM Event WHERE emailCreateur = ?',[userInfo[0].pseudo]).catch((error) => { console.log(error) });
    else if (page =="participe")
      evenements = await knex.raw("SELECT * FROM Event, Participe WHERE Participe.pseudoParticipant = ? AND Event.id = Participe.idEvent", [userInfo[0].pseudo]);
    else if (page=="interet")
      evenements = await knex.raw("SELECT * FROM Event, Interesse WHERE Interesse.pseudoInteresse = ? AND Event.id = Interesse.idEvent", [userInfo[0].pseudo]);
    
    res.render('profil.html', {page:page, userInfo: userInfo[0], evenements:evenements, erreur:[],user:req.session.user, sportFavoris:req.session.sportsFavoris});
  }
  else
    res.redirect('/');
});

app.post("/profil", async function(req, res) {
  var erreur = [];
  var userInfo_old = await knex("Client").where({
    pseudo: req.session.user}).select('*').first();
  
  // regarder si le pseudo est modifié
  if (req.session.user != req.body.pseudo) {
    // Vérifier que le peudo n'est pas déjà utilisé
    var userPseudo = await knex('Client').where({pseudo:req.body.pseudo}).select('*').first();
    if (userPseudo) {
      erreur.push('1');
    } else {
      // modifier la bdd
      //     - supprimer l'entrée de la table Client avec la clé : l'ancien pseudo
      await knex('Client').where({pseudo: req.session.user}).del();
      //     - ajouter une entrée de la table Client : nouveau pseudo, mail, mdp
      await knex('Client').insert({pseudo:req.body.pseudo, email:userInfo_old.email, mdp:userInfo_old.mdp});

      // mettre à jour la session
      req.session.user = req.body.pseudo;
    }
  }
  
  //Regarder si l'email a été modifié
  if (userInfo_old.email != req.body.email) {
    // Regarder si l'email est déjà utilisé
    var userEmail = await knex('Client').where({email:req.body.email}).select('*').first();
    if (userEmail) {
      erreur.push('2');
    } else {  
      var emailBienFormee = /^[-.0-9a-zA-Z]+@[a-z]+\.(fr|com)$/;
      // on vérifie que l'adresse mail est bien formée
      if (!req.body.email.match(emailBienFormee)) {
        erreur.push('3');
      } else {
        // mettre à jour l'email
        await knex('Client').where({pseudo: req.body.pseudo}).update({email:req.body.email});
      }
    }
  }
  
  // Si il y a un nouveau mot de passe
  if (req.body.pass) {
    // vérifier le mot de passe actuel
    if (req.body.ancien_pass == userInfo_old.mdp) {
      // vérifier le nouveau mdp et la confirmation
      if (req.body.pass == req.body.passVerif) {
        // mettre à jour la bdd
          await knex('Client').where({pseudo: req.body.pseudo}).update({mdp:req.body.pass});
      } else {
        // erreur : mdp différents
        erreur.push('5');
      }
    } else {
      // erreur : mdp incorrect
        erreur.push('4'); 
    }
  } 
  if (erreur.length > 0) {
    var userInfo = await knex("Client").where({pseudo: req.body.pseudo}).select('*').first();
    res.render('profil.html', {userInfo: userInfo,user:req.session.user, erreur:erreur, sportFavoris:req.session.sportsFavoris, page:"infos"});    
  } else {
      var events = await knex('Event').select('*');
      res.render('profil.html', {userInfo: userInfo,user:req.session.user, sportFavoris:req.session.sportsFavoris, page:"infos"});  
  }
});

//------------------------------------------------

app.get("/creer_evenement", function (req, res) {
  if(req.session.user)
    res.render('creer_evenement.html',{user:req.session.user, sportFavoris:req.session.sportsFavoris}); 
  else
    res.redirect('/');
});  

app.post("/creer_evenement", async function (req, res) {
    await knex.raw('INSERT INTO Event (sport, date, start, end, lieu, prix, participantMax, emailCreateur) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',[req.body.sport, req.body.date, req.body.debut, req.body.fin, req.body.lieu, req.body.prix, req.body.nb, req.session.user]).catch((error) => { console.log(error) }); //insert into BD
    //var events = await knex('Event').select('*');
    //res.render('index.html', {createDone: 1, user: req.session.user, evenements:events});
  res.redirect('/');
});

//------------------------------------------------

app.post("/supprEvent", async function (req, res) {
  await knex.raw('DELETE FROM Event WHERE id=?',[req.body.id]).catch((error) => { console.log(error) });
  
  var userInfo = await knex.raw('SELECT * FROM client WHERE pseudo = ?',[req.session.user]).catch((error) => { console.log(error) });
  var evenements = await knex.raw('SELECT * FROM Event WHERE emailCreateur = ?',[userInfo[0].pseudo]).catch((error) => { console.log(error) });
  res.render('profil.html', {userInfo: userInfo[0], evenements:evenements, erreur:[],user:req.session.user, sportFavoris:req.session.sportsFavoris, page:"events"});
});

// -------------------------------------------

app.get("/fiche-evenement", async function(req, res) {
  var event = await knex('Event').where({id:req.query.id}).select('*').first();
  if (req.session.user) {
    var participe = await knex('Participe').where({idEvent:req.query.id, pseudoParticipant:req.session.user}).select('*').first();
    var interesse = await knex('Interesse').where({idEvent:req.query.id, pseudoInteresse:req.session.user}).select('*').first();
  }
  var nbParticipants = await knex.raw('SELECT COUNT(*) AS nb FROM Participe WHERE idEvent = ?', [req.query.id]);
  var nbInteresses = await knex.raw('SELECT COUNT(*) AS nb FROM Interesse WHERE idEvent = ?', [req.query.id]);
  
  var query = SPARQL `SELECT ?info
         WHERE {
            ?sport rdf:type dbo:Sport;
                   rdfs:label "`+event.sport+`"@fr;
                   dbo:abstract ?info.
              FILTER (langMatches(lang(?info),"fr"))
         } `;
  var info;
  client.query(query)
  .execute()
  .then(function (result) {
    info = result.results.bindings[0].info.value;
    console.log(info);
    res.render('fiche-evenement.html',{info:info, user:req.session.user, event:event, participe:participe, interesse:interesse, nbParticipants:nbParticipants[0].nb, nbInteresses:nbInteresses[0].nb, sportFavoris:req.session.sportsFavoris});
  }).catch(function (error) {
    res.render('fiche-evenement.html',{info:"ce sport n'est pas dans la base de données de dbpedia...", user:req.session.user, event:event, participe:participe, interesse:interesse, nbParticipants:nbParticipants[0].nb, nbInteresses:nbInteresses[0].nb, sportFavoris:req.session.sportsFavoris});
  });
});
/*
io.on("connection",(socket) => {
  console.log("new user connected");
  socket.username="Anon";
  
  socket.on("change_username",(data) => {
    socket.username = data.username;
  });
  
  socket.on("new_message",(data) => {
    io.socket.emit("new_message",{message: data.message,username : socket.username});
  });
  
});*/
// Users array
var users = [];

// Create new websocket 
io.sockets.on('connection', function (socket) {
  // Set user name
  socket.on('setUserName', function (userName) {

    if (userName === null || userName === ''){
      userName = 'Guest'
    }

  
    socket.userName =  userName

    var connected_msg = '+ ' + userName + ' connected +';
    console.log(connected_msg);
    io.sockets.emit('broadcast-msg', connected_msg);
    users.push(userName); //add to User list
    io.sockets.emit('updateUsers', users); // update User list			
  });
  
  //user msgs
  socket.on('emit-msg', function (msg) {
    console.log(socket.userName + ':', msg);
    io.sockets.emit('broadcast-msg', socket.userName + ': ' + msg);
  });

  //user disconnection
  socket.on('disconnect', function() {
    //remove from array
    var pos = users.indexOf(socket.userName);
    if (pos >= 0) {
      users.splice(pos, 1);
    };
    io.sockets.emit('updateUsers', users);	// update list
    var dcMsg = '- ' + socket.userName + ' disconnected -';
    io.sockets.emit('broadcast-msg',dcMsg);
    console.log(dcMsg)
  });
});

//------------------------------------------------

app.get("/participer", async function(req, res) {  
  var event = await knex('Event').where({id:req.query.id}).select('*').first();
  var participe = await knex('Participe').where({idEvent:req.query.id, pseudoParticipant:req.session.user}).select('*').first();
  if (participe) {
    // On se désincrit 
    await knex('Participe').where({idEvent:event.id, pseudoParticipant:req.session.user}).del();
  } else {
    // on vérifie qu'il reste de la place
    
    var nbParticipants = await knex.raw('SELECT COUNT(*) AS nb FROM Participe WHERE idEvent = ?', [req.query.id]);
    
    if (event.participantMax === '' || event.participantMax > nbParticipants[0].nb) {
     // On supprime de la table Interessé et on l'ajoute à la table Participe
     await knex('Interesse').where({idEvent:event.id, pseudoInteresse:req.session.user}).del();
     await knex('Participe').insert({idEvent:event.id, pseudoParticipant:req.session.user});
    } else {
    // Afficher un message d'erreur
      var erreur="complet";
    }
  }
  
  var participe = await knex('Participe').where({idEvent:req.query.id, pseudoParticipant:req.session.user}).select('*').first();
  var interesse = await knex('Interesse').where({idEvent:req.query.id, pseudoInteresse:req.session.user}).select('*').first();
  
  nbParticipants = await knex.raw('SELECT COUNT(*) AS nb FROM Participe WHERE idEvent = ?', [req.query.id]);
  var nbInteresses = await knex.raw('SELECT COUNT(*) AS nb FROM Interesse WHERE idEvent = ?', [req.query.id]);
  
  var query = SPARQL `SELECT ?info
         WHERE {
            ?sport rdf:type dbo:Sport;
                   rdfs:label "`+event.sport+`"@fr;
                   dbo:abstract ?info.
              FILTER (langMatches(lang(?info),"fr"))
         } `;
  var info;
  client.query(query)
  .execute()
  .then(function (result) {
    info = result.results.bindings[0].info.value;
    console.log(info);
    res.render('fiche-evenement.html',{erreur:erreur, info:info, user:req.session.user, event:event, participe:participe, interesse:interesse, nbParticipants:nbParticipants[0].nb, nbInteresses:nbInteresses[0].nb, sportFavoris:req.session.sportsFavoris});
  }).catch(function (error) {
    res.render('fiche-evenement.html',{erreur:erreur, info:"ce sport n'est pas dans la base de données de dbpedia...", user:req.session.user, event:event, participe:participe, interesse:interesse, nbParticipants:nbParticipants[0].nb, nbInteresses:nbInteresses[0].nb, sportFavoris:req.session.sportsFavoris});
  });
});

//------------------------------------------------

app.get("/interesser", async function(req, res) {
  var event = await knex('Event').where({id:req.query.id}).select('*').first();
  var interesse = await knex('Interesse').where({idEvent:req.query.id, pseudoInteresse:req.session.user}).select('*').first();
  if (interesse) 
    await knex('Interesse').where({idEvent:event.id, pseudoInteresse:req.session.user}).del();
  else
    await knex('Interesse').insert({idEvent:event.id, pseudoInteresse:req.session.user});
  
  var participe = await knex('Participe').where({idEvent:req.query.id, pseudoParticipant:req.session.user}).select('*').first();
  var interesse = await knex('Interesse').where({idEvent:req.query.id, pseudoInteresse:req.session.user}).select('*').first();
  
  var nbParticipants = await knex.raw('SELECT COUNT(*) AS nb FROM Participe WHERE idEvent = ?', [req.query.id]);
  var nbInteresses = await knex.raw('SELECT COUNT(*) AS nb FROM Interesse WHERE idEvent = ?', [req.query.id]);
  
  var query = SPARQL `SELECT ?info
         WHERE {
            ?sport rdf:type dbo:Sport;
                   rdfs:label "`+event.sport+`"@fr;
                   dbo:abstract ?info.
              FILTER (langMatches(lang(?info),"fr"))
         } `;
  var info;
  client.query(query)
  .execute()
  .then(function (result) {
    info = result.results.bindings[0].info.value;
    console.log(info);
    res.render('fiche-evenement.html',{info:info, user:req.session.user, event:event, participe:participe, interesse:interesse, nbParticipants:nbParticipants[0].nb, nbInteresses:nbInteresses[0].nb, sportFavoris:req.session.sportsFavoris});
  }).catch(function (error) {
    res.render('fiche-evenement.html',{info:"ce sport n'est pas dans la base de données de dbpedia...", user:req.session.user, event:event, participe:participe, interesse:interesse, nbParticipants:nbParticipants[0].nb, nbInteresses:nbInteresses[0].nb, sportFavoris:req.session.sportsFavoris});
  });
  
});

//------------------------------------------------

app.post('/initModifEvent', async (req, res) => {
  var evenement = await knex.raw('SELECT * FROM Event WHERE id = ?',[req.body.id]).catch((error) => { console.log(error) });
  res.render('modifEvent.html', {evenement:evenement[0], sportFavoris:req.session.sportsFavoris});
});

app.post('/modifEvent', async (req, res) => {
  var evenement_old = await knex.raw('SELECT * FROM Event WHERE id = ?',[req.body.id]).catch((error) => { console.log(error) });
  
  // regarder si le sport est modifié
  if (evenement_old[0].sport != req.body.sport) {
      // modifier la bdd
      await knex('Event').where({id: req.body.id}).update({sport:req.body.sport});
  }

  // regarder si la date est modifiée
  if (evenement_old[0].date != req.body.date) {
      // modifier la bdd
      await knex('Event').where({id: req.body.id}).update({date:req.body.date});
  }

  // regarder si l'heure de début est modifiée
  if (evenement_old[0].start != req.body.start) {
      // modifier la bdd
      await knex('Event').where({id: req.body.id}).update({start:req.body.start});
  }
  
  // regarder si l'heure de fin est modifiée
  if (evenement_old[0].end != req.body.end) {
      // modifier la bdd
      await knex('Event').where({id: req.body.id}).update({end:req.body.end});
  }

  // regarder si le lieu est modifié
  if (evenement_old[0].lieu != req.body.lieu) {
      // modifier la bdd
      await knex('Event').where({id: req.body.id}).update({lieu:req.body.lieu});
  }
  
  // regarder si le prix est modifié
  if (evenement_old[0].prix != req.body.prix) {
      // modifier la bdd
      await knex('Event').where({id: req.body.id}).update({prix:req.body.prix});
  }
  
  // regarder si le nombre de participants est modifié
  if (evenement_old[0].participantMax != req.body.participantMax) {
      // modifier la bdd
      await knex('Event').where({id: req.body.id}).update({participantMax:req.body.participantMax});
  }
  
  var userInfo = await knex.raw('SELECT * FROM client WHERE pseudo = ?',[req.session.user]).catch((error) => { console.log(error) });
  var evenements = await knex.raw('SELECT * FROM Event WHERE emailCreateur = ?',[userInfo[0].pseudo]).catch((error) => { console.log(error) });
  res.render('profil.html', {page:"events", userInfo: userInfo[0], evenements:evenements, erreur:[],user:req.session.user, sportFavoris:req.session.sportsFavoris});
});
  
//------------------------------------------------

app.get("/connexion", function (request, response) {
  response.render('connexion.html');
});

app.post('/connexion', async (req, res) => {
 var userInfo = await knex('Client').where({
  pseudo: req.body.pseudo,
  mdp:  req.body.mdp
  }).select('*').first();
  if (userInfo) {
      req.session.user = userInfo.pseudo;
      var events = await knex('Event').select('*');
    
      req.session.sportsFavoris = new Object;
      req.session.sportsFavoris =  await util.sportFavoris(req.session.user);
  
      res.render("index.html", {userInfo: userInfo, user: req.session.user, evenements:events, sportFavoris:req.session.sportsFavoris});
    
  } else {
      res.render("connexion.html", {erreur: 1, sportFavoris:req.session.sportsFavoris});
  }
});

//------------------------------------------------

app.get("/deconnexion", function (req, res) {
  req.session.user = null;
  res.redirect('/');
});

//------------------------------------------------

app.post("/recherche_avancee", async function(req, res) {
  var evenements;
  if (req.body.sport != "" & req.body.date == "" & req.body.lieu == "")
    evenements = await knex.raw('SELECT * FROM Event WHERE lower(sport) LIKE ?',
                                ["%"+req.body.sport.toLowerCase()+"%"]);
    //evenements = await knex('Event').where({sport:req.body.sport}).select('*');
  else if (req.body.sport == "" & req.body.date != "" & req.body.lieu == "") 
    evenements = await knex.raw('SELECT * FROM Event where date = ?',
                                [req.body.date]);
    //evenements = await knex('Event').where({date:req.body.date}).select('*');
  else if (req.body.sport == "" & req.body.date == "" & req.body.lieu != "") 
    evenements = await knex.raw("SELECT * FROM Event WHERE lower(lieu) LIKE ?", 
                                ["%"+req.body.lieu.toLowerCase()+"%"]);
  //evenements = await knex('Event').where({lieu:req.body.lieu}).select('*');
  else if (req.body.sport != "" & req.body.date != "" & req.body.lieu == "") 
    evenements = await knex.raw("SELECT * FROM Event WHERE lower(sport) LIKE ? AND date = ?", 
                                ["%"+req.body.sport.toLowerCase()+"%", req.body.date]);
    //evenements = await knex('Event').where({sport:req.body.sport, date:req.body.date}).select('*');
  else if (req.body.sport != "" & req.body.date == "" & req.body.lieu != "") 
    evenements = await knex.raw("SELECT * FROM Event WHERE lower(sport) LIKE ? AND lower(lieu) LIKE ?", 
                                ["%"+req.body.sport.toLowerCase()+"%", "%"+req.body.lieu.toLowerCase()+"%"]);
    //evenements = await knex('Event').where({sport:req.body.sport, lieu:req.body.lieu}).select('*');
  else if (req.body.sport == "" & req.body.date != "" & req.body.lieu != "") 
    evenements = await knex.raw("SELECT * FROM Event WHERE lower(lieu) LIKE ? AND date = ?", 
                                ["%"+req.body.lieu.toLowerCase()+"%", req.body.date]);
    //evenements = await knex('Event').where({lieu:req.body.lieu, date:req.body.date}).select('*');
  else if (req.body.sport != "" & req.body.date != "" & req.body.lieu != "") 
    evenements = await knex.raw("SELECT * FROM Event WHERE lower(sport) LIKE ? AND date = ? AND lower(lieu)", 
                                ["%"+req.body.sport.toLowerCase()+"%", req.body.date, "%"+req.body.lieu.toLowerCase()+"%"]);
    //evenements = await knex('Event').where({sport:req.body.sport, date:req.body.date, lieu:req.body.lieu}).select('*');
  else
    evenements = await knex('Event').select('*');
  

  if(req.session.user)
  {
    var userInfo = await knex.raw('SELECT * FROM client WHERE pseudo = ?', [req.session.user]).catch((error) => { console.log(error) });
    res.render('index.html', {evenements:evenements,user:req.session.user, recherche_avancee:"vrai", recherche:req.body, sportFavoris:req.session.sportsFavoris});
  }
  else
    res.render('index.html', {evenements:evenements, recherche_avancee:"vrai", recherche:req.body, sportFavoris:req.session.sportsFavoris});
    
});

app.get("/recherche_avancee", async function(req, res) {
  var evenements = await knex('Event').select('*');
  if(req.session.user)
  {
    res.render('index.html', {evenements:evenements, user:req.session.user, recherche_avancee:"vrai", sportFavoris:req.session.sportsFavoris});
  }
  else
    res.render('index.html', {evenements:evenements, recherche_avancee:"vrai", sportFavoris:req.session.sportsFavoris});
});

// -----------------------------------------------

app.get("/header.html", function (request, response) {
  response.render('header.html');
});

// listen for requests :)
/*const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
*/

