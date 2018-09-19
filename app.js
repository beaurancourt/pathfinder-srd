var express = require('express');
var exphbs = require('express-handlebars');
const conditionList = require('./conditions.json');
const creatureList = require('./creatures.json');
const spellList = require('./spells.json');
const featList = require('./feats.json');
const generator = require('./generateEncounter.js');
const bodyParser = require("body-parser");

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.render('creatures', {'creatures': creatureList});
});

app.get('/conditions', (req, res) => {
  res.render('conditions', {'conditions': conditionList});
});

app.get('/creatures', (req, res) => {
  res.render('creatures', {'creatures': creatureList});
});

app.get('/creatures/:creatureName', (req, res) => {
  const creature = creatureList.find((creature) => creature.name == req.params.creatureName)
  res.render('creature', creature)
});

app.get('/spells', (req, res) => {
  res.render('spells', {'spells': spellList})
})

app.get('/spells/:spellName', (req, res) => {
  const spell = spellList.find((spell) => spell.name == req.params.spellName)
  res.render('spell', spell)
});

app.get('/classes/:className', (req, res) => {
  res.render('classes/' + req.params.className);
})

app.get('/feats', (req, res) => {
  res.render('feats', {'feats': featList})
})

app.get('/encounter', (req, res) => {
  const query = req.query;
  if (query.list) {
    const creaturesArray = query.list.split(",")
      .map(creatureInList => creatureList.find((creature) => creature.name == creatureInList))
      .filter(creature => creature);

    creaturesArray.forEach(creature => creature.id = creature.name.split("(")[0].trim().split(" ").join(""));
    res.render('encounter', {'encounter': { 
      list: creaturesArray, 
      url: req.url,
      difficulty: query.difficulty,
      totalPlayers: query.totalPlayers,
      partyLevel: query.partyLevel
    }});
  } else if (query.partyLevel && query.totalPlayers && query.difficulty) {
    const encounterInfo = generator(query.difficulty, parseInt(query.totalPlayers), parseInt(query.partyLevel));
    res.render('encounter', {'encounter': encounterInfo});
  } else {
    res.render('encounter');
  }
})

app.listen(process.env.PORT || 3000);