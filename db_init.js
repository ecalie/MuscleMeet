var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./db.sqlite3"
    },
    debug: true,
    useNullAsDefault: true
});

//Utilisateurs (Client)

knex.raw('DROP TABLE IF EXISTS Client')
  .then(()=> {
  console.log('Drop table Client');
  return knex.raw('CREATE TABLE Client (pseudo varchar(255) primary key NOT NULL, mdp varchar(255) NOT NULL, email varchar(255) NOT NULL, interet varchar(255), deleted integer(1) DEFAULT 0)');
}).then(()=> {
  console.log('reCreated table Client');
  return knex.raw('INSERT INTO Client(pseudo,mdp,email,interet) VALUES("cpt2","mdp1","s.rf@fee.ca","hockey")');
}).then(()=> {
  console.log('insert and select table Client');
  return knex.raw('SELECT * FROM Client');
}).then((value) =>{
  console.log(value)
}).then((value) =>{
  return knex('Client').columnInfo()
}).then((cols)=> {
    console.log(cols);
});

//Evenements (event)

knex.raw('DROP TABLE IF EXISTS Event')
  .then(()=> {
  console.log('Drop table Event');
  return knex.raw('CREATE TABLE Event (id INTEGER PRIMARY KEY, sport varchar(255) NOT NULL, date date NOT NULL, start time NOT NULL, end time NOT NULL, lieu varchar(255) NOT NULL,prix float(10), participantMax int(10) NOT NULL, emailCreateur varchar(255) NOT NULL, deleted integer(1) DEFAULT 0)');
}).then(()=> {
  console.log('recreate table Event');
  return knex.raw('INSERT INTO Event (sport,date, start,end,lieu,prix,participantMax,emailCreateur) VALUES("volley","2018-02-28","04:00","09:00","saguenay",0,12,"s.rf@fee.ca")');
}).then(()=> {
  console.log('insert and select table Event');
  return knex.raw('SELECT * FROM Event');
}).then((value) =>{
  console.log(value)
}).then((value) =>{
  return knex('Event').columnInfo()
}).then((cols)=> {
    console.log(cols);
});


//Sport(sport)

knex.raw('DROP TABLE IF EXISTS Sport')
  .then(()=> {
  console.log('Drop table Sport');
  return knex.raw('CREATE TABLE Sport (nom varchar(255) primary key NOT NULL, imageURL varchar(255) NOT NULL, deleted integer(1) DEFAULT 0)');
}).then(()=> {
  console.log('recreate table Sport');
  return knex.raw('INSERT INTO Sport (nom,imageURL) VALUES("volley","https://images.laola1.tv/pool/13320_1920x1080.jpg")');
}).then(()=> {
  console.log('insert and select table Slient');
  return knex.raw('SELECT * FROM Sport');
}).then((value) =>{
  console.log(value)
}).then((value) =>{
  return knex('Client').columnInfo()
}).then((cols)=> {
    console.log(cols);
});

// Participe(participe)
knex.raw('DROP TABLE IF EXISTS Participe')
  .then(()=> {
  console.log('Drop table Participe');
  return knex.raw('CREATE TABLE Participe (id INTEGER primary key NOT NULL, pseudoParticipant varchar(255) NOT NULL, idEvent INTEGER NOT NULL)');
}).then(() => {
  console.log('CREATE table Participe');
});

// Interesse(Interesse)
knex.raw('DROP TABLE IF EXISTS Interesse')
  .then(()=> {
  console.log('Drop table Interesse');
  return knex.raw('CREATE TABLE Interesse (id INTEGER primary key NOT NULL, pseudoInteresse varchar(255) NOT NULL, idEvent INTEGER NOT NULL)');
}).then(() => {
  console.log('CREATE table Interesse');
});