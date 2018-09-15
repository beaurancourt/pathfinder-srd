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
  if (req.query.list != undefined) {
    const creaturesArray = req.query.list.split(",")
      .map(creatureInList => creatureList.find((creature) => creature.name == creatureInList))
      .filter(creature => creature);
      creaturesArray.forEach(creature => creature.id = creature.name.split("(")[0].split(" ").join(""));
    res.render('encounter', {'encounter': { 
      list: creaturesArray, 
      url: req.query,
    }});
  } else {
    res.render("encounter")
  }
})

app.post("/encounter", (req, res) => {
  const queryUrl = generator(
    req.body.difficulty, 
    parseInt(req.body.totalPlayers), 
    parseInt(req.body.partyLevel)
  );
  res.redirect(`./encounter${queryUrl}`);
})
app.listen(process.env.PORT || 3000);