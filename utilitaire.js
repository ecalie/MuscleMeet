
module.exports = {
   hello: function() {
      return "Hello";
   }
}

module.exports = {
  sportFavoris: async function(user) {
    var knex = require('knex')({
      client: 'sqlite3',
      connection: {
          filename: "./db.sqlite3"
      },
      debug: true,
      useNullAsDefault: true
    });

    // calculer le score par sport
    var scores = {};
    var eventsParticipe = await knex.raw("SELECT * FROM Event, Participe WHERE Participe.pseudoParticipant = ? AND Event.id = Participe.idEvent", [user]);
    var eventInteresse = await knex.raw("SELECT * FROM Event, Interesse WHERE Interesse.pseudoInteresse = ? AND Event.id = Interesse.idEvent", [user]);
    
    for (var i = 0 ; i < eventsParticipe.length ; i++) {
      var sport = eventsParticipe[i].sport;
      if (sport == "Football américain")
        sport="foot";
      else if (sport == "Rugby à XV")
        sport = "Rugby";
      else if (sport == "Football")
        sport = "soccer";
      else if (sport == "Hockey sur glace")
        sport = "Hockey";
      
      if (scores[sport])
        scores[sport] = scores[sport] + 2;
      else
        scores[sport] = 2;
    }
    
    for (var i = 0 ; i < eventInteresse.length ; i++) {
      var sport = eventInteresse[i].sport;
      if (scores[sport])
        scores[sport] = scores[sport] + 1;
      else
        scores[sport] = 1;
    }
    
    // Récupérer les 3 meilleurs scores
    var max = 0;
    var sport1;
    var sport2;
    var sport3;
    for (var key in scores) {
      if (scores[key] >= max) {
        max = scores[key]
        sport3 = sport2;
        sport2 = sport1;
        sport1 = key;
      }        
    }
    var sports = new Object;
    sports =  [sport1, sport2, sport3];
    console.log(sports);
    return sports;
  }
}