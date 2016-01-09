var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');
var electron = require('electron');
var crypto = require('crypto');
var dialog = require('dialog');

var ds = require('./data/source');
var DataCursor = require('./data/cursor').DataCursor;
var transform = require('./data/transform');

const ipcMain = electron.ipcMain;
var mainWindow = null;

var source;

app.on('ready', function() {
  build_menus();

  mainWindow = new BrowserWindow({
    title: 'Microhex'
  });
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});

function build_menus() {
  var menu_template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          click: open_file
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Open development tools'
        }
      ]
    }
  ];

  var menu = Menu.buildFromTemplate(menu_template);
  Menu.setApplicationMenu(menu);
}

ipcMain.on('data-query', function(event, arg) {
  var cursor = new DataCursor(source, 0, new transform.TransformToHex());
  var data = [];

  function read_data(err, decoded) {
    if (!err && decoded != undefined) {
      data.push({
        text: decoded
      });
    }

    if (err == undefined && decoded == undefined) {
      event.sender.send('data-reply', data);
    }
  }

  cursor.read(-1, read_data);
});

function open_file() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Open file',
    filters: [
      {
        name: 'All files',
        extensions: ['*']
      }
    ],
    properties: ['openFile']
  }, function(filenames) {
    if (filenames == undefined) {
      return;
    }

    var filename = filenames[0];

    ds.createFileDS(filename, { writeable: true }, function(err, src) {
      if (err) {
        console.log('error while opening file: ' + err.message);
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Failed to open file',
          message: err.detailed(),
          buttons: ['Ok']
        }, function() { } );
        return;
      }

      source = src;
      mainWindow.webContents.send('src-avail');
    });
  });
}