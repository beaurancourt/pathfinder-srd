const express = require('express');
const exphbs = require('express-handlebars');

const conditionList = require('./conditions.json');
const creatureList = require('./creatures.json');
const itemList = require('./items.json');
const spellList = require('./spells.json');
const featList = require('./feats.json');

const generator = require('./generateEncounter.js');
const bodyParser = require("body-parser");

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.MONGODB_URI);

client.connect((err) => {
  if (err) {
    console.log(err)
  } else {
    console.log("Connected successfully to server");
  }

  const db = client.db("heroku_d8hk9vs8");
  const conditions = db.collection('conditions');
  const creatures = db.collection('creatures');
  const items = db.collection('items');
  const spells = db.collection('spells');
  const feats = db.collection('feats');

  let app = express();

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

  app.get('/', (req, res) => {
    res.render('creatures', {'creatures': creatureList});
  });

  app.get('/classes/:className', (req, res) => {
    res.render('classes/' + req.params.className);
  })

  app.get('/conditions', (req, res) => {
    res.render('conditions', {'conditions': conditionList});
  });

  app.get('/creatures', (req, res) => {
    creatures.find().toArray((err, creatures) => {
      res.render('creatures', {'creatures': creatures});
    })
  });

  app.get('/creatures/:creatureName', (req, res) => {
    creatures.findOne({'name': req.params.creatureName}, (err, creature) => {
      if (!err) {
        console.log(err)
      }
      res.render('creature', creature)
    });
  });

  app.get('/encounter', (req, res) => {
    const query = req.query;
    if (query.list) {
      const creaturesArray = query.list.split(",")
        .map(creatureInList => creatureList.find((creature) => creature.name == creatureInList))
        .filter(creature => creature);

      let creatureCount = {};
      let parsedCreatures = [];
      creaturesArray.forEach(creature => {
        let clonedCreature = Object.assign({}, creature);
        creature.id = creature.name.split("(")[0].trim().split(" ").join("")
        const perception = parseInt((creature.perception || "0").match(/[-+]?\d+/)[0]);
        creatureCount[creature.name] = (creatureCount[creature.name] || 0) + 1;
        clonedCreature.editorDescription = `${10 + perception} ${creature.name}#${creatureCount[creature.name]} ${creature.hp}`
        parsedCreatures.push(clonedCreature);
      });
      res.render('encounter', {
        list: parsedCreatures,
        url: req.url,
        difficulty: query.difficulty,
        totalPlayers: query.totalPlayers,
        partyLevel: query.partyLevel,
        tags: (query.tags || '')
      });
    } else {
      res.render('encounter', {
        difficulty: 'High',
        totalPlayers: 4,
        partyLevel: 4,
        tags: (query.tags || '')
      });
    }
  });

  app.post('/encounter', (req, res) => {
    const query = req.body;
    const encounterInfo = generator(
      query.difficulty,
      parseInt(query.totalPlayers),
      parseInt(query.partyLevel),
      (query.tags || "").split(' ').filter(x => x)
    );
    res.redirect(encounterInfo.url)
  });

  app.get('/feats', (req, res) => {
    res.render('feats', {'feats': featList})
  })

  app.get('/magic-items', (req, res) => {
    res.render('items', {'items': itemList});
  });

  app.get('/magic-items/:itemName', (req, res) => {
    const item = itemList.find((item) => item.label == req.params.itemName)
    res.render('item', item)
  });

  app.get('/spells', (req, res) => {
    res.render('spells', {'spells': spellList})
  })

  app.get('/spells/:spellName', (req, res) => {
    const spell = spellList.find((spell) => spell.name == req.params.spellName)
    res.render('spell', spell)
  });

  app.get('/tasks', (req, res) => {
    const mediums = [11, 13, 14, 15, 16, 18, 19, 21, 22, 23, 24, 25, 26, 28, 29, 30, 32, 33, 34, 35, 36, 38, 39, 41];
    const hards = [13, 15, 16, 17, 18, 20, 21, 22, 24, 26, 27, 28, 29, 30, 31, 33, 34, 36, 37, 38, 39, 41, 43, 45];
    const incredibles = [14, 16, 17, 19, 20, 22, 23, 26, 27, 29, 31, 32, 33, 35, 36, 37, 38, 40, 41, 42, 43, 45, 47, 49];
    const ultimates = [16, 18, 19, 20, 21, 23, 25, 27, 28, 30, 32, 33, 34, 36, 38, 40, 41, 43, 44, 45, 47, 49, 51, 53];
    res.render('tasks', {'levels': [...Array(24).keys()].map(index => {
      return {
        'level': index,
        'easy': index + 7,
        'medium': mediums[index],
        'hard': hards[index],
        'incredible': incredibles[index],
        'ultimate': ultimates[index]
      }
    })});
  })

  app.get('/traits', (req, res) => {
    res.render('traits');
  })

  app.listen(process.env.PORT || 3000);
});

