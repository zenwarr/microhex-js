import * as Redux from 'redux';
import * as Actions from './actions';
import * as State from './state';
import * as Immutable from 'immutable';

let store_enchancer;

if (process.env.NODE_ENV !== 'production') {
  let store_dev = require('./store-dev');
  store_enchancer = store_dev.DevTools.instrument();
}

export class StoreManager {
  protected static _instance:StoreManager = null;
  protected static _reducer:Redux.Reducer = null;
  protected _store:Redux.Store;

  constructor() {
    this._store = Redux.createStore(StoreManager.applicationReducer, State.initialState, store_enchancer);
  }

  static get applicationReducer():Redux.Reducer {
    if (StoreManager._reducer == null) {
      StoreManager._reducer = function(state:State.ApplicationState = State.initialState,
                                                      action:Actions.IBasic):Immutable.Map<string, any> {
        switch (action.type) {
          case Actions.ADD_TAB: {
            let new_state:Immutable.Map<string, any> = state.set('tabs',
                                    state.tabs.push(new State.TabState((action as Actions.IAddTab).tabState)));
            if (new_state.get('currentTabId') < 0) {
              new_state = new_state.set('currentTabId', new_state.get('tabs').get(0).id);
            }
            return new_state;
          }

          case Actions.REMOVE_TAB:
            return state.set('tabs', state.tabs.filter(x => x.id !== (action as Actions.IRemoveTab).tabId));

          case Actions.ACTIVATE_TAB:
            return state.set('currentTabId', (action as Actions.IActivateTab).tabId);

          case Actions.CLOSE_ACTIVE_TAB:
            return state.set('tabs', state.tabs.filter(x => x.id !== state.currentTabId));

          case Actions.ADD_EDITOR:
            return state.set('editors', state.editors.push(new State.EditorState((action as Actions.IAddEditor).editorState)));

          case Actions.REMOVE_EDITOR:
            return state.set('editors', state.editors.filter(x => x.id !== (action as Actions.IRemoveEditor).editorId));

          default:
            return state;
        }
      };
    }
    return StoreManager._reducer;
  }

  static get instance():StoreManager {
    if (StoreManager._instance == null) {
      StoreManager._instance = new StoreManager();
    }

    return StoreManager._instance;
  }

  get store():Redux.Store { return this._store; }
}
