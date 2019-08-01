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
    partyLevelText: '5',
    numberOfMembersText: '5',
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
    difficulty: function() {
      const adjustmentSize = this.numberOfMembers - 4;
      if (this.encounterXp <= 40 + adjustmentSize * 10) {
        return 'Trivial';
      } else if (this.encounterXp <= 60 + adjustmentSize * 15) {
        return 'Low';
      } else if (this.encounterXp <= 80 + adjustmentSize * 20) {
        return 'High';
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
        .map(creature => Array(creature.quantity).fill(creature.name))
        .flat()
        .join(",");
      const rawString = `/encounter/?list=${creaturesString}&totalPlayers=${this.numberOfMembers}&partyLevel=${this.partyLevel}`;
      return encodeURI(rawString);
    },
    encounterCodeExport: function() {
      let lines = [];
      this.selectedCreatures.forEach(creature => {
        const perception = parseInt((creature.perception || "0").match(/[-+]?\d+/)[0]);
        const creatureInit = Math.floor(Math.random() * 20) + 1 + perception;
        for (let i = 1; i <= creature.quantity; i++) {
          lines.push(`${creatureInit} ${creature.name}#${i} - ${creature.hp}`);
        }
      })
      return lines.join("\n");
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
      }
    },
    addCreature: function(creature) {
      creature.quantity = creature.quantity + 1;
      Vue.set(this.selectedCreatures, this.selectedCreatures.indexOf(creature), creature);
      window.history.pushState("", "", this.encounterUrl);
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
            this.selectedCreatures = Object.keys(creatureCounts).map(name => {
              let creature = this.allCreatures.find(creature => creature.name === name);
              creature.quantity = creatureCounts[name];
              return creature;
            });
          })
        }
      })
  }
})

function suggestFunction(userInput, callback) {
  const regex = new RegExp('.*' + userInput + '.*', 'i')
  let creatures = Object.values(app.allCreatures).filter(creature => {
    const typeMatch = creature.name.match(regex) ||
      creature.category.match(regex) ||
      creature.tags.join(",").match(regex)

    return typeMatch && creature.level <= app.partyLevel + 4 && creature.level >= app.partyLevel - 4;
  });
  callback(creatures.map(creature => {
    return {'display': `${creature.name} - ${creature.category} - ${creature.level}`, 'value': creature._id}
  }));
}

let lastSelectedId = null;
function afterSelectFunction(suggestionObject) {
  if (suggestionObject && lastSelectedId !== suggestionObject.value && !app.selectedIds[suggestionObject.value]) {
    lastSelectedId = suggestionObject.value
    let creature = app.keyedCreatures[lastSelectedId];
    creature.quantity = 1;
    app.selectedCreatures.push(creature);
    window.history.pushState("", "", app.encounterUrl);
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