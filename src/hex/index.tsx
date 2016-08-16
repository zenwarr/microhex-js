import * as React from 'react';
import {DataDocument} from '../data/document';
import {AbstractCodec, IDecodeResult} from '../data/codecs';
import * as Errors from '../utils/errors';

export interface IHexProps {
  document:DataDocument;
  columns:IHexColumnProps[];
}

/**
 * Renders main hex widget containing of columns
 */
export class HexComponent extends React.Component<IHexProps, void> {
  static defaultProps:IHexProps = {
    document: null,
    columns: []
  };

  render() {
    return (
      <div className='hex'>
        {this.props.columns.map((column_state, index) => <HexColumn {...column_state}
          document={this.props.document} key={index} />)}
      </div>
    );
  }
}

interface IHexCellProps {
  text: string;
}

/**
 * Single cell of hex editor
 */
export class HexCell extends React.Component<IHexCellProps, void> {
  static defaultProps:IHexCellProps = {
    text: ''
  };

  render() {
    return (
      <div className='hex-cell'>
        <span className='hex-cell__text'>{this.props.text}</span>
      </div>
    );
  }
}

export interface IHexRowData {

}

/*
 * Renders row of data inside a hex component
 */
export class HexRow extends React.Component<IHexRowData, void> {
  render() {
    return (
      <div className='hex-row'>
        {this.props.children}
      </div>
    );
  }
}

/*
 * All supported column types should be listed here
 */
export enum HexColumnType {
  EMPTY,
  INTEGER
}

export interface IHexColumnProps {
  title?:string;
  document?:DataDocument;
  columnType?:HexColumnType;
}

/**
 * An hex editor widget consists of columns. Each column can have its own settings and a codec to display data.
 * A column renders its header with a title, controls and a data area that actually displays data.
 */
export class HexColumn<T extends IHexColumnProps> extends React.Component<T, void> {
  static defaultProps:IHexColumnProps = {
    title: '<untitled>',
    document: null,
    columnType: HexColumnType.EMPTY
  };

  render() {
    let columnData:JSX.Element;

    if (this.props.columnType === HexColumnType.INTEGER) {
      columnData = <HexIntegerColumnData {...(this.props as IHexIntegerColumnDataProps)} />;
    } else {
      columnData = <div></div>;
    }

    return (
      <div className='hex-column'>
        <div className='hex-column__header'>
          <HexColumnHeader text={this.props.title} />
        </div>

        <div className='hex-column__data'>
          {columnData}
        </div>
      </div>
    );
  }
}

export interface IHexCodecColumnDataProps extends IHexColumnProps {
  codec?:AbstractCodec;
}

/*
 * A component to display data inside a hex column
 */
export abstract class HexColumnData<T extends IHexColumnProps, S> extends React.Component<T, S> {

}

export interface IHexCodecColumnDataState {
  dataLoaded?:boolean;
  dataCache?:IDecodeResult[];
  loadError?:Error;
}

/*
 * A specialized column to show data from decoded by a codec.
 */
export abstract class HexCodecColumnData<T extends IHexCodecColumnDataProps> extends HexColumnData<T, IHexCodecColumnDataState> {
  constructor() {
    super();
    this.state = {
      dataLoaded: false,
      dataCache:[],
      loadError:null
    };
  }

  componentDidMount() {
    if (this.props.document == null || this.props.codec == null) {
      this.setState({
        dataLoaded:true
      });
    } else {
      this.props.codec.decode(this.props.document.readAll(), 0).then((r:IDecodeResult[]) => {
        this.setState({
          dataLoaded:true,
          dataCache:r
        });
      }).catch((err:Error) => {
        this.setState({
          loadError: new Errors.IO(err.message, err)
        });
      });
    }
  }

  render() {
    if (this.state.loadError != null) {
      return (
        <div className='hex-column-msg hex-column-mgs--error'>
          Error while reading data: {this.state.loadError.message}
        </div>
      );
    } else if (!this.state.dataLoaded) {
      return (
        <div className='hex-column-msg hex-column-msg--loading'>
          Loading...
        </div>
      );
    } else {
      return this._doRender();
    }
  }

  abstract _doRender():JSX.Element;
}

export interface IHexFixedCellColumnDataProps extends IHexCodecColumnDataProps {
  rowBinaryLength?:number;
}

/*
 * A specialized column to show data from a codec with fixed unit width
 */
export abstract class HexFixedCellColumnData<T extends IHexFixedCellColumnDataProps> extends HexCodecColumnData<T> {
  _doRender():JSX.Element {
    let rows:JSX.Element[] = [];

    let cur_cache_index = 0;
    let rows_count = Math.floor(this.state.dataCache.length / this.props.rowBinaryLength);
    if (this.state.dataCache.length % this.props.rowBinaryLength > 0) {
      ++rows_count;
    }
    for (let j = 0; j < rows_count; ++j) {
      let cells:JSX.Element[] = [];

      for (let c = 0; c < this.props.rowBinaryLength && cur_cache_index < this.state.dataCache.length; ++cur_cache_index) {
        let cache_item = this.state.dataCache[cur_cache_index];
        cells.push(<HexCell text={this._toText(cache_item)} key={c} />);
        c += cache_item.binaryLength;
      }

      rows.push(<HexRow key={j}>{cells}</HexRow>);
    }

    return (
      <div className='hex-data'>
        {rows}
      </div>
    );
  }

  _toText(dr:IDecodeResult):string {
    let res = '' + dr.result;
    if (res.length < 3) {
      res = new Array(3 - res.length + 1).join('0') + res;
    }
    return res;
  }
}

export interface IHexIntegerColumnDataProps extends IHexFixedCellColumnDataProps {
  // formatter:IntegerFormatter;
}

/*
 * A specialized component to show data from IntegerCodec
 */
export class HexIntegerColumnData extends HexFixedCellColumnData<IHexIntegerColumnDataProps> {
  static defaultProps:IHexIntegerColumnDataProps = {
    title:'',
    columnType:HexColumnType.INTEGER,
    codec:null,
    rowBinaryLength: 16
  };
}

interface IHexColumnHeaderProps {
  text:string;
}

export class HexColumnHeader extends React.Component<IHexColumnHeaderProps, void> {
  static defaultProps:IHexColumnHeaderProps = {
    text: '<untitled>'
  };

  render() {
    return (
      <div className='hex-column-header'>
        <span className='hex-column-header__text'>{this.props.text}</span>
        {this.props.children}
      </div>
    );
  }
}
