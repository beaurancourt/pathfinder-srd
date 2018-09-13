var fs = require('fs');
var xml2js = require('xml2js');
const tags = require('./spell-tags.json')
const spellList = require('./spells.json')

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

fs.readFile('/Users/beaushinkle/Downloads/PathfinderPlaytestDownloadBundle/rulebook-raw.xml', function(err, data) {
  parser.parseString(data, (err, result) => {
    var strings = [];
    result.alto.Layout.forEach((layout) => {
      layout.Page.slice(199,203).forEach(page => {
        page.PrintSpace.forEach((printSpace) => {
          if (printSpace.TextBlock) {
            printSpace.TextBlock.forEach((textBlock) => {
              textBlock.TextLine.forEach((textLine) => {
                lineStrings = [];
                textLine.String.forEach((string) => {
                  if (string['$'].STYLEREFS == "font26") {
                    tagBlock.push(string['$'].CONTENT)
                  } else {
                    if (lineStrings.length > 0) {
                      if (lineStrings[lineStrings.length-1].size == string['$'].STYLEREFS) {
                        lineStrings[lineStrings.length-1].content = lineStrings[lineStrings.length-1].content + " " + string['$'].CONTENT
                      } else {
                        lineStrings.push({'content': string['$'].CONTENT, 'size': string['$'].STYLEREFS})
                      }
                    } else {
                      lineStrings.push({'content': string['$'].CONTENT, 'size': string['$'].STYLEREFS})
                    }
                  }
                })
                strings = strings.concat(lineStrings);
              })
            })
          }
        })
      })
    });
    const lists = strings.filter((string) => {
      return string.size == "font6" || string.size == "font5"
    })
    var lastGroup = null
    var spellGroups = {};
    lists.forEach((string) => {
      if (string.size == "font6") {
        lastGroup = string.content;
        spellGroups[lastGroup] = [];
      } else {
        spellGroups[lastGroup].push(string.content);
      }
    })
    Object.keys(spellGroups).forEach((groupName) => {
      const tag = capFirst(groupName.split(" ")[0]);
      spellGroups[groupName].forEach((spellName) => {
        var spell = spellList.find((spell) => spell.name.toLowerCase() == spellName.toLowerCase())
        if (spell) {
          if (!spell.tags.includes(tag)) {
            spell.tags.push(tag)
          }
        }
      })
    })
    console.log(JSON.stringify(spellList, null, 2))
  })
});
