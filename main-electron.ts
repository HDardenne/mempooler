const { app, BrowserWindow } = require('electron');
const url = require('url');
const path = require('path');

let mainWindow: BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(
    url.format({
      path: path.join(__dirname, `/ dist / index.html`),
      protocole: 'fichier:',
      slash: true
    })
  );
  // Ouvre les outils de développement.
  mainWindow.webContents.openDevTools();

  mainWindow.on('fermé', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform! == 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
