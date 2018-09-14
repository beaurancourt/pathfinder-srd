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
      layout.Page.slice(320,325).forEach(page => {
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

    var conditions = []
    const relevantLines = strings.filter((string) => string.size == "font10" || string.size == "font18")
    relevantLines.forEach((string) => {
      if (string.size == "font10") {
        conditions.push({'label': capFirst(string.content)})
      } else {
        if (conditions.length > 0) {
          var lastCondition = conditions[conditions.length - 1];
          if (lastCondition.description) {
            lastCondition.description = lastCondition.description + " " + string.content;
          } else {
            lastCondition.description = string.content;
          }
        }
      }
    })

    console.log(JSON.stringify(conditions, null, 2))
  })
});
