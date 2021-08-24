const { app, BrowserWindow, ipcMain } = require('electron');
const url = require('url');
const path = require('path');
import * as Store from 'electron-store';

let mainWindow: any;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 620,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `../angular/index.html`),
      protocol: 'file:',
      slashes: true,
    })
  );

  const debug = process.env.MEMPOOLER_DEBUG || false;
  if (debug) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  initServices();
}
app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

function initServices() {
  const store = new Store();
  require('./wallet/wallet.electron')(mainWindow, ipcMain, store);
  require('./settings/settings.electron')(mainWindow, ipcMain, store);
}
