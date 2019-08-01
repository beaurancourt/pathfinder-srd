const express = require('express');
const exphbs = require('express-handlebars');

const generateEncounter = require('./generateEncounter.js');
const bodyParser = require("body-parser");

const mongo = require('mongodb')
const MongoClient = mongo.MongoClient;
const ObjectId = mongo.ObjectId;
const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true });

client.connect((err) => {
  if (err) {
    console.log(err)
  } else {
    console.log("Connected successfully to server");
  }

  const db = client.db("heroku_d8hk9vs8");
  const conditionTable = db.collection('conditions');
  const creatureTable = db.collection('creatures');
  const itemTable = db.collection('items');
  const spellTable = db.collection('spells');
  const featTable = db.collection('feats');
  const traitTable = db.collection('traits');

  let app = express();

  app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    helpers: {
      select: function(selected, options) {
        return options.fn(this).replace(
          new RegExp(' value=\"' + selected + '\"'),
          '$& selected="selected"'
        );
      },
      'vue-js': function(options) {
        return options.fn();
      }
    }
  }));

  app.set('view engine', 'handlebars');

  app.use(express.static('public'))
  app.use(bodyParser.urlencoded({ extended: true}));
  app.use(require('cookie-parser')());
  app.use(bodyParser.json());
  app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

  const renderCreatures = (req, res) => {
    creatureTable.find().toArray((err, creatures) => {
      res.render('creatures', {'creatures': creatures});
    })
  };

  app.get('/', renderCreatures);

  const tablesByName = {
    'conditions': {table: conditionTable, key: 'label'},
    'creatures': {table: creatureTable, key: 'name'},
    'magic-items': {table: itemTable, key: 'label'},
    'spells': {table: spellTable, key: 'name'},
    'feats': {table: featTable, key: 'name'},
    'traits': {table: traitTable, key: 'name'}
  }

  app.get("/:tableName/:entityName/edit", (req, res) => {
    const {table, key} = tablesByName[req.params.tableName];
    let query = {}
    query[key] = req.params.entityName;
    table.findOne(query, (err, entity) => {
      res.render('edit', {'json': JSON.stringify(entity)})
    })
  })

  app.post("/:tableName/:entityName/edit", (req, res) => {
    const {table, key} = tablesByName[req.params.tableName];
    const json = req.body;
    const id = ObjectId(json._id)
    delete json._id
    table.updateOne({'_id': id}, {$set: json}).then(() => {
      res.redirect(`/${req.params.tableName}/${req.params.entityName}`)
    })
  })

  app.get('/classes/:className', (req, res) => {
    res.render('classes/' + req.params.className);
  })

  app.get('/conditions', (req, res) => {
    conditionTable.find().toArray((err, conditions) => {
      res.render('conditions', {'conditions': conditions});
    })
  });

  app.get('/conditions/:conditionName', (req, res) => {
    conditionTable.findOne({'label': req.params.conditionName}, (err, condition) => {
      res.render('condition', condition)
    })
  })

  app.get('/creatures', renderCreatures);

  app.get('/creatures/:creatureName', (req, res) => {
    creatureTable.findOne({'name': req.params.creatureName}, (err, creature) => {
      if (err) {
        console.log(err)
      }
      res.render('creature', creature)
    });
  });

  app.get('/encounter', (req, res) => {
    res.render('encounter')
  })

  app.get('/feats', (req, res) => {
    featTable.find().toArray((err, feats) => {
      res.render('feats', {'feats': feats})
    })
  })

  app.get('/feats/:featName', (req, res) => {
    featTable.findOne({'name': req.params.featName}, (err, feat) => {
      res.render('feat', feat)
    })
  })

  app.get('/magic-items', (req, res) => {
    itemTable.find().toArray((err, items) => {
      res.render('items', {'items': items});
    })
  });

  app.get('/magic-items/:itemName', (req, res) => {
    itemTable.findOne({'label': req.params.itemName}, (err, item) => {
      res.render('item', item)
    })
  });

  app.get('/spells', (req, res) => {
    spellTable.find().toArray((err, spells) => {
      res.render('spells', {'spells': spells})
    })
  })

  app.get('/spells/:spellName', (req, res) => {
    spellTable.findOne({'name': req.params.spellName}, (err, spell) => {
      res.render('spell', spell)
    })
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
    traitTable.find().toArray((err, traits) => {
      res.render('traits', {traits: traits});
    });
  })

  app.get('/traits/:traitName', (req, res) => {
    traitTable.findOne({name: req.params.traitName}, (err, trait) => {
      res.render('trait', trait)
    });
  })

  app.get('/api/creatures', (req, res) => {
    creatureTable.find().toArray().then(creatures => {
      res.json(creatures)
    })
  })

  app.get('/api/search/:query', (req, res) => {
    const regex = new RegExp('.*' + req.params.query + '.*', 'i');
    const creatureResults = creatureTable
      .find({'name': {$regex: regex}})
      .toArray()
      .then(creatures => {
        return (creatures || []).map(creature => {
          return {'display': `${creature.name} - Creature`, 'value': `/creatures/${creature.name}`}
        })
      })

    const magicItemResults = itemTable
      .find({'label': {$regex: regex}})
      .toArray()
      .then(items => {
        return (items || []).map(item => {
          return {'display': `${item.label} - Item`, 'value': `/magic-items/${item.label}`}
        })
      })

    const featResults = featTable
      .find({'name': {$regex: regex}})
      .toArray()
      .then(feats => {
        return (feats || []).map(feat => {
          return {'display': `${feat.name} - Feat`, 'value': `/feats/${feat.name}`}
        })
      })

    const conditionResults = conditionTable
      .find({'label': {$regex: regex}})
      .toArray()
      .then(conditions => {
        return (conditions || []).map(condition => {
          return {'display': `${condition.label} - Condition`, 'value': `/conditions/${condition.label}`}
        })
      })

    const spellResults = spellTable
      .find({'name': {$regex: regex}})
      .toArray()
      .then(spells => {
        return (spells || []).map(spell => {
          return {'display': `${spell.name} - Spell`, 'value': `/spells/${spell.name}`}
        })
      })

    const traitResults = traitTable
      .find({'name': {$regex: regex}})
      .toArray()
      .then(traits => {
        return (traits || []).map(trait => {
          return {'display': `${trait.name} - Trait`, 'value': `/traits/${trait.name}`}
        })
      })

    Promise.all([
      creatureResults,
      magicItemResults,
      featResults,
      conditionResults,
      spellResults,
      traitResults
    ]).then(results => {
      let flatResults = results.reduce((soFar, result) => soFar.concat(result), []);
      flatResults.sort((a, b) => {
        if (a.display < b.display) {
          return -1
        }
        return 1
      });

      res.json(flatResults)
    })
  })

  app.listen(process.env.PORT || 3000);
});

