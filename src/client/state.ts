import * as Immutable from 'immutable';
import {DataDocument} from '../data/document';
import {AbstractCodec} from '../data/codecs';
import {HexColumnType} from '../hex/index';

let ApplicationStateRecord = Immutable.Record({
  tabs: Immutable.List<TabState>(),
  currentTabId: 0,
  editors: Immutable.List<EditorState>(),
});

export class ApplicationState extends ApplicationStateRecord {
  tabs: Immutable.List<TabState>;
  currentTabId: number;
  editors: Immutable.List<EditorState>;
}

let TabStateRecord = Immutable.Record({
  id: -1,
  title: '',
  editorId: -1
});

export class TabState extends TabStateRecord {
  id: number;
  title: string;
  editorId: number;
}

let EditorStateRecord = Immutable.Record({
  id: -1,
  document: null,
  columns: Immutable.List<ColumnState>()
});

export class EditorState extends EditorStateRecord {
  id: number;
  document: DataDocument;
  columns: Immutable.List<ColumnState>;
}

let ColumnStateRecord = Immutable.Record({
  title: '<untitled>',
  columnType: HexColumnType.EMPTY
});

export class ColumnState extends ColumnStateRecord {
  title: string;
  columnType: HexColumnType;
}

let AddressColumnStateRecord = Immutable.Record({
  title: '<address>',
  columnType: HexColumnType.EMPTY
});

export class AddressColumnState extends AddressColumnStateRecord {
  title: string;
  columnType: HexColumnType;
}

let IntegerCellColumnStateRecord = Immutable.Record({
  title: '<untitled>',
  columnType: HexColumnType.EMPTY,
  rowBinaryLength: 16,
  codec: null // AbstractCodec
});

export class IntegerCellColumnState extends IntegerCellColumnStateRecord {
  title: string;
  columnType: HexColumnType;
  rowBinaryLength: number;
  codec: AbstractCodec;
}

export let initialState:ApplicationState = new ApplicationState();
