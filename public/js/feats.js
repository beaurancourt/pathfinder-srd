$(document).ready(function(){
  const createRegex = (term) => {
    return new RegExp('.*' + term + '.*', 'i');
  };

  $("#general-feat-search").on("keyup", function() {
    var value = $(this).val().toLowerCase().trim();
    if (value) {
      const regex = createRegex(value);
      $("#general-feats > div").filter(function() {
        const text = $(this).text().toLowerCase();
        $(this).toggle(!!text.match(regex));
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
      const regex = createRegex(value);
      $("#skill-feats > div").filter(function() {
        const text = $(this).text().toLowerCase();
        $(this).toggle(!!text.match(regex));
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
