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

fs.readFile('/Users/beaushinkle/Downloads/PathfinderPlaytestDownloadBundle/rulebook-raw.xml', function(err, data) {
  parser.parseString(data, (err, result) => {
    var strings = [];
    result.alto.Layout.forEach((layout) => {
      layout.Page.slice(162,174).forEach(page => {
        page.PrintSpace.forEach((printSpace) => {
          if (printSpace.TextBlock) {
            printSpace.TextBlock.forEach((textBlock) => {
              textBlock.TextLine.forEach((textLine) => {
                lineStrings = [];
                textLine.String.forEach((string) => {
                  if (string['$'].STYLEREFS == "font26") {
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
      return ["font6", "font5", "font25", "font4", "font56"].includes(string.size) && string.content != "FEAT"
    })
    var feats = [];
    lists.forEach((string) => {
      if (string.size == "font25") {
        feats.push({'name': capFirst(string.content), 'traits': []})
      } else {
        if (feats.length > 0) {
          var lastFeat = feats[feats.length-1];
          if (string.size == "font56") {
            lastFeat.level = string.content;
          } else if (string.size == "font4" && (string.content == "Prerequisites")) {
            lastFeat.prerequisites = ""
          } else if (lastFeat.prerequisites == "") {
            lastFeat.prerequisites = string.content;
          } else {
            if (string.size == "font4") {
              var traits = lastFeat.traits || [];
              traits.push({'label': string.content})
              lastFeat.traits = traits;
            } else {
              if (lastFeat.traits.length > 0) {
                if (lastFeat.traits[lastFeat.traits.length-1].description) {
                  lastFeat.traits[lastFeat.traits.length-1].description = lastFeat.traits[lastFeat.traits.length-1].description + " " + string.content;
                } else {
                  lastFeat.traits[lastFeat.traits.length-1].description = string.content;
                }
              } else {
                if (lastFeat.description) {
                  lastFeat.description = lastFeat.description + " " + string.content;
                } else {
                  lastFeat.description = string.content;
                }
              }
            }
          }
        }
      }
    })
    console.log(JSON.stringify(feats, null, 2))
  })
});
