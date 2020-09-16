const express = require('express');
const exphbs = require('express-handlebars');

const bodyParser = require("body-parser");

const actionsByName = require('./data/actions');
const sortedActions = Object.values(actionsByName).sort((a, b) => a.name < b.name);

const armorsByName = require('./data/armor');
const sortedArmors = Object.values(armorsByName).sort((a, b) => a.name < b.name);

const conditionsByName = require('./data/conditions');
const sortedConditions = Object.values(conditionsByName).sort((a, b) => a.name < b.name);

const creaturesByName = require('./data/creatures');
const sortedCreatures = Object.values(creaturesByName).sort((a, b) => a.name < b.name);

const featsByName = require('./data/feats')
const sortedFeats = Object.values(featsByName).sort((a, b) => a.name < b.name);

const hazardsByName = require('./data/hazards')
const sortedHazards = Object.values(hazardsByName).sort((a, b) => a.name < b.name);

const itemsByName = require('./data/items')
const sortedItems = Object.values(itemsByName).sort((a, b) => a.name < b.name);

const spellsByName = require('./data/spells')
const sortedSpells = Object.values(spellsByName).sort((a, b) => a.name < b.name);

const tablesByName = require('./data/tables')
const sortedTables = Object.values(tablesByName).sort((a, b) => a.name < b.name);

const traitsByName = require('./data/traits')
const sortedTraits = Object.values(traitsByName).sort((a, b) => a.name < b.name);

const weaponsByName = require('./data/weapons')
const sortedWeapons = Object.values(weaponsByName).sort((a, b) => a.name < b.name);

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
  res.render('creatures', {'creatures': sortedCreatures});
};

app.get('/', renderCreatures);

app.get('/actions', (req, res) => {
  res.render('actions', {'actions': sortedActions});
});
app.get('/actions/:actionName', (req, res) => {
  res.render('action', actionsByName[req.params.actionName]);
})

app.get('/armors', (req, res) => {
  res.render('armors', {'armors': sortedArmors});
});
app.get('/armors/:armorName', (req, res) => {
  res.render('armor', armorsByName[req.params.armorName]);
});

app.get('/conditions', (req, res) => {
  res.render('conditions', {'conditions': sortedConditions});
});
app.get('/conditions/:conditionName', (req, res) => {
  res.render('condition', conditionsByName[req.params.conditionName]);
})

app.get('/creatures', renderCreatures);
app.get('/creatures/:creatureName', (req, res) => {
  res.render('creature', creaturesByName[req.params.creatureName])
});

app.get('/encounter', (req, res) => {
  res.render('encounter')
})

app.get('/feats', (req, res) => {
  sortedFeats.forEach(feat => {
    if (feat.traits.includes('Skill')) {
      feat.type = 'Skill'
    } else {
      feat.type = 'General'
    }
  })
  res.render('feats', {feats: sortedFeats});
})
app.get('/feats/:featName', (req, res) => {
  res.render('feat', featsByName[req.params.featName]);
})

app.get('/hazards', (req, res) => {
  res.render('hazards', {'hazards': sortedHazards});
})
app.get('/hazards/:hazardName', (req, res) => {
  res.render('hazard', hazardsByName[req.params.hazardName]);
})

app.get('/items', (req, res) => {
  res.render('items', {'items': sortedItems});
});
app.get('/items/:itemName', (req, res) => {
  res.render('item', itemsByName[req.params.itemName]);
});

app.get('/spells', (req, res) => {
  res.render('spells', {'spells': sortedSpells});
})
app.get('/spells/:spellName', (req, res) => {
  res.render('spell', spellsByName[req.params.spellName]);
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

app.get('/tables', (req, res) => {
  res.render('tables', {tables: sortedTables});
});
app.get('/tables/:tableName', (req, res) => {
  res.render('table', tablesByName[req.params.tableName]);
});

app.get('/traits', (req, res) => {
  res.render('traits', {traits: sortedTraits});
});
app.get('/traits/:traitName', (req, res) => {
  res.render('trait', traitsByName[req.params.traitName]);
});

app.get('/weapons', (req, res) => {
  res.render('weapons', {weapons: sortedWeapons});
});
app.get('/weapons/:weaponName', (req, res) => {
  res.render('weapon', weaponsByName[req.params.weaponName]);
});

app.get('/api/creatures', (req, res) => {
  res.json(sortedCreatures);
})

app.get('/api/search/:query', (req, res) => {
  const regex = new RegExp(req.params.query, 'i');
  const r = RegExp(".*" + req.params.query + ".*", 'i');
  const postgresRegex = "%" + req.params.query + "%";

  const actionResults = new Promise((resolve, reject) => {
    resolve(
      sortedActions
        .filter(action => regex.test(action.name))
        .map(action => { return {'display': `${action.name} - Action`, 'value': `/actions/${action.name}`} })
    );
  });

  const armorResults = new Promise((resolve, reject) => {
    resolve(
      sortedArmors
        .filter(armor => regex.test(armor.name))
        .map(armor => { return {'display': `${armor.name} - Armor`, 'value': `/armors/${armor.name}`} })
    );
  });

  const conditionResults = new Promise((resolve, reject) => {
    resolve(
      sortedConditions
        .filter(condition => regex.test(condition.name))
        .map(condition => { return {'display': `${condition.name} - Condition`, 'value': `/conditions/${condition.name}`} })
    );
  });

  const creatureResults = new Promise((resolve, reject) => {
    resolve(
      sortedCreatures
        .filter(creature => regex.test(creature.name))
        .map(creature => { return {'display': `${creature.name} - Creature`, 'value': `/creatures/${creature.name}`} })
    );
  });

  const featResults = new Promise((resolve, reject) => {
    resolve(
      sortedFeats
        .filter(feat => regex.test(feat.name))
        .map(feat => { return {'display': `${feat.name} - Feat`, 'value': `/feats/${feat.name}`} })
    );
  });

  const hazardResults = new Promise((resolve, reject) => {
    resolve(
      sortedHazards
        .filter(hazard => regex.test(hazard.name))
        .map(hazard => { return {'display': `${hazard.name} - Hazard`, 'value': `/hazards/${hazard.name}`} })
    );
  });

  const itemResults = new Promise((resolve, reject) => {
    resolve(
      sortedItems
        .filter(item => regex.test(item.name))
        .map(item => { return {'display': `${item.name} - ${item.category}`, 'value': `/items/${item.name}`} })
    );
  });

  const spellResults = new Promise((resolve, reject) => {
    resolve(
      sortedSpells
        .filter(spell => regex.test(spell.name))
        .map(spell => { return {'display': `${spell.name} - ${spell.type}`, 'value': `/spells/${spell.name}`} })
    );
  });

  const tableResults = new Promise((resolve, reject) => {
    resolve(
      sortedTables
        .filter(table => regex.test(table.name))
        .map(table => { return {'display': `${table.name} - Table`, 'value': `/tables/${table.name}`} })
    );
  });

  const traitResults = new Promise((resolve, reject) => {
    resolve(
      sortedTraits
        .filter(trait => regex.test(trait.name))
        .map(trait => { return {'display': `${trait.name} - Trait`, 'value': `/traits/${trait.name}`} })
    );
  });

  const weaponResults = new Promise((resolve, reject) => {
    resolve(
      sortedWeapons
        .filter(weapon => regex.test(weapon.name))
        .map(weapon => { return {'display': `${weapon.name} - Weapon`, 'value': `/weapons/${weapon.name}`} })
    );
  });

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
