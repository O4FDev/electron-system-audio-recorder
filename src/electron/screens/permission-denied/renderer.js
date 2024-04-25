const { ipcRenderer } = require("electron");

document.getElementById("check-permissions").addEventListener("click", async () => {
  await ipcRenderer.invoke("check-permissions");
});
