const express = require('express');
const exphbs = require('express-handlebars');
const conditionList = require('./conditions.json');
const creatureList = require('./creatures.json');
const spellList = require('./spells.json');
const featList = require('./feats.json');
const generator = require('./generateEncounter.js');
const bodyParser = require("body-parser");

const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const ensureLogin = require('connect-ensure-login');

function loggedIn() {
  return ensureLogin.ensureLoggedIn();
}

passport.use(new Strategy(
  function(username, password, cb) {
    return cb(null,  password == 'mimic');
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, "id");
});

passport.deserializeUser(function(id, cb) {
  cb(null, {});
});

var app = express();

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: {
    select: function(selected, options) {
      return options.fn(this).replace(
        new RegExp(' value=\"' + selected + '\"'),
        '$& selected="selected"'
      );
    }
  }
}));

app.set('view engine', 'handlebars');

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true}));
app.use(require('cookie-parser')());
app.use(bodyParser.json());
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', loggedIn(), (req, res) => {
  res.render('creatures', {'creatures': creatureList});
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/');
});

app.get('/conditions', loggedIn(), (req, res) => {
  res.render('conditions', {'conditions': conditionList});
});

app.get('/creatures', loggedIn(), (req, res) => {
  res.render('creatures', {'creatures': creatureList});
});

app.get('/creatures/:creatureName', loggedIn(), (req, res) => {
  const creature = creatureList.find((creature) => creature.name == req.params.creatureName)
  res.render('creature', creature)
});

app.get('/spells', loggedIn(), (req, res) => {
  res.render('spells', {'spells': spellList})
})

app.get('/spells/:spellName', loggedIn(), (req, res) => {
  const spell = spellList.find((spell) => spell.name == req.params.spellName)
  res.render('spell', spell)
});

app.get('/classes/:className', loggedIn(), (req, res) => {
  res.render('classes/' + req.params.className);
})

app.get('/feats', loggedIn(), (req, res) => {
  res.render('feats', {'feats': featList})
})

app.get('/encounter', loggedIn(), (req, res) => {
  const query = req.query;
  if (query.list) {
    const creaturesArray = query.list.split(",")
      .map(creatureInList => creatureList.find((creature) => creature.name == creatureInList))
      .filter(creature => creature);

    var creatureCount = {};
    creaturesArray.forEach(creature => {
      creature.id = creature.name.split("(")[0].trim().split(" ").join("")
      const perception = parseInt((creature.perception || "0").match(/[-+]?\d+/)[0]);
      creatureCount[creature.name] = (creatureCount[creature.name] || 0) + 1;
      creature.editorDescription = `${10 + perception} ${creature.name}#${creatureCount[creature.name]} ${creature.hp}`
    });
    res.render('encounter', {
      list: creaturesArray,
      url: req.url,
      difficulty: query.difficulty,
      totalPlayers: query.totalPlayers,
      partyLevel: query.partyLevel
    });
  } else {
    res.render('encounter', {
      difficulty: 'High',
      totalPlayers: 4,
      partyLevel: 4
    });
  }
});

app.post('/encounter', loggedIn(), (req, res) => {
  const query = req.body;
  const encounterInfo = generator(query.difficulty, parseInt(query.totalPlayers), parseInt(query.partyLevel));
  res.redirect(encounterInfo.url)
});

app.listen(process.env.PORT || 3000);
