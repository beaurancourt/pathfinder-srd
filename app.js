var express = require('express');
var exphbs = require('express-handlebars');
const conditionList = require('./conditions.json');
const creatureList = require('./creatures.json');
const spellList = require('./spells.json');
const featList = require('./feats.json');
var generator = require('./generateEncounter.js');
var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(express.static('public'))

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

// app.get('/encounter', (req, res) => {
  
//   res.render('encounter')
// })

app.get('/encounter/generate', (req, res) => {

  const urlArray = 
    req.query.list != undefined
    ? req.query.list.split(",").map( creatureInList => 
        creatureList.find((creature) => 
          creature.name == creatureInList)
      ).filter(each => each != undefined)
    
    : null
  
  req.query.list != undefined
  ? urlArray.map( each => each.id = each.name.split("(")[0].split(" ").join(""))
  : null
  
  const creatureObj = req.query.list != undefined
    ? { list: urlArray, url: `${req.query.list}`}
    : generator();

  res.render('encounter', {'encounter':creatureObj})
})

app.listen(process.env.PORT || 3000);
