$(document).ready(function(){
  const createRegex = (term) => {
    return new RegExp(term, 'i');
  };

  let selectedType = 'all-feats';

  const searchFilter = (value) => {
    if (value) {
      const regex = createRegex(value);
      $("#feats > div").filter(function() {
        const text = $(this).text().toLowerCase();
        if (selectedType === 'all-feats') {
          $(this).toggle(!!text.match(regex));
        } else {
          $(this).toggle($(this).data('type') === selectedType && !!text.match(regex));
        }
      });
    } else {
      $("#feats > div").filter(function() {
        if (selectedType === 'all-feats') {
          $(this).toggle(true);
        } else {
          $(this).toggle($(this).data('type') === selectedType);
        }
      });
    }
  }

  $("#feat-search").on("keyup", function() {
    const value = $(this).val().toLowerCase().trim();
    searchFilter(value);
  });

  $(".feat-filter").on('click', function() {
    selectedType = $(this).find("input").attr("id");
    const value = $("#feat-search").val().toLowerCase().trim();
    searchFilter(value);
  })
});
