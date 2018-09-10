var fs = require('fs');
var xml2js = require('xml2js');
const tagBlocks = require('./tags.json')

var parser = new xml2js.Parser();

function capFirst(str) {
  const words = str.split(" ");
  const cappedFirst = words.map((word) => {
    return word[0].toUpperCase() + word.slice(1).toLowerCase()
  });
  return cappedFirst.join(" ");
}

fs.readFile('/Users/beaushinkle/Downloads/PathfinderPlaytestDownloadBundle/bestiary-images.xml', function(err, data) {
  parser.parseString(data, function (err, result) {
    var blocks = [];
    result.alto.Layout.forEach((item) => {
      item.Page.forEach((page) => {
        page.PrintSpace.forEach((printSpace) => {
          if (printSpace.TextBlock) {
            printSpace.TextBlock.forEach((textBlock) => {
              const lines = textBlock.TextLine.map((textLine) => {
                var strings = [];
                textLine.String.forEach((string) => {
                  if (strings.length > 0) {
                    if (strings[strings.length-1].size == string['$'].STYLEREFS) {
                      strings[strings.length-1].content = strings[strings.length-1].content + " " + string['$'].CONTENT
                    } else {
                      strings.push({'content': string['$'].CONTENT, 'size': string['$'].STYLEREFS})
                    }
                  } else {
                    strings.push({'content': string['$'].CONTENT, 'size': string['$'].STYLEREFS})
                  }
                })
                return strings;
              })
              blocks.push(lines)
            })
          }
        })
      })
    })
    var categories = [];
    blocks.forEach((block) => {
      if (block[0][0].size == "font40") {
        categories.push({'name': block[0][0].content, 'blocks': [block]});
      } else {
        if (categories.length > 0) {
          categories[categories.length-1].blocks.push(block)
        }
      }
    });

    var parsedCreatures = []
    var index = 0;

    categories.forEach((category) => {
      var creatures = [];
      category.blocks.forEach((block) => {
        if (block[0][0].size == "font20") {
          creatures.push({'name': block[0][0].content, 'blocks': [block]});
        } else {
          if (creatures.length > 0) {
            creatures[creatures.length-1].blocks.push(block)
          }
        }
      })

      creatures.forEach((creature) => {
        var parsedCreature = {
          'name': capFirst(creature.name),
          'actions': [],
          'traits': [],
          'stats': {},
          'defenses': {},
          'category': capFirst(category.name),
          'tags': tagBlocks[index]
        };

        const sections = creature.blocks.reduce((acc, val) => acc.concat(val), []);

        var seenSpeed = false;

        sections.forEach((section) => {
          const header = section[0].content
          const key = (section[1] || {}).content
          if (section.some((part) => part.size == 'font35')) {
            parsedCreature.rarity = capFirst(section[0].content);
            parsedCreature.level = parseInt(section[1].content);
          }
          else if (header == "Perception") { parsedCreature.perception = key; }
          else if (header == "Languages") { parsedCreature.languages = key; }
          else if (header == "Skills") { parsedCreature.skills = key; }
          else if (header == "Str") {
            for (var i = 0; i < section.length - 1; i = i + 2) {
              parsedCreature.stats[section[i].content] = section[i+1].content
            }
          } else if (header == "AC") {
            for (var i = 0; i < section.length - 1; i = i + 2) {
              parsedCreature.defenses[section[i].content] = section[i+1].content
            }
          } else if (header == "HP") { parsedCreature.hp = key; }
          else if (header == "Speed") {
            parsedCreature.speed = key;
            seenSpeed = true;
          } else if (seenSpeed) {
            section.forEach((part) => {
              const lastAction = parsedCreature.actions[parsedCreature.actions.length-1]
              if (part.size == 'font4') {
                if (lastAction && lastAction.description === undefined) {
                  lastAction.label = lastAction.label + " " + part.content;
                } else {
                  parsedCreature.actions.push({'label': part.content})
                }
              }
              if (part.size == 'font5' && parsedCreature.actions.length > 0) {
                if (lastAction.description) {
                  lastAction.description = lastAction.description + " " + part.content;
                } else {
                  lastAction.description = part.content;
                }
              }
            })
          } else {
            section.forEach((part) => {
              const lastTrait = parsedCreature.traits[parsedCreature.traits.length-1]
              if (part.size == 'font4') {
                if (lastTrait && lastTrait.description === undefined) {
                  lastTrait.label = lastTrait.label + " " + part.content;
                } else {
                  parsedCreature.traits.push({'label': part.content})
                }
              }
              if (part.size == 'font5' && parsedCreature.traits.length > 0) {
                if (lastTrait.description) {
                  lastTrait.description = lastTrait.description + " " + part.content;
                } else {
                  lastTrait.description = part.content;
                }
              }
            })
          }
        })
        parsedCreatures.push(parsedCreature);
        index++;
      })
    })
    console.log(JSON.stringify(parsedCreatures, null, 2))
  });
});
