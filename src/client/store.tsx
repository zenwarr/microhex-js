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
  protected static _reducer:Redux.Reducer<any> = null;
  protected _store:Redux.Store<any>;

  constructor() {
    this._store = Redux.createStore(StoreManager.applicationReducer, State.initialState, store_enchancer);
  }

  static removeTabReducer(state:State.ApplicationState, action:Actions.IRemoveTab):State.ApplicationState {
    let tab_index:number, tab_state:State.TabState;
    [tab_index, tab_state] = state.get('tabs').findEntry((ts:State.TabState) => {
      return ts.id === action.tabId;
    }) as [number, State.TabState];

    if (tab_state == null) {
      // if tab with this id is not found
      return state;
    } else {
      // remove TabState
      let new_state = state.set('tabs', state.tabs.filter((ts:State.TabState) => {
        return ts.id !== action.tabId;
      })) as State.ApplicationState;

      // and remove EditorState removed TabState refers to
      new_state = new_state.set('editors', new_state.editors.filter((es:State.EditorState) => {
        console.log('es.id =', es.id, ' tab_state.editorId =', tab_state.editorId);
        return es.id !== tab_state.editorId;
      })) as State.ApplicationState;

      // also, when active tab is being removed, activate another tab
      if (state.currentTabId === tab_state.id) {
        if (tab_index > 0) {
          // activate a tab to the left, if there is any
          new_state = new_state.set('currentTabId', state.tabs.get(tab_index - 1).id) as State.ApplicationState;
        } else if (state.tabs.size > 1) {
          // activate a tab to the right, if there is any
          new_state = new_state.set('currentTabId', state.tabs.get(tab_index + 1).id) as State.ApplicationState;
        } else {
          // no other tabs, set current tab to -1
          new_state = new_state.set('currentTabId', -1) as State.ApplicationState;
        }
      }

      return new_state;
    }
  }

  static get applicationReducer():Redux.Reducer<any> {
    if (StoreManager._reducer == null) {
      StoreManager._reducer = function(state:State.ApplicationState = State.initialState,
                                                      action:Actions.IBasic):Immutable.Map<string, any> {
        switch (action.type) {
          case Actions.ADD_TAB: {
            let new_state = state.set('tabs',
                                      state.tabs.push(new State.TabState((action as Actions.IAddTab).tabState)));
            if (new_state.get('currentTabId') < 0) {
              new_state = new_state.set('currentTabId', new_state.get('tabs').get(0).id);
            }
            return new_state;
          }

          case Actions.REMOVE_TAB:
            return StoreManager.removeTabReducer(state, action as Actions.IRemoveTab);

          case Actions.REMOVE_ACTIVE_TAB:
            return StoreManager.removeTabReducer(state, {
              type: Actions.REMOVE_TAB,
              tabId: state.currentTabId
            } as Actions.IRemoveTab);

          case Actions.ACTIVATE_TAB: {
            let q_action = action as Actions.IActivateTab;

            // first check if a tab with this is exists; if not, do not change anything
            let tab_index:number = state.tabs.findKey((ts:State.TabState) => ts.id === q_action.tabId);
            if (tab_index >= 0) {
              return state.set('currentTabId', q_action.tabId);
            } else {
              return state;
            }
          }

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

  get store():Redux.Store<any> { return this._store; }
}
