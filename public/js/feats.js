$(document).ready(function(){
  $("#search").on("keyup", function() {
    var value = $(this).val().toLowerCase();
    $("#feats > div").filter(function() {
      const text = $(this).text().toLowerCase();
      $(this).toggle(text.includes(value));
    });
  });
});
