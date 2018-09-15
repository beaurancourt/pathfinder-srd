function generate() {
	const monsters = require("./creatures.json");

	// dmSelection should NOT be hard coded; change on user inputs
	const dmSelection = ["High-Threat", 4, 1] ;
	//-- Encounter Budget Based on Difficulty --
	const encounterBudget = {
				"Trivial": { xpBudget: 40, charAdjustment: 10 },
				"Low-Threat": { xpBudget: 60, charAdjustment: 15},
				"High-Threat": { xpBudget: 80, charAdjustment: 20},
				"Severe-Threat": { xpBudget:120, charAdjustment: 30},
				"Extreme-Threat": { xpBudget:160, charAdjustment: 40}
		};
	// -- Creature XP and and Level Adjusters --
	const creatureXpAndRole = {
		partyLevelAdjuster: [-4, -3, -2, -1, 0, 1, 2, 3, 4], 
		xp: [10, 15, 20, 30, 40, 60, 80, 120, 160]
	};

	// Determine the DMs Total initial budget
	const dmTotalXpBudget = (encounterDifficulty, totalNumPlayers, partyLevel) => {
		// Adjust the Budget based on additional/missing players. Default = 4
		const XpBudget = encounterBudget[encounterDifficulty].xpBudget 
			+ (totalNumPlayers - 4) * encounterBudget[encounterDifficulty].charAdjustment;
		// Make your pool of monsters
		const creaturesEncountered = makeMyCreaturePool(XpBudget, partyLevel, []);
		return creaturesEncountered
	}

	// Create a pool of creatures you encounter based on xp budget and partylevel
	const makeMyCreaturePool = (xpBudgetLeft, partyLevel, randomCreatures) => {
		// Find the index of the first xp greater than your budget and use the previous index
		// to maximize your xp spending 
		const creatureIndex = creatureXpAndRole.xp.findIndex(eachXP => eachXP > xpBudgetLeft ) ;
		// If you do not find a number greater than your budget, then you CAN afford a 
		// partyLevel + 4 creature located at index 8	
		const trueIndex = creatureIndex >= 0 ? creatureIndex -1 : 8;
		// Determine the creature's max level by taking party's level and adding the adjuster
		const maxCreatureLevel = partyLevel + creatureXpAndRole.partyLevelAdjuster[trueIndex];
		// Filter the monsters list by the maxCreature level & the lowest available level (-4 the partyLevel)
		const eligibleCreatures = monsters.filter(
				eachMonster =>  eachMonster.level <= maxCreatureLevel && eachMonster.level >= partyLevel - 4
		);
		// Check to see if there are any eligible creatures before randomly selecting and pushing to array
		// Else, return the array
		eligibleCreatures.length > 0 && xpBudgetLeft >= 0
			?(
				oneRandomCreature = eligibleCreatures[Math.floor( Math.random() * eligibleCreatures.length )],
				randomCreatures.push(oneRandomCreature.name),
				theAdjuster = oneRandomCreature.level - partyLevel,
				adjusterIndex = creatureXpAndRole.partyLevelAdjuster.findIndex( adj => adj === theAdjuster),
				XpSpent = creatureXpAndRole.xp[adjusterIndex],
				makeMyCreaturePool(xpBudgetLeft - XpSpent, partyLevel, randomCreatures)
			)
			: randomCreatures;
		// Compiling query string
		randomCreatures = randomCreatures.join(",") ;
		randomCreatures += `&difficulty=${dmSelection[0]}&totalPlayers=${dmSelection[1]}&playersLevel=${dmSelection[2]}`;
		return randomCreatures        
	}
	return (dmTotalXpBudget(dmSelection[0], dmSelection[1], dmSelection[2]))  
};
module.exports = generate;