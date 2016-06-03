import * as electron from 'electron';

const ipcMain:Electron.IpcMain = electron.ipcMain;
let mainWindow:Electron.BrowserWindow = null;

electron.app.on('ready', function() {
  mainWindow = new electron.BrowserWindow({
    width: 800,
    height: 600
  });

  mainWindow.webContents.openDevTools();
  mainWindow.webContents.loadURL(`file://${__dirname}/../client/index.html`);

  mainWindow.on('close', function() {
    mainWindow = null;
  });
});

ipcMain.on('data-query', function(event:Electron.IpcMainEvent) {
  event.sender.send('data-reply', [10, 20, 30, 40, 50]);
});
