var fs = require('fs');
var xml2js = require('xml2js');
const tags = require('./spell-tags.json')

var parser = new xml2js.Parser();

function capFirst(str) {
  if (str) {
    const words = str.split(" ");
    const cappedFirst = words.map((word) => {
      return word[0].toUpperCase() + word.slice(1).toLowerCase()
    });
    return cappedFirst.join(" ");
  }
}

fs.readFile('rulebook-raw.xml', function(err, data) {
  parser.parseString(data, (err, result) => {
    var strings = [];
    result.alto.Layout.forEach((layout) => {
      layout.Page.slice(203,274).forEach(page => {
        page.PrintSpace.forEach((printSpace) => {
          if (printSpace.TextBlock) {
            printSpace.TextBlock.forEach((textBlock) => {
              var tagBlock = [];
              textBlock.TextLine.forEach((textLine) => {
                textLine.String.forEach((string) => {
                  if (string['$'].STYLEREFS == "font26") {
                    tagBlock.push(string['$'].CONTENT)
                  } else {
                    if (strings.length > 0) {
                      if (strings[strings.length-1].size == string['$'].STYLEREFS) {
                        strings[strings.length-1].content = strings[strings.length-1].content + " " + string['$'].CONTENT
                      } else {
                        strings.push({'content': string['$'].CONTENT, 'size': string['$'].STYLEREFS})
                      }
                    } else {
                      strings.push({'content': string['$'].CONTENT, 'size': string['$'].STYLEREFS})
                    }
                  }
                })
              })
            })
          }
        })
      })
    });
    var spells = [];
    strings.slice(2).forEach((string) => {
      if (string.size == "font25") {
        const spellNameWords = string.content.split(" ");
        if (spellNameWords.length == 1) {
          spells.push({'name': capFirst(spellNameWords[0]), 'details': []})
        } else if (spellNameWords[spellNameWords.length - 1] == "CANTRIP") {
          const spellName = spellNameWords.slice(0, spellNameWords.length - 1).join(" ");
          const spellType = spellNameWords[spellNameWords.length - 1];
          spells.push({'name': capFirst(spellName), 'type': capFirst(spellType), 'level': '0', 'details': []})
        } else {
          const spellName = spellNameWords.slice(0, spellNameWords.length - 1).join(" ");
          const spellType = spellNameWords[spellNameWords.length - 1];
          spells.push({'name': capFirst(spellName), 'type': capFirst(spellType), 'details': []})
        }
      } else {
        if (string.size != "font26") {
          var lastSpell = spells[spells.length-1];
          if (string.size == "font56") {
            lastSpell.level = string.content
          } else if (string.size == "font4") {
            lastSpell.details.push({'label': string.content})
          } else {
            var lastDetail = lastSpell.details[lastSpell.details.length - 1]
            if (lastDetail && lastDetail.description) {
              lastDetail.description = lastDetail.description + " " + string.content;
            } else if (lastDetail) {
              lastDetail.description = string.content;
            }
          }
        }
      }
    })

    spells = spells.filter((spell) => {
      return spell.details[0].label == "Casting";
    });

    spells.forEach(function(spell, index) {
      spell.tags = tags[index]
      var detailIndex = 0;
      var longestDetailLength = 0;
      spell.details.forEach(function(detail, index) {
        if (detail.description.length > longestDetailLength) {
          detailIndex = index
          longestDetailLength = detail.description.length
        }
      })
      var longestDetail = spell.details[detailIndex];
      const splitDescription = longestDetail.description.match(/([^A-Z]*)([A-Z].*)/)
      if (splitDescription) {
        const spellDescription = splitDescription[2].trim()
        longestDetail.description = splitDescription[1].trim()
        spell.details = spell.details.slice(0, detailIndex)
          .concat([longestDetail, {"label": "Description", "description": spellDescription}])
          .concat(spell.details.slice(detailIndex + 1))
      }
    })
    console.log(JSON.stringify(spells, null, 2))
  })
});
