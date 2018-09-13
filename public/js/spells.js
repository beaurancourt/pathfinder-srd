$(document).ready(function () {
  $('#spells-table').DataTable({
    paging: false
  }).column(0).data().sort();
});
