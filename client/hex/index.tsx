import * as React from 'react';

interface IHexCellState {
  text: string;
}

export class HexCellComponent extends React.Component<IHexCellState, void> {
  static defaultProps:IHexCellState = {
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

interface IHexState {

}

export class HexComponent extends React.Component<IHexState, void> {
  render() {
    return (
      <div className='hex'>
        {this.props.children}
      </div>
    );
  }
}
