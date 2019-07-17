const container = document.getElementById("jsoneditor");
const editor = new JSONEditor(container, {});

editor.set(json);

$("#save").on("click", () => {
  fetch(window.location.href, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    body: JSON.stringify(editor.get())
  }).then(res => {
    window.location.replace(res.url);
  })
})
