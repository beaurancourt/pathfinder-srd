var fs = require('fs');
var xml2js = require('xml2js');
const itemTags = require('./item-tags')

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

function last(list) {
  return list[list.length - 1];
}

fs.readFile('/Users/beaushinkle/Downloads/PathfinderPlaytestDownloadBundle/rulebook-raw.xml', function(err, data) {
  parser.parseString(data, (err, result) => {
    var strings = [];
    var tags = [];
    result.alto.Layout.forEach((layout) => {
      layout.Page.slice(380, 414).forEach(page => {
        page.PrintSpace.forEach((printSpace) => {
          if (printSpace.TextBlock) {
            printSpace.TextBlock.forEach((textBlock) => {
              var tagsBlock = [];
              textBlock.TextLine.forEach((textLine) => {
                lineStrings = [];
                textLine.String.forEach((string) => {
                  if (string['$'].STYLEREFS == "font26") {
                    tagsBlock.push(string['$'].CONTENT);
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
                if (lineStrings.length > 0) {
                  strings.push(lineStrings);
                }
              })
              if (tagsBlock.length > 0) {
                tags.push(tagsBlock);
              }
            })
          }
        })
      })
    });
    const lists = strings.map(line => {
      return line.filter((string) => {
        return ["font6", "font5", "font25", "font4", "font56", "font82", "font57"].includes(string.size) && string.content != "ITEM"
      });
    }).filter(line => line.length > 0);
    var items = [];
    lists.forEach(line => {
      line.forEach((text, textIndex) => {
        if (text.size == "font25") {
          items.push({'label': capFirst(text.content), 'properties': []});
        } else if (text.size == "font56" || text.size == "font82") {
          var lastItem = last(items);
          lastItem.level = text.content;
        } else if (items.length > 0) {
          var lastItem = last(items);
          if (text.size == "font4") {
            lastItem.properties.push({'label': capFirst(text.content)})
          } else if (textIndex == 0 &&
            text.content[0] &&
            text.content[0].toUpperCase() == text.content[0] &&
            last(lastItem.properties) &&
            last(lastItem.properties).label != "Description"
          ) {
            lastItem.properties.push({'label': 'Description', 'value': text.content})
          } else {
            var lastDescription = last(lastItem.properties);
            if (lastDescription) {
              if (lastDescription.value) {
                lastDescription.value = lastDescription.value + " " + text.content;
              } else {
                lastDescription.value = text.content;
              }
            }
          }
        }
      })
    })

    items = items.slice(1)

    items.forEach((item, index) => {
      item.tags = itemTags[index];
    })

    console.log(JSON.stringify(items, null, 2))
  })
});
