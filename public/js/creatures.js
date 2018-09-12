$(document).ready(function () {
  $('#creatures-table').DataTable({
    paging: false
  }).column(0).data().sort();
});
