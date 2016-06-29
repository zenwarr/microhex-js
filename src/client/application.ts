import * as Electron from 'electron';
import * as Immutable from 'immutable';
import * as Actions from './actions';
import * as Errors from '../utils/errors';
import * as State from './state';
import {StoreManager} from './store';
import {FileDataSource} from '../data/source';
import {DataDocument} from '../data/document';
import * as path from 'path';

export class Application {
  protected static _instance:Application;
  protected _ids:{ [group:string]:number } = {};

  static get instance():Application {
    if (Application._instance == null) {
      Application._instance = new Application();
    }
    return Application._instance;
  }

  generateId(group:string):number {
    if (this._ids[group] == null) {
      this._ids[group] = 0;
    }
    return this._ids[group]++;
  }

  reportError(err:Error):void {
    Electron.remote.dialog.showMessageBox({
      type: 'warning',
      buttons: ['Close'],
      title: 'Error while performing the operation',
      message: `Error has been occupied, message is "${err.message}"`
    });
  }

  openFile(filename:string, flags:string, mode?:number):void {
    if (filename == null || filename.length === 0) {
      throw new Errors.InvalidArguments();
    }

    StoreManager.instance.store.dispatch({
      type: Actions.OPEN_FILE__REQUEST,
      filename: filename
    } as Actions.IOpenFileRequest);

    // try to create a data source
    FileDataSource.create(filename, flags, mode).then((ds:FileDataSource) => {
      // ok, let's create a document
      let doc = new DataDocument(ds);

      let editor_id = Application.instance.generateId('editor');
      StoreManager.instance.store.dispatch({
        type: Actions.ADD_EDITOR,
        editorState: {
          id: editor_id,
          document: doc,
          columns: Immutable.List<State.ColumnState>()
        }
      } as Actions.IAddEditor);

      StoreManager.instance.store.dispatch({
        type: Actions.ADD_TAB,
        tabState: {
          id: Application.instance.generateId('tab'),
          title: path.basename(filename),
          editorId: editor_id
        }
      });
    }).catch((err:Error) => {
      Application.instance.reportError(err);
    });
  }
}
