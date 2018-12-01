 
function includeHeader(user) {
  document.write("<header>\
      <nav class=\"navbar navbar-expand-lg navbar-primary\" role=\"navigation\">\
        <div class=\"container-fluid\">\
          <ul class=\"nav navbar-nav\">\
            <li class=\"active\">\
              <a href=\"/\">\
                Rencontres Sportives\
              </a>\
            </li>\
          </ul>\
          <ul class=\"nav navbar-nav navbar-right\">\
            ");
            if (user){
              document.write("<li><a href=\"/creer_evenement\">\
              <i class=\"fas fa-map-marker-alt\"></i>\
              Créer un évènement\
            </a></li>\
            <li><a href=\"/profil\">\
              <i class=\"fas fa-user-circle\"></i>\
              Mon profil\
            </a></li>\
            <li><a href=\"/deconnexion\">\
              <i class=\"fas fa-power-off\"></i>\
      				Me déconnecter\
            </a></li>\
            ");}else{
              document.write("<li><a href=\"/inscription\">\
              <i class=\"fas fa-user\"></i>\
              Inscription\
            </a></li>\
            <li><a href=\"/connexion\">\
              <i class=\"fas fa-sign-in-alt\"></i>\
            Connexion\
            </a></li>\
")};
        document.write("</ul>\
          </div>\
      </nav>\
    </header>");
              
}

 
function includePub(sport1, sport2) {
  if (!sport1)
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubhockey.png?1543593034537\"> ");
  if (!sport2)
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubbasket.png?1543593033297\"> ");
  if (sport1 === "soccer" || sport2 === "soccer")
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubsoccer.png?1543593035271\"> ");
  if (sport1 === "foot" || sport2 === "foot")
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubfoot.png?1543593033568\"> ");
  if (sport1 === "Rugby" || sport2 === "Rugby")
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubrugby.png?1543593034952\"> ");
  if (sport1 === "Hockey" || sport2 === "Hockey")
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubhockey.png?1543593034537\"> ");
  if (sport1 === "Handball" || sport2 === "Handball")
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubhand.png?1543593034181\"> ");
  if (sport1 === "Volley" || sport2 === "HockVolleyey")
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubvolley.png?1543593035622\"> ");
  if (sport1 === "Badminton" || sport2 === "Badminton")
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubbad.png?1543593033798\"> ");
  if (sport1 === "Basket-ball" || sport2 === "Basket-ball")
    document.write("<img src=\"https://cdn.glitch.com/b98fcf81-62d6-405c-8b74-201922f8dbaa%2Fpubbasket.png?1543593033297\"> ");
}

/*
function publicity(){
}

function sportFinder() {
  var sports= fs.readFile();
  var sport = sports.split(", ");
    //document.getElementById("demo").innerHTML = res;
  
}

 fs.readFile('sports.txt', 'utf8', function(err, data) {  
    if (err) throw err;
    console.log(data);
  return data;
});

function strFinder(str) {
  var find=document.body.innerHTML.search(str);
  if (find>0)
    return true;
  else
    return false;
}*/