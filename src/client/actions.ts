import * as State from './state';

export interface IBasic {
  type:string;
}

export const OPEN_FILE__REQUEST = 'OPEN_FILE:REQUEST';
export const OPEN_FILE__CANCEL = 'OPEN_FILE:CANCEL';
export const OPEN_FILE__DO = 'OPEN_FILE:DO';
export const OPEN_FILE__SUCCESS = 'OPEN_FILE:SUCCESS';
export const OPEN_FILE__FAIL = 'OPEN_FILE:FAIL';

export const ADD_TAB = 'ADD_TAB';
export const REMOVE_ACTIVE_TAB = 'REMOVE_ACTIVE_TAB';
export const REMOVE_TAB = 'REMOVE_TAB';
export const ACTIVATE_TAB = 'ACTIVATE_TAB';

export const ADD_EDITOR = 'ADD_EDITOR';
export const REMOVE_EDITOR = 'REMOVE_EDITOR';

export interface IAddTab extends IBasic {
  tabState:State.TabState;
}

export interface IRemoveTab extends IBasic {
  tabId:number;
}

export interface IActivateTab extends IBasic {
  tabId:number;
}

export interface IAddEditor extends IBasic {
  editorState: State.EditorState;
}

export interface IRemoveEditor extends IBasic {
  editorId: number;
}

export interface IOpenFileRequest extends IBasic {
  filename: string;
}
