var express = require('express');
var exphbs = require('express-handlebars');
const conditionList = require('./conditions.json');
const creatureList = require('./creatures.json');
const spellList = require('./spells.json');
const featList = require('./feats.json');
const generator = require('./generateEncounter.js');
const bodyParser = require("body-parser");

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
})

app.post('/encounter', (req, res) => {
  const query = req.body;
  const encounterInfo = generator(query.difficulty, parseInt(query.totalPlayers), parseInt(query.partyLevel));
  res.redirect(encounterInfo.url)
});

app.listen(process.env.PORT || 3000);
