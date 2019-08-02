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
  const actionTable = db.collection('actions');
  const conditionTable = db.collection('conditions');
  const creatureTable = db.collection('creatures');
  const featTable = db.collection('feats');
  const hazardTable = db.collection('hazards');
  const itemTable = db.collection('items');
  const spellTable = db.collection('spells');
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
    creatureTable.find().sort({"name": 1}).toArray((err, creatures) => {
      res.render('creatures', {'creatures': creatures});
    })
  };

  app.get('/', renderCreatures);

  const tablesByName = {
    'actions': {table: actionTable, key: 'name'},
    'conditions': {table: conditionTable, key: 'name'},
    'creatures': {table: creatureTable, key: 'name'},
    'feats': {table: featTable, key: 'name'},
    'hazards': {table: hazardTable, key: 'name'},
    'magic-items': {table: itemTable, key: 'label'},
    'spells': {table: spellTable, key: 'name'},
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

  app.get('/actions', (req, res) => {
    actionTable.find().sort({"name": 1}).toArray((err, actions) => {
      res.render('actions', {'actions': actions});
    })
  });
  app.get('/actions/:actionName', (req, res) => {
    actionTable.findOne({'name': req.params.actionName}, (err, action) => {
      res.render('action', action)
    })
  })

  app.get('/conditions', (req, res) => {
    conditionTable.find().sort({"name": 1}).toArray((err, conditions) => {
      res.render('conditions', {'conditions': conditions});
    })
  });
  app.get('/conditions/:conditionName', (req, res) => {
    conditionTable.findOne({'name': req.params.conditionName}, (err, condition) => {
      res.render('condition', condition)
    })
  })

  app.get('/creatures', renderCreatures);
  app.get('/creatures/:creatureName', (req, res) => {
    creatureTable.findOne({'name': req.params.creatureName}, (err, creature) => {
      res.render('creature', creature)
    });
  });

  app.get('/encounter', (req, res) => {
    res.render('encounter')
  })

  app.get('/feats', (req, res) => {
    featTable.find().sort({"name": 1}).toArray((err, feats) => {
      feats.forEach(feat => {
        if (feat.traits.includes('Skill')) {
          feat.type = 'Skill'
        } else {
          feat.type = 'General'
        }
      })
      res.render('feats', {feats: feats})
    })
  })
  app.get('/feats/:featName', (req, res) => {
    featTable.findOne({'name': req.params.featName}, (err, feat) => {
      res.render('feat', feat)
    })
  })

  app.get('/hazards', (req, res) => {
    hazardTable.find().sort({"name": 1}).toArray((err, hazards) => {
      res.render('hazards', {'hazards': hazards})
    });
  })
  app.get('/hazards/:hazardName', (req, res) => {
    hazardTable.findOne({'name': req.params.hazardName}, (err, hazard) => {
      res.render('hazard', hazard);
    });
  })

  app.get('/magic-items', (req, res) => {
    itemTable.find().sort({"label": 1}).toArray((err, items) => {
      res.render('items', {'items': items});
    })
  });

  app.get('/magic-items/:itemName', (req, res) => {
    itemTable.findOne({'label': req.params.itemName}, (err, item) => {
      res.render('item', item)
    })
  });

  app.get('/spells', (req, res) => {
    spellTable.find().sort({"name": 1}).toArray((err, spells) => {
      res.render('spells', {'spells': spells})
    })
  })

  app.get('/spells/:spellName', (req, res) => {
    spellTable.findOne({'name': req.params.spellName}, (err, spell) => {
      res.render('spell', spell)
    })
  });

  app.get('/tasks', (req, res) => {
    const mediums = [14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30, 31, 32, 34, 35, 36, 38, 39, 40, 42, 44, 46, 48, 50];
    res.render('tasks', {'levels': [...Array(24).keys()].map(index => {
      const medium = mediums[index];
      return {
        'level': index,
        'ie': medium - 10,
        've': medium - 5,
        'easy': medium -2,
        'medium': medium,
        'hard': medium + 2,
        'vh': medium + 5,
        'ih': medium + 10
      }
    })});
  })

  app.get('/traits', (req, res) => {
    traitTable.find().sort({"name": 1}).toArray((err, traits) => {
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

    const actionResults = actionTable
      .find({'name': {$regex: regex}})
      .toArray()
      .then(actions => {
        return (actions || []).map(action => {
          return {'display': `${action.name} - Action`, 'value': `/actions/${action.name}`}
        })
      })

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

    const hazardResults = hazardTable
      .find({'name': {$regex: regex}})
      .toArray()
      .then(hazards => {
        return (hazards || []).map(hazard => {
          return {'display': `${hazard.name} - Hazard`, 'value': `/hazards/${hazard.name}`}
        })
      })

    const conditionResults = conditionTable
      .find({'name': {$regex: regex}})
      .toArray()
      .then(conditions => {
        return (conditions || []).map(condition => {
          return {'display': `${condition.name} - Condition`, 'value': `/conditions/${condition.name}`}
        })
      })

    const spellResults = spellTable
      .find({'name': {$regex: regex}})
      .toArray()
      .then(spells => {
        return (spells || []).map(spell => {
          return {'display': `${spell.name} - ${spell.type}`, 'value': `/spells/${spell.name}`}
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
      actionResults,
      conditionResults,
      creatureResults,
      magicItemResults,
      featResults,
      hazardResults,
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

