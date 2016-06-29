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
  protected _store:Redux.Store;

  constructor() {
    let applicationReducer:Redux.Reducer = function(state:State.ApplicationState = State.initialState,
                                                    action:Actions.IBasic):Immutable.Map<string, any> {
      switch (action.type) {
        case Actions.ADD_TAB:
          return state.set('tabs', state.tabs.push((action as Actions.IAddTab).tabState));

        case Actions.REMOVE_TAB:
          return state.set('tabs', state.tabs.filter(x => x.id !== (action as Actions.IRemoveTab).tabId));

        case Actions.ACTIVATE_TAB:
          return state.set('currentTabId', (action as Actions.IActivateTab).tabId);

        case Actions.CLOSE_ACTIVE_TAB:
          return state.set('tabs', state.tabs.filter(x => x.id !== state.currentTabId));

        case Actions.ADD_EDITOR:
          return state.set('editors', state.editors.push((action as Actions.IAddEditor).editorState));

        case Actions.REMOVE_EDITOR:
          return state.set('editors', state.editors.filter(x => x.id !== (action as Actions.IRemoveEditor).editorId));

        default:
          return state;
      }
    };

    this._store = Redux.createStore(applicationReducer, State.initialState, store_enchancer);
  }

  static get instance():StoreManager {
    if (StoreManager._instance == null) {
      StoreManager._instance = new StoreManager();
    }

    return StoreManager._instance;
  }

  get store():Redux.Store { return this._store; }
}
