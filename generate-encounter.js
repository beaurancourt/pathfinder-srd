const creatures = require("./creatures.json")

function xpForCreature(creature, partyLevel) {
  if (creature.level == partyLevel - 4) {
    return 10;
  }
  if (creature.level == partyLevel - 3) {
    return 15;
  }
  if (creature.level == partyLevel - 2) {
    return 20;
  }
  if (creature.level == partyLevel - 1) {
    return 30;
  }
  if (creature.level == partyLevel) {
    return 40;
  }
  if (creature.level == partyLevel + 1) {
    return 60;
  }
  if (creature.level == partyLevel + 2) {
    return 80;
  }
  if (creature.level == partyLevel + 3) {
    return 120;
  }
  if (creature.level == partyLevel + 4) {
    return 160;
  }
}

function generateEncounter(creatures, budget, partyLevel, soFar) {
  const availableCreatures = creatures.filter((creature) => {
    return creature.level <= partyLevel + 4 &&
      creature.level >= partyLevel - 4 &&
      xpForCreature(creature, partyLevel) <= budget;
  });
  if (availableCreatures.length > 0) {
    const randomCreature = availableCreatures[Math.floor(Math.random()*availableCreatures.length)];
    const xpCost = xpForCreature(randomCreature, partyLevel);
    soFar.push(randomCreature);
    return generateEncounter(creatures, budget - xpCost, partyLevel, soFar);
  } else {
    return soFar;
  }
}
