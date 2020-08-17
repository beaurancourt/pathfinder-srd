const express = require('express');
const exphbs = require('express-handlebars');

const bodyParser = require("body-parser");

const mongo = require('mongodb')
const MongoClient = mongo.MongoClient;
const ObjectId = mongo.ObjectId;
const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true });

const pg = require('pg');
const pgClient = new pg.Client({ connectionString: process.env.DATABASE_URL });

pgClient.connect((err) => {
  if (err) throw err;

  client.connect((err) => {
    if (err) {
      console.log(err)
    } else {
      console.log("Connected successfully to server");
    }

    const db = client.db("heroku_d8hk9vs8");
    const actionTable = db.collection('actions');
    const armorTable = db.collection('armor');
    const conditionTable = db.collection('conditions');
    const featTable = db.collection('feats');
    const hazardTable = db.collection('hazards');
    const itemTable = db.collection('items');
    const spellTable = db.collection('spells');
    const tableTable = db.collection('tables');
    const traitTable = db.collection('traits');
    const weaponTable = db.collection('weapons');

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
      pgClient.query("select info from creatures order by info ->> 'name'", (err, result) => {
        res.render('creatures', {'creatures': result.rows.map(row => row.info)});
      });
    };

    app.get('/', renderCreatures);

    app.get('/actions', (req, res) => {
      actionTable.find().sort({"name": 1}).toArray((err, actions) => {
        res.render('actions', {'actions': actions});
      });
    });
    app.get('/actions/:actionName', (req, res) => {
      actionTable.findOne({'name': req.params.actionName}, (err, action) => {
        res.render('action', action)
      })
    })

    app.get('/armors', (req, res) => {
      armorTable.find().sort({"name": 1}).toArray((err, armors) => {
        res.render('armors', {'armors': armors});
      });
    });
    app.get('/armors/:armorName', (req, res) => {
      armorTable.findOne({'name': req.params.armorName}, (err, armor) => {
        res.render('armor', armor);
      });
    });

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
      pgClient.query({
        text: "select info from creatures where info ->> 'name' = $1",
        values: [req.params.creatureName]
      }, (err, result) => {
        res.render('creature', result.rows[0].info);
      })
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

    app.get('/items', (req, res) => {
      itemTable.find().sort({"name": 1}).toArray((err, items) => {
        res.render('items', {'items': items});
      })
    });

    app.get('/items/:itemName', (req, res) => {
      itemTable.findOne({'name': req.params.itemName}, (err, item) => {
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
    });
    app.get('/traits/:traitName', (req, res) => {
      traitTable.findOne({name: req.params.traitName}, (err, trait) => {
        res.render('trait', trait)
      });
    });

    app.get('/tables', (req, res) => {
      tableTable.find().sort({"name": 1}).toArray((err, tables) => {
        res.render('tables', {tables: tables});
      });
    });
    app.get('/tables/:tableName', (req, res) => {
      tableTable.findOne({name: req.params.tableName}, (err, table) => {
        res.render('table', table)
      });
    });

    app.get('/weapons', (req, res) => {
      weaponTable.find().sort({"name": 1}).toArray((err, weapons) => {
        res.render('weapons', {weapons: weapons});
      });
    });
    app.get('/weapons/:weaponName', (req, res) => {
      weaponTable.findOne({name: req.params.weaponName}, (err, weapon) => {
        res.render('weapon', weapon);
      });
    });

    app.get('/api/creatures', (req, res) => {
      pgClient.query("select info from creatures order by info ->> 'name'", (err, result) => {
        res.json(result.rows.map(row => row.info));
      });
    })

    app.get('/api/search/:query', (req, res) => {
      const regex = new RegExp(req.params.query, 'i');
      const postgresRegex = "%" + req.params.query + "%";

      const actionResults = actionTable
        .find({'name': {$regex: regex}})
        .toArray()
        .then(actions => {
          return (actions || []).map(action => {
            return {'display': `${action.name} - Action`, 'value': `/actions/${action.name}`}
          });
        })

      const armorResults = armorTable
        .find({'name': {$regex: regex}})
        .toArray()
        .then(armors => {
          return (armors || []).map(armor => {
            return {'display': `${armor.name} - Armor`, 'value': `/armors/${armor.name}`}
          });
        })

      const creatureResults = pgClient
        .query("select info ->> 'name' as name from creatures where info ->> 'name' ilike $1", [postgresRegex])
        .then(result => {
          return result.rows.map(creature => {
            return {'display': `${creature.name} - Creature`, 'value': `/creatures/${creature.name}`}
          })
        })

      const itemResults = itemTable
        .find({'name': {$regex: regex}})
        .toArray()
        .then(items => {
          return (items || []).map(item => {
            return {'display': `${item.name} - ${item.category}`, 'value': `/items/${item.name}`}
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

      const tableResults = tableTable
        .find({'name': {$regex: regex}})
        .toArray()
        .then(tables => {
          return (tables || []).map(table => {
            return {'display': `${table.name} - Table`, 'value': `/tables/${table.name}`}
          })
        })

      const weaponResults = weaponTable
        .find({'name': {$regex: regex}})
        .toArray()
        .then(weapons => {
          return (weapons || []).map(weapon => {
            return {'display': `${weapon.name} - Weapons`, 'value': `/weapons/${weapon.name}`}
          })
        })

      Promise.all([
        actionResults,
        armorResults,
        conditionResults,
        creatureResults,
        itemResults,
        featResults,
        hazardResults,
        spellResults,
        traitResults,
        tableResults,
        weaponResults
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

})

