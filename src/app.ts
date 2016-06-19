import * as Electron from 'electron';

let mainWindow:Electron.BrowserWindow = null;

Electron.app.on('ready', function() {
  mainWindow = new Electron.BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 300,
    minHeight: 300
  });

  mainWindow.setMenu(null);
  mainWindow.webContents.loadURL(`file://${__dirname}/client/index.html`);

  mainWindow.on('close', function() {
    mainWindow = null;
  });
});
