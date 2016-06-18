import * as Immutable from 'immutable';

export interface ITabData {
  id: number;
  title: string;
}

export interface IApplicationState {
  tabs: Immutable.List<ITabData>;
  currentTabId: number;
}

export let initialState:Immutable.Map<string, any> = Immutable.fromJS({
  tabs: [],
  currentTabId: -1
});
