var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./db.sqlite3"
    },
    debug: true,
    useNullAsDefault: true
});

//Utilisateurs (Client)

  console.log('select table Client');
  knex.raw('SELECT * FROM Client')
  .then((value) =>{
  console.log(value)
}).then((value) =>{
  console.log('select table Event');
  return knex.raw('SELECT * FROM Event');
}).then((value) =>{
  console.log(value)
}).then((value) =>{
  console.log('select table Sport');
  return knex.raw('SELECT * FROM Sport');
}).then((value) =>{
  console.log(value)
}).then((value) =>{
  console.log('select table Interesse');
  return knex.raw('SELECT * FROM Interesse');
}).then((value) =>{
  console.log(value)
}).then((value) =>{
  console.log('select table Participe');
  return knex.raw('SELECT * FROM Participe');
}).then((value) =>{
  console.log(value)
});