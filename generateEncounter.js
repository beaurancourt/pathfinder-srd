function generate(threatLevel, numOfPlayers, partysLevel) {
  const monsters = require("./creatures.json");

  const encounterBudget = {
    "Trivial": {xpBudget: 40, charAdjustment: 10 },
    "Low-Threat": {xpBudget: 60, charAdjustment: 15},
    "High-Threat": {xpBudget: 80, charAdjustment: 20},
    "Severe-Threat": {xpBudget:120, charAdjustment: 30},
    "Extreme-Threat": {xpBudget:160, charAdjustment: 40}
  };
  const creatureXpAndAdjusters = {
    partyLevelAdjuster: [-4, -3, -2, -1, 0, 1, 2, 3, 4], 
    xp: [10, 15, 20, 30, 40, 60, 80, 120, 160]
  };

  const findDmTotalXpBudget = (encounterDifficulty, totalNumPlayers) => {
    // Adjust the budget based on total players; default = 4
    const xpBudget = encounterBudget[encounterDifficulty].xpBudget 
      + (totalNumPlayers - 4) * encounterBudget[encounterDifficulty].charAdjustment;
    return xpBudget
  }

  const xpCost = (creatureLevel, partyLevel) => {
    const theAdjuster = creatureLevel - partyLevel;
    const adjusterIndex = creatureXpAndAdjusters.partyLevelAdjuster
      .findIndex( eachAdjuster => eachAdjuster === theAdjuster);
    return creatureXpAndAdjusters.xp[adjusterIndex];
  }

  const makeCreaturePool = (xpBudgetLeft, partyLevel, randomCreatures) => {
    const creatureIndex = creatureXpAndAdjusters.xp.findIndex(eachXP => eachXP > xpBudgetLeft) ;	
    const trueIndex = creatureIndex >= 0 ? creatureIndex -1 : 8;
    // Determine the highest potential level of the creature you CAN afford
    const highestCreatureLevel = partyLevel + creatureXpAndAdjusters.partyLevelAdjuster[trueIndex];
    // Filter list by the highest affordable level & the lowest eligible level (-4 the partyLevel)
    const eligibleCreatures = monsters.filter(
      eachMonster => eachMonster.level <= highestCreatureLevel && eachMonster.level >= partyLevel - 4
    );
    if(eligibleCreatures.length > 0 && xpBudgetLeft >= 0){
      const oneRandomCreature = eligibleCreatures[Math.floor(Math.random() * eligibleCreatures.length)];
      randomCreatures.push(oneRandomCreature.name);
      const xpSpent = xpCost(oneRandomCreature.level, partyLevel);
      makeCreaturePool(xpBudgetLeft - xpSpent, partyLevel, randomCreatures)
    }
    else{
      return randomCreatures
    }
    // Compiling query string
    randomCreatures = randomCreatures.join(",") ;
    randomCreatures += `&difficulty=${threatLevel}&totalPlayers=${numOfPlayers}&playersLevel=${partysLevel}`;
    return randomCreatures
  }

  const dmTotalXpBudget = findDmTotalXpBudget(threatLevel, numOfPlayers);
  return (makeCreaturePool(dmTotalXpBudget, partysLevel, []))
};
module.exports = generate;