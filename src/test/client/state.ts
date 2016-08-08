import {expect} from 'chai';
import * as chai from 'chai';
import * as Immutable from 'immutable';
import * as State from '../../client/state';
import * as Actions from '../../client/actions';
import {StoreManager} from '../../client/store';

let chaiImmutable = require('chai-immutable');
chai.use(chaiImmutable);

describe('initial state', function() {
  it('should equal to default', function() {
    let defaultState = new State.ApplicationState();
    expect(State.initialState).equals(defaultState);
  });
});

describe('Action.ADD_TAB', function() {
  it('adds TabState to list, and makes it active if no other tab is active', function() {
    let st:State.ApplicationState = new State.ApplicationState();
    st = (StoreManager.applicationReducer)(st, {
      type: Actions.ADD_TAB,
      tabState: {
        id: 0,
        title: 'test title',
        editorId: -1
      }
    } as Actions.IAddTab);

    expect(st).equals(new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'test title',
          editorId: -1
        })
      ]),
      currentTabId: 0,
      editors: Immutable.List()
    }));
  });

  it('adds TabState to list, but does not make it active if there is another active tab', function() {
    let st:State.ApplicationState = new State.ApplicationState();

    st = (StoreManager.applicationReducer)(st, {
      type: Actions.ADD_TAB,
      tabState: {
        id: 0,
        title: 'test title',
        editorId: -1
      }
    } as Actions.IAddTab);

    st = (StoreManager.applicationReducer)(st, {
      type: Actions.ADD_TAB,
      tabState: {
        id: 1,
        title: 'just another tab',
        editorId: -1
      }
    } as Actions.IAddTab);

    expect(st).equals(new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'test title',
          editorId: -1
        }),
        new State.TabState({
          id: 1,
          title: 'just another tab',
          editorId: -1
        })
      ]),
      currentTabId: 0,
      editors: Immutable.List()
    }));
  });
});

describe('Action.REMOVE_TAB', function() {
  it('removes tabstate from list', function() {
    let st:State.ApplicationState = new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'first',
          editorId: -1
        }),
        new State.TabState({
          id: 1,
          title: 'second',
          editorId: -1
        })
      ]),
      currentTabId: -1,
      editors: Immutable.List()
    });

    st = (StoreManager.applicationReducer)(st, {
      type: Actions.REMOVE_TAB,
      tabId: 1
    } as Actions.IRemoveTab);

    expect(st).equals(new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'first',
          editorId: -1
        })
      ]),
      currentTabId: -1,
      editors: Immutable.List()
    }));
  });

  it('should remove a corresponding editor too', function() {
    let st:State.ApplicationState = new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'test title',
          editorId: 10
        }),
        new State.TabState({
          id: 1,
          title: 'another tab',
          editorId: 20
        })
      ]),
      currentTabId: 0,
      editors: Immutable.List([
        new State.EditorState({
          id: 10,
          document: null,
          columns: Immutable.List<State.ColumnState>()
        }),
        new State.EditorState({
          id: 20,
          document: null,
          columns: Immutable.List<State.ColumnState>()
        })
      ])
    });

    st = (StoreManager.applicationReducer)(st, {
      type: Actions.REMOVE_TAB,
      tabId: 1
    });

    expect(st).equals(new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'test title',
          editorId: 10
        })
      ]),
      currentTabId: 0,
      editors: Immutable.List([
        new State.EditorState({
          id: 10,
          document: null,
          columns: Immutable.List<State.ColumnState>()
        })
      ])
    }));
  });

  it('should activate another tab when current one is closed', function() {
    let st:State.ApplicationState = new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'test title',
          editorId: 10
        }),
        new State.TabState({
          id: 1,
          title: 'another tab',
          editorId: 20
        })
      ]),
      currentTabId: 0,
      editors: Immutable.List([
        new State.EditorState({
          id: 10,
          document: null,
          columns: Immutable.List<State.ColumnState>()
        }),
        new State.EditorState({
          id: 20,
          document: null,
          columns: Immutable.List<State.ColumnState>()
        })
      ])
    });

    st = (StoreManager.applicationReducer)(st, {
      type: Actions.REMOVE_TAB,
      tabId: 1
    });

    expect(st).equals(new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'test title',
          editorId: 10
        })
      ]),
      currentTabId: 0,
      editors: Immutable.List([
        new State.EditorState({
          id: 10,
          document: null,
          columns: Immutable.List<State.ColumnState>()
        })
      ])
    }));
  });
});

describe('Action.ACTIVATE_TAB', function() {
  it('changes currentTabId', function() {
    let st:State.ApplicationState = new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'first',
          editorId: -1
        }),
        new State.TabState({
          id: 1,
          title: 'second',
          editorId: -1
        })
      ]),
      currentTabId: -1,
      editors: Immutable.List()
    });

    st = (StoreManager.applicationReducer)(st, {
      type: Actions.ACTIVATE_TAB,
      tabId: 1
    } as Actions.IActivateTab);

    expect(st).equals(new State.ApplicationState({
      tabs: Immutable.List([
        new State.TabState({
          id: 0,
          title: 'first',
          editorId: -1
        }),
        new State.TabState({
          id: 1,
          title: 'second',
          editorId: -1
        })
      ]),
      currentTabId: 1,
      editors: Immutable.List()
    }));
  });
});
