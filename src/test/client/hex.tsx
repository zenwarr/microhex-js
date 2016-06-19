import * as React from 'react';
import {expect} from 'chai';
import {shallow} from 'enzyme';
import {HexCellComponent, HexComponent} from '../../../client/hex/index';

describe('<HexCellComponent />', function() {
  it('renders hex-cell', function() {
    let r = shallow(<HexCellComponent text='test' />);
    expect(r.hasClass('hex-cell')).true;
  });

  it('sets inner text from text prop', function() {
    let r = shallow(<HexCellComponent text='test' />);
    expect(r.text()).equals('test');
  });
});
