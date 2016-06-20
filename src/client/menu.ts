import * as Electron from 'electron';
import {StoreManager} from './store';
import * as Actions from './actions';

const Menu = Electron.remote.Menu;

// build application menu
const menu_template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open',
        click: function(menuItem:Electron.MenuItem, browserWindow:Electron.BrowserWindow):void {
          StoreManager.instance.store.dispatch({
            type: Actions.OPEN_FILE__REQUEST
          } as Actions.IBasic);
        }
      },
      {
        label: 'Close',
        click: function(menuItem:Electron.MenuItem, browserWindow:Electron.BrowserWindow):void {
          StoreManager.instance.store.dispatch({
            type: Actions.CLOSE_ACTIVE_TAB
          } as Actions.IBasic);
        }
      }
    ]
  },
  {
    label: 'Service',
    submenu: [
      {
        label: 'Toggle developer tools',
        accelerator: 'Ctrl+Shift+I',
        click: function(menuItem:Electron.MenuItem, browserWindow:Electron.BrowserWindow):void {
          browserWindow.webContents.toggleDevTools();
        }
      },
      {
        label: 'Reload',
        click: function(menuItem:Electron.MenuItem, browserWindow:Electron.BrowserWindow):void {
          browserWindow.reload();
        }
      }
    ]
  }
];

export function initMenu() {
  const menu:Electron.Menu = Menu.buildFromTemplate(menu_template);
  Menu.setApplicationMenu(menu);
}
