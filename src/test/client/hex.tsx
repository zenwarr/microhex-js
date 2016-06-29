import * as React from 'react';
import {expect} from 'chai';
import {shallow, mount, ShallowWrapper, ReactWrapper} from 'enzyme';
import {HexCell, HexComponent, HexColumnHeader, HexColumn, HexColumnType, HexIntegerColumnData} from '../../hex/index';
import {BufferDataSource} from '../../data/source';
import {IntegerCodec, IntegerFormat, IDecodeResult} from '../../data/codecs';
import {DataDocument} from '../../data/document';

describe('<HexCell />', function() {
  let r:ShallowWrapper<any, {}>;

  beforeEach(function() {
    r = shallow(<HexCell text='test'/>)
  });

  it('renders hex-cell', function() {
    expect(r.hasClass('hex-cell')).true;
  });

  it('sets inner text from text prop', function() {
    expect(r.text()).equals('test');
  });
});

describe('<HexColumnHeader />', function() {
  let r:ShallowWrapper<any, {}>;

  beforeEach(function() {
    r = shallow(<HexColumnHeader text='test'/>);
  });

  it('has proper class', function() {
    expect(r.hasClass('hex-column-header')).true;
  });

  it('renders text', function() {
    expect(r.text()).equals('test');
  });
});

describe('empty <HexColumn />', function() {
  let r:ShallowWrapper<any, {}>;

  beforeEach(function() {
    r = shallow(<HexColumn title='column_title' document={null} columnType={HexColumnType.EMPTY} />);
  });

  it('renders title', function() {
    expect(r.find('.hex-column__header').text()).equals('<HexColumnHeader />');
  });

  it('renders data area', function() {
    expect(r.find('.hex-column__data')).length(1);
  });
});

describe('<HexIntegerColumnData />', function() {
  let r:ReactWrapper<any, {}>;

  beforeEach(function() {
    let document = new DataDocument(new BufferDataSource(Buffer.from('0123456789ABCDEF0123456789ABCDEF0123456789ABCD')));
    let codec = new IntegerCodec(IntegerFormat.Format8Bit);

    r = mount(<HexIntegerColumnData document={document} codec={codec} />);
  });

  it('renders rows', function() {
    console.log(r.text());
  });
});
