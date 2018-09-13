var express = require('express');
var exphbs = require('express-handlebars');
const creatureList = require('./creatures.json');
const spellList = require('./spells.json');

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('creatures', {'creatures': creatureList});
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

app.listen(process.env.PORT || 3000);
