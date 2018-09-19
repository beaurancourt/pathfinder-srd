function generate(threatLevel, numOfPlayers, partyLevel) {
  const monsters = require("./creatures.json");

  const encounterBudget = {
    "Trivial": {xpBudget: 40, charAdjustment: 10},
    "Low": {xpBudget: 60, charAdjustment: 15},
    "High": {xpBudget: 80, charAdjustment: 20},
    "Severe": {xpBudget:120, charAdjustment: 30},
    "Extreme": {xpBudget:160, charAdjustment: 40}
  };
  const creatureXpAndAdjusters = {
    partyLevelAdjuster: [-4, -3, -2, -1, 0, 1, 2, 3, 4], 
    xp: [10, 15, 20, 30, 40, 60, 80, 120, 160]
  };

  const totalXpBudget = (encounterDifficulty, totalNumPlayers) => {
    // Adjust the budget based on total players; default = 4
    return encounterBudget[encounterDifficulty].xpBudget 
      + (parseInt(totalNumPlayers) - 4) * encounterBudget[encounterDifficulty].charAdjustment;
  }

  const xpCost = (creatureLevel) => {
    const theAdjuster = creatureLevel - partyLevel;
    const adjusterIndex = creatureXpAndAdjusters.partyLevelAdjuster
      .findIndex( eachAdjuster => eachAdjuster === theAdjuster);
    return creatureXpAndAdjusters.xp[adjusterIndex];
  }

  const eligibleCreaturePool = (xpBudgetLeft, currentCreaturePool) => {
    let creatureIndex;
    if (xpBudgetLeft >= 160) {
      creatureIndex = 8;
    } else if (xpBudgetLeft >= 10 && xpBudgetLeft < 160) {
      creatureIndex = creatureXpAndAdjusters.xp.findIndex(eachXP => eachXP > xpBudgetLeft) -1;	
    }
    if (creatureIndex >= 0) {
      // Determine the highest potential level of the creature you CAN afford
      const highestCreatureLevel = partyLevel + creatureXpAndAdjusters.partyLevelAdjuster[creatureIndex];
      // Filter list by the highest affordable level & the lowest eligible level (-4 the partyLevel)
      return currentCreaturePool.filter(eachMonster => eachMonster.level <= highestCreatureLevel && eachMonster.level >= partyLevel - 4);
    } else {
      return []
    }
  }

  const compileRandomCreatures = (xpBudgetLeft, currentCreaturePool, randomCreatures) => {
    if (currentCreaturePool.length > 0 && xpBudgetLeft >= 10) {
      const oneRandomCreature = currentCreaturePool[Math.floor(Math.random() * currentCreaturePool.length)];
      oneRandomCreature.id = oneRandomCreature.name.split("(")[0].trim().split(" ").join("");
      randomCreatures.push(oneRandomCreature);
      const xpSpent = xpCost(oneRandomCreature.level);
      currentCreaturePool = eligibleCreaturePool(xpBudgetLeft - xpSpent, currentCreaturePool);
      return compileRandomCreatures(xpBudgetLeft - xpSpent, currentCreaturePool, randomCreatures);
    } else {
      return randomCreatures
    }
  }

  const makeQueryUrl = (creaturesArray) => {
    const creaturesString = creaturesArray.map(creature => creature.name).join(",").split(" ").join("%20");
    return `/encounter/?list=${creaturesString}&difficulty=${threatLevel}&totalPlayers=${numOfPlayers}&partyLevel=${partyLevel}`;
  }

  const currentXpBudget = totalXpBudget(threatLevel, numOfPlayers);
  const currentEligiblePool = eligibleCreaturePool(currentXpBudget, monsters);
  const creaturesArray = compileRandomCreatures(currentXpBudget, currentEligiblePool, []);
  const queryUrl = makeQueryUrl(creaturesArray);
  return {list: creaturesArray, url: queryUrl, difficulty: threatLevel, totalPlayers: numOfPlayers, partyLevel: partyLevel}
};
module.exports = generate;