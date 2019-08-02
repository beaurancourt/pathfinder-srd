$(document).ready(function(){
  $("#general-feat-search").on("keyup", function() {
    var value = $(this).val().toLowerCase().trim();
    if (value) {
      $("#general-feats > div").filter(function() {
        const text = $(this).text().toLowerCase();
        $(this).toggle(text.includes(value));
      });
      $("#skill-feats > div").filter(function() {
        $(this).toggle(false);
      });
    } else {
      $("#general-feats > div").filter(function() {
        $(this).toggle(true);
      });
      $("#skill-feats > div").filter(function() {
        $(this).toggle(true);
      });
    }
  });

  $("#skill-feat-search").on("keyup", function() {
    var value = $(this).val().toLowerCase().trim();
    if (value) {
      $("#skill-feats > div").filter(function() {
        const text = $(this).text().toLowerCase();
        $(this).toggle(text.includes(value));
      });
      $("#general-feats > div").filter(function() {
        $(this).toggle(false);
      });
    } else {
      $("#general-feats > div").filter(function() {
        $(this).toggle(true);
      });
      $("#skill-feats > div").filter(function() {
        $(this).toggle(true);
      });
    }
  });
});
