function suggestFunction(userInput, callback) {
  $.ajax({
    url: '/api/search/' + userInput,
    success: callback
  });
}

function afterSelectFunction(suggestionObject) {
  if (suggestionObject) {
    window.location.replace(suggestionObject.value);
  }
}

$("#site-wide-search").elemicaSuggest({
  suggestFunction: suggestFunction,
  valueInput: $("#site-wide-search-id"),
  afterSelect: afterSelectFunction
});
