const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const os = require("os");
const path = require("path");

const { checkPermissions } = require("./utils/permission");
const { startRecording, stopRecording } = require("./utils/recording");

const createWindow = async () => {
  global.mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      devTools: true,
    },
  });

  global.mainWindow.webContents.openDevTools();

  const isPermissionGranted = await checkPermissions();

  if (isPermissionGranted) {
    global.mainWindow.loadFile("./src/electron/screens/recording/screen.html");
  } else {
    global.mainWindow.loadFile("./src/electron/screens/permission-denied/screen.html");
  }
};

ipcMain.on("open-folder-dialog", async (event) => {
  const desktopPath = path.join(os.homedir(), "Desktop");

  const { filePaths, canceled } = await dialog.showOpenDialog(global.mainWindow, {
    properties: ["openDirectory"],
    buttonLabel: "Select Folder",
    title: "Select a folder",
    message: "Please select a folder for saving the recording",
    defaultPath: desktopPath,
  });

  if (!canceled) {
    event.sender.send("selected-folder", filePaths[0]);
  }
});

ipcMain.on("start-recording", async (_, { filepath, filename }) => {
  await startRecording({
    filepath,
    filename,
  });
});

ipcMain.on("stop-recording", () => {
  stopRecording();
});

ipcMain.handle("check-permissions", async () => {
  const isPermissionGranted = await checkPermissions();

  if (isPermissionGranted) {
    global.mainWindow.loadFile("./src/electron/screens/recording/screen.html");
  } else {
    const response = await dialog.showMessageBox(global.mainWindow, {
      type: "warning",
      title: "Permission Denied",
      message: "You need to grant permission for screen recording. Would you like to open System Preferences now?",
      buttons: ["Open System Preferences", "Cancel"],
    });

    if (response.response === 0) {
      require("electron").shell.openExternal("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture");
    }
  }
});

app.whenReady().then(createWindow);
