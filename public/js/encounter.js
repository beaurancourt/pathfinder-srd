let xpForAdjustedLevel = new Map();
xpForAdjustedLevel.set(-4, 10);
xpForAdjustedLevel.set(-3, 15);
xpForAdjustedLevel.set(-2, 20);
xpForAdjustedLevel.set(-1, 30);
xpForAdjustedLevel.set(0, 40);
xpForAdjustedLevel.set(1, 60);
xpForAdjustedLevel.set(2, 80);
xpForAdjustedLevel.set(3, 120);
xpForAdjustedLevel.set(4, 160);

var app = new Vue({
  el: '#app',
  data: {
    partyLevelText: localStorage.getItem('partyLevel') || '5',
    numberOfMembersText: localStorage.getItem('numberOfMembers') || '5',
    allCreatures: [],
    selectedCreatures: []
  },
  computed: {
    keyedCreatures: function() {
      let result = {};
      this.allCreatures.forEach(creature => {
        result[creature._id] = creature;
      });
      return result;
    },
    selectedIds: function() {
      let result = {};
      this.selectedCreatures.forEach(creature => {
        result[creature._id] = creature;
      });
      return result;
    },
    partyLevel: function() {
      return parseInt(this.partyLevelText);
    },
    numberOfMembers: function() {
      return parseInt(this.numberOfMembersText);
    },
    encounterXp: function() {
      return this.selectedCreatures.reduce((soFar, creature) => {
        return soFar + creature.quantity * xpForAdjustedLevel.get(creature.level - this.partyLevel);
      }, 0);
    },
    displayedXp: function() {
      return Math.round(this.encounterXp * 4 / this.numberOfMembers / 10) * 10;
    },
    difficulty: function() {
      const adjustmentSize = this.numberOfMembers - 4;
      if (this.encounterXp <= 40 + adjustmentSize * 10) {
        return 'Trivial';
      } else if (this.encounterXp <= 60 + adjustmentSize * 15) {
        return 'Low';
      } else if (this.encounterXp <= 80 + adjustmentSize * 20) {
        return 'Moderate';
      } else if (this.encounterXp <= 120 + adjustmentSize * 30) {
        return 'Severe';
      } else if (this.encounterXp <= 160 + adjustmentSize * 40) {
        return 'Extreme';
      } else {
        return 'TPK';
      }
    },
    encounterUrl: function() {
      const creaturesString = this.selectedCreatures
        .map(creature => {
          if (creature.adjustment) {
            return Array(creature.quantity).fill(creature.adjustment + " " + creature.name)
          } else {
            return Array(creature.quantity).fill(creature.name)
          }
        })
        .flat()
        .join(",");
      const rawString = `/encounter/?list=${creaturesString}&totalPlayers=${this.numberOfMembers}&partyLevel=${this.partyLevel}`;
      return encodeURI(rawString);
    },
    encounterCodeExport: function() {
      let lines = [];
      this.selectedCreatures.forEach(creature => {
        let perception = 0;
        if (creature.perception) {
          perception = parseInt((creature.perception || "0").match(/[-+]?\d+/)[0]);
        } else {
          const perceptionInfo = creature.information.filter(info => info.label === "Perception")[0] || {};
          perception = parseInt((perceptionInfo.description || "0").match(/[-+]?\d+/)[0]);
        }
        const creatureInit = Math.floor(Math.random() * 20) + 1 + perception;
        for (let i = 1; i <= creature.quantity; i++) {
          lines.push(`${creatureInit} ${creature.name}#${i} - ${creature.HP}`);
        }
      })
      return lines.join("\n");
    },
    appropriateCreatures: function() {
      return this.allCreatures.filter(creature => {
        return creature.level <= app.partyLevel + 1 && creature.level >= app.partyLevel - 1;
      }).sort(function(a, b) {
        if (a.level < b.level) {
          return -1;
        } else if (a.level > b.level) {
          return 1;
        } else {
          return a.name > b.name;
        }
      });
    }
  },
  methods: {
    removeCreature: function(creature) {
      const creatureIndex = this.selectedCreatures.indexOf(creature);
      if (creature.quantity == 1) {
        this.selectedCreatures.splice(creatureIndex, 1)
      } else {
        creature.quantity = creature.quantity - 1;
        Vue.set(this.selectedCreatures, creatureIndex, creature);
        window.history.pushState("", "", this.encounterUrl);
      }
    },
    addCreature: function(creature) {
      if (creature.quantity) {
        creature.quantity = creature.quantity + 1;
        Vue.set(this.selectedCreatures, this.selectedCreatures.indexOf(creature), creature);
      } else {
        creature.quantity = 1;
        this.selectedCreatures.push(creature);
      }
      window.history.pushState("", "", this.encounterUrl);
    },
    strengthenCreature: function(creature) {
      const newCreature = strengthenCreature(creature);
      this.removeCreature(creature);
      this.addCreature(newCreature);
    },
    weakenCreature: function(creature) {
      const newCreature = weakenCreature(creature);
      this.removeCreature(creature);
      this.addCreature(newCreature);
    },
    strengthenCreature: function(creature) {
      creature.name = "Elite " + creature.name;
      let hpIncrease = 0;
      if (creature.level <= 1) {
        hpIncrease = 10;
      } else if (creature.level <= 4) {
        hpIncrease = 15;
      } else if (creature.level <= 19) {
        hpIncrease = 20;
      } else {
        hpIncrease = 30;
      }
      creature.level = parseInt(creature.level) + 1
      creature.HP = extractAndModify(creature.HP, "", hpIncrease);
      creature.AC = extractAndModify(creature.AC, "", 2);
      creature.saves.Fort = extractAndModify(creature.saves.Fort, "", 2);
      creature.saves.Ref = extractAndModify(creature.saves.Ref, "", 2);
      creature.saves.Will = extractAndModify(creature.saves.Will, "", 2);
      if (creature.perception) {
        creature.perception = extractAndModify(creature.perception, "Perception ", 2);
      } else {
        let perceptionLine = creature.information.filter(info => info.description.includes("Perception"))[0];
        if (perceptionLine) {
          perceptionLine.description = extractAndModify(perceptionLine.description, "Perception ", 2);
        }
      }
      creature.combat.forEach(line => {
        if (line.label == "Melee" || line.label == "Ranged" || line.label == "Damage") {
          line.description = line.description + " +2 (elite bonus)"
        }
      })
      return creature;
    },
    weakenCreature: function(creature) {
      creature.name = "Weak " + creature.name;
      let hpDecrease = 0;
      if (creature.level <= 2) {
        hpDecrease = -10;
      } else if (creature.level <= 5) {
        hpDecrease = -15;
      } else if (creature.level <= 20) {
        hpDecrease = -20;
      } else {
        hpDecrease = -30;
      }
      creature.level = parseInt(creature.level) - 1
      creature.HP = extractAndModify(creature.HP, "", hpDecrease);
      creature.AC = extractAndModify(creature.AC, "", -2);
      creature.saves.Fort = extractAndModify(creature.saves.Fort, "", -2);
      creature.saves.Ref = extractAndModify(creature.saves.Ref, "", -2);
      creature.saves.Will = extractAndModify(creature.saves.Will, "", -2);
      let perceptionLine = creature.information.filter(info => info.description.includes("Perception"))[0];
      if (perceptionLine) {
        perceptionLine.description = extractAndModify(perceptionLine.description, "Perception ", -2);
      }
      creature.combat.forEach(line => {
        if (line.label == "Melee" || line.label == "Ranged" || line.label == "Damage") {
          line.description = line.description + " -2 (weak penalty)"
        }
      });
      return creature;
    },
    partyLevelHandler: function(event) {
      localStorage.setItem("partyLevel", event.target.value)
    },
    numberOfMembersHandler: function(event) {
      localStorage.setItem("numberOfMembers", event.target.value)
    }
  },
  mounted() {
    let searchParams = new URLSearchParams(window.location.search);
    fetch('/api/creatures')
      .then(response => response.json())
      .then(json => {
        this.allCreatures = json;
        const list = searchParams.get('list');
        const partyLevel = searchParams.get('partyLevel');
        const totalPlayers = searchParams.get('totalPlayers');
        if (totalPlayers) {
          this.numberOfMembersText = totalPlayers;
        }
        if (partyLevel) {
          this.partyLevelText = partyLevel;
        }
        if (list) {
          let creatureCounts = {};
          list.split(",").forEach(name => {
            creatureCounts[name] = (creatureCounts[name] || 0) + 1;
          })
          this.selectedCreatures = Object.keys(creatureCounts).map(name => {
            let creature = null;
            if (name.startsWith("Elite")) {
              const baseCreature = this.allCreatures.find(creature => creature.name === name.slice(6));
              creature = strengthenCreature(baseCreature);
            } else if (name.startsWith("Weak")) {
              const baseCreature = this.allCreatures.find(creature => creature.name === name.slice(5));
              creature = weakenCreature(baseCreature);
            } else {
              creature = this.allCreatures.find(creature => creature.name === name);
            }
            creature.quantity = creatureCounts[name];
            return creature;
          });
        }
      })
  }
})

function extractAndModify(string, preamble, modifier) {
  const match = string.match(preamble + "([+-]?\\d+)");
  if (match && match[1]) {
    const number = parseInt(match[1]) + modifier;
    const replacement = preamble + number.toString();
    return string.replace(match[0], replacement);
  } else {
    return string;
  }
}
function strengthenCreature(creature) {
  creature.name = "Elite " + creature.name;
  let hpIncrease = 0;
  if (creature.level <= 1) {
    hpIncrease = 10;
  } else if (creature.level <= 4) {
    hpIncrease = 15;
  } else if (creature.level <= 19) {
    hpIncrease = 20;
  } else {
    hpIncrease = 30;
  }
  creature.level = parseInt(creature.level) + 1;
  creature.HP = extractAndModify(creature.HP, "", hpIncrease);
  creature.AC = extractAndModify(creature.AC, "", 2);
  creature.saves.Fort = extractAndModify(creature.saves.Fort, "", 2);
  creature.saves.Ref = extractAndModify(creature.saves.Ref, "", 2);
  creature.saves.Will = extractAndModify(creature.saves.Will, "", 2);
  if (creature.perception) {
    creature.perception = extractAndModify(creature.perception, "Perception ", 2);
  } else {
    let perceptionLine = creature.information.filter(info => info.description.includes("Perception"))[0];
    if (perceptionLine) {
      perceptionLine.description = extractAndModify(perceptionLine.description, "Perception ", 2);
    }
  }
  creature.combat.forEach(line => {
    if (line.label == "Melee" || line.label == "Ranged" || line.label == "Damage") {
      line.description = line.description + " +2 (elite bonus)"
    }
  })
  return creature;
}

function weakenCreature(creature) {
  creature.name = "Weak " + creature.name;
  let hpDecrease = 0;
  if (creature.level <= 2) {
    hpDecrease = -10;
  } else if (creature.level <= 5) {
    hpDecrease = -15;
  } else if (creature.level <= 20) {
    hpDecrease = -20;
  } else {
    hpDecrease = -30;
  }
  creature.level -= 1;
  creature.HP = extractAndModify(creature.HP, "", hpDecrease);
  creature.AC = extractAndModify(creature.AC, "", -2);
  creature.saves.Fort = extractAndModify(creature.saves.Fort, "", -2);
  creature.saves.Ref = extractAndModify(creature.saves.Ref, "", -2);
  creature.saves.Will = extractAndModify(creature.saves.Will, "", -2);
  let perceptionLine = creature.information.filter(info => info.description.includes("Perception"))[0];
  if (perceptionLine) {
    perceptionLine.description = extractAndModify(perceptionLine.description, "Perception ", -2);
  }
  creature.combat.forEach(line => {
    if (line.label == "Melee" || line.label == "Ranged" || line.label == "Damage") {
      line.description = line.description + " -2 (elite bonus)"
    }
  })
  return creature;
}

function suggestFunction(userInput, callback) {
  const regex = new RegExp('.*' + userInput + '.*', 'i')
  let creatures = app.allCreatures.filter(creature => {
    const typeMatch = creature.name.match(regex) || (creature.tags || []).join(",").match(regex)

    return typeMatch && creature.level <= app.partyLevel + 4 && creature.level >= app.partyLevel - 4;
  });
  callback(creatures.map(creature => {
    return {'display': `${creature.name} - ${creature.level}`, 'value': creature._id}
  }));
}

let lastSelectedId = null;
function afterSelectFunction(suggestionObject) {
  if (suggestionObject && lastSelectedId !== suggestionObject.value && !app.selectedIds[suggestionObject.value]) {
    lastSelectedId = suggestionObject.value
    let creature = app.keyedCreatures[lastSelectedId];
    app.addCreature(creature);
  }
  $("#creature-name-typeahead").val('')
}

$("#creature-name-typeahead").elemicaSuggest({
  minimumSearchTermLength: 3,
  suggestFunction: suggestFunction,
  valueInput: $("#creature-id"),
  afterSelect: afterSelectFunction,
  noMatchesMessage: "No creatures matched the search."
});

$(document).on("click", ".modal-target", function(e) {
  if (!$(e.target).attr("class").includes("add-or-delete")) {
    $($(this).data('target')).modal('show');
  }
})
