const { ipcRenderer, shell } = require("electron");
const path = require("path");
const os = require("os");

let selectedFolderPath = path.join(os.homedir(), "Desktop");
document.getElementById("selected-folder-path").textContent = selectedFolderPath;

let recordingFilename = null;

document.getElementById("select-folder").addEventListener("click", () => {
  ipcRenderer.send("open-folder-dialog");
});

ipcRenderer.on("selected-folder", (_, path) => {
  selectedFolderPath = path;

  document.getElementById("selected-folder-path").textContent = selectedFolderPath;
});

document.getElementById("recording-filename").addEventListener("input", (event) => {
  recordingFilename = event.target.value;
});

document.getElementById("start-recording").addEventListener("click", () => {
  const startButton = document.getElementById("start-recording");
  startButton.innerHTML = `Starting <span class="inline-block ml-4 w-4 h-4 border-4 border-t-transparent border-white rounded-full animate-spin"></span>`;

  ipcRenderer.send("start-recording", {
    filepath: selectedFolderPath,
    filename: recordingFilename,
  });
});

document.getElementById("stop-recording").addEventListener("click", () => {
  ipcRenderer.send("stop-recording");
});

let startTime;
let updateTimer;

ipcRenderer.on("recording-status", (_, status, timestamp, filepath) => {
  const startButton = document.getElementById("start-recording");

  if (status === "START_RECORDING") {
    startTime = timestamp;
    updateElapsedTime();

    startButton.innerHTML = "Start Recording";

    document.getElementById("start-recording").disabled = true;
    document.getElementById("recording-filename").disabled = true;
    document.getElementById("select-folder").disabled = true;
    document.getElementById("stop-recording").disabled = false;
    document.getElementById("output-file-path").textContent = filepath;
  }

  if (status === "STOP_RECORDING") {
    clearTimeout(updateTimer);

    document.getElementById("start-recording").disabled = false;
    document.getElementById("recording-filename").disabled = false;
    document.getElementById("select-folder").disabled = false;
    document.getElementById("stop-recording").disabled = true;
  }
});

document.getElementById("output-file-path").addEventListener("click", () => {
  const filePath = document.getElementById("output-file-path").textContent;
  const parentDir = path.dirname(filePath);

  shell.openPath(parentDir);
});

function updateElapsedTime() {
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  document.getElementById("elapsed-time").textContent = `${elapsedTime}s`;

  updateTimer = setTimeout(updateElapsedTime, 1000);
}
