const itemList = require('./items')

for (var i = 0; i < 4; i++) {
  itemList.forEach(item => {
    item.properties.forEach(description => {
      if (description.value) {
        const match = description.value.match(/^(Focus Activation[,;]?\s*)(.*)/)
        if (match) {
          item.activation = item.activation || [];
          item.activation.push('Focus');
          description.value = match[2];
        }
      }
    })
    item.properties = item.properties.filter(property => property.value && property.value != "")
  })

  itemList.forEach(item => {
    item.properties.forEach(description => {
      if (description.value) {
        const match = description.value.match(/^(Operate Activation[,;]?\s*)(.*)/)
        if (match) {
          item.activation = item.activation || [];
          item.activation.push('Operate');
          description.value = match[2];
        }
      }
    })
    item.properties = item.properties.filter(property => property.value && property.value != "")
  })


  itemList.forEach(item => {
    item.properties.forEach(description => {
      if (description.value) {
        const match = description.value.match(/^(Command Activation[,;]?\s*)(.*)/)
        if (match) {
          item.activation = item.activation || [];
          item.activation.push('Command');
          description.value = match[2];
        }
      }
    })
    item.properties = item.properties.filter(property => property.value && property.value != "")
  })
}

console.log(JSON.stringify(itemList, null, 2))
