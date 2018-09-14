$(document).ready(function () {
  $('#creatures-table').DataTable({
    paging: false,
    dom: "ft",
    language: {
      search: "",
      searchPlaceholder: "Search.."
    },
  }).column(0).data().sort();
  $('input.form-control').removeClass("form-control-sm").addClass("form-control-md");
});
