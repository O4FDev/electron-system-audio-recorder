const { spawn } = require("node:child_process");
const fs = require("fs");
const path = require("path");
const { dialog } = require("electron");
const { checkPermissions } = require("./permission");

let recordingProcess = null;

const initRecording = (filepath, filename) => {
  return new Promise((resolve) => {
    const args = ["--record", filepath];
    if (filename) args.push("--filename", filename);

    recordingProcess = spawn("./src/swift/Recorder", args);

    recordingProcess.stdout.on("data", (data) => {
      const response = data
        .toString()
        .split("\n")
        .filter((line) => line !== "")
        .map((line) => JSON.parse(line))
        .at(0);

      if (response.code !== "RECORDING_STARTED" && response.code !== "RECORDING_STOPPED") {
        resolve(false);
      } else {
        const timestamp = new Date(response.timestamp).getTime();

        global.mainWindow.webContents.send("recording-status", response.code === "RECORDING_STARTED" ? "START_RECORDING" : "STOP_RECORDING", timestamp, response.path);

        resolve(true);
      }
    });
  });
};

module.exports.startRecording = async ({ filepath, filename }) => {
  const isPermissionGranted = await checkPermissions();

  if (!isPermissionGranted) {
    global.mainWindow.loadFile("./src/electron/screens/permission-denied/screen.html");

    return;
  }

  const fullPath = path.join(filepath, filename + ".flac");
  if (fs.existsSync(fullPath)) {
    dialog.showMessageBox({
      type: "error",
      title: "Recording Error",
      message: "File already exists. Please choose a different filename or delete the existing file.",
      buttons: ["OK"],
    });

    global.mainWindow.loadFile("./src/electron/screens/recording/screen.html");

    return;
  }

  while (true) {
    const recordingStarted = await initRecording(filepath, filename);

    if (recordingStarted) {
      break;
    }
  }
};

module.exports.stopRecording = () => {
  if (recordingProcess !== null) {
    recordingProcess.kill("SIGINT");
    recordingProcess = null;
  }
};
