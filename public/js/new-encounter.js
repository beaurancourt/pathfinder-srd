var app = new Vue({
  el: '#app',
  data() {
    return {
      allCreatures: {},
      creaturesSoFarById: {},
      message: "hi!"
    }
  },
  methods: {
    creaturesSoFar: function() {
      console.log("we're asking for a computed")
      return Object.values(this.creaturesSoFarById)
    }
  },
  mounted() {
    fetch('/api/creatures')
      .then(response => response.json())
      .then(json => {
        json.forEach(creature => {
          this.allCreatures[creature._id] = creature;
        });
      })
  }
})

function suggestFunction(userInput, callback) {
  const regex = new RegExp('.*' + userInput + '.*', 'i')
  const creatures = Object.values(app.allCreatures).filter(creature => {
    return creature.name.match(regex)
  });
  callback(creatures.map(creature => {
    return {'display': `${creature.name} - ${creature.category} - ${creature.level}`, 'value': creature._id}
  }));
}

function afterSelectFunction(suggestionObject) {
  if (suggestionObject) {
    console.log(app.creaturesSoFarById[suggestionObject.value])
    if (!app.creaturesSoFarById[suggestionObject.value]) {
      const creature = app.allCreatures[suggestionObject.value]
      app.creaturesSoFarById[suggestionObject.value] = {creature: creature, amount: 1}
    }
  }
}

$("#creature-name-typeahead").elemicaSuggest({
  suggestFunction: suggestFunction,
  valueInput: $("#creature-id"),
  afterSelect: afterSelectFunction
});
