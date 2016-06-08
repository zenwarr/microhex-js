import {expect} from 'chai';
import {AbstractCodec, IntegerCodec, IntegerFormat, Endianness, DecodeResult, FloatCodec, FloatFormat, EncodingManager, FixedUnitCharCodec} from '../../data/codecs';
import {BufferDataSource} from '../../data/source';
import * as Errors from '../../utils/errors';

function compare_results<T>(result:DecodeResult<T>[], et_result:DecodeResult<T>[]) {
  expect(result.length).equals(et_result.length);

  for (let j = 0; j < et_result.length; ++j) {
    if (et_result[j].decodeError != null) {
      expect(result[j].result).to.be.null;
      expect(result[j].decodeError).instanceof(et_result[j].decodeError.constructor)
    } else {
      expect(result[j].result).equals(et_result[j].result);
      expect(result[j].decodeError).to.be.null;
    }
    expect(result[j].binaryLength).equals(et_result[j].binaryLength);
    expect(result[j].offset).equals(et_result[j].offset);
  }
}

function compare_results_float<T>(result:DecodeResult<T>[], et_result:DecodeResult<T>[], epsilon:number = 0.0001) {
  expect(result.length).equals(et_result.length);

  for (let j = 0; j < et_result.length; ++j) {
    if (et_result[j].decodeError != null) {
      expect(result[j].result).to.be.null;
      expect(result[j].decodeError).instanceof(et_result[j].decodeError.constructor)
    } else {
      expect(result[j].result).closeTo(et_result[j].result as any, epsilon);
      expect(result[j].decodeError).to.be.null;
    }
    expect(result[j].binaryLength).equals(et_result[j].binaryLength);
    expect(result[j].offset).equals(et_result[j].offset);
  }
}

describe('IntegerCodec', function() {
  it('should decode 8-bit integer', function(done:MochaDone) {
    let source = new BufferDataSource(new Buffer('0123456789', 'ascii'));
    let codec = new IntegerCodec(IntegerFormat.Format8Bit, true, Endianness.LittleEndian);

    let result = codec.decodeFromBuffer(new Buffer('0123456789', 'ascii'));

    let et_result:DecodeResult<number>[] = [];
    for (let j = 0; j < 10; ++j) {
      et_result.push({
        result: '0123456789'.charCodeAt(j),
        offset: j,
        binaryLength: 1,
        decodeError: null
      });
    }

    compare_results(result, et_result);

    codec.decode(source.readAll()).then((r:DecodeResult<number>[]) => {
      compare_results(r, et_result);
      done();
    }, () => expect.fail());
  });

  it('should decode 32-bit unsigned big endian integer', function(done:MochaDone) {
    let source = new BufferDataSource(new Buffer('\xb8\x24\x06\x4a', 'ascii'));
    let codec = new IntegerCodec(IntegerFormat.Format32Bit, false, Endianness.BigEndian);

    let et_result:DecodeResult<number>[] = [{
      result: 0xb824064a,
      offset: 0,
      binaryLength: 4,
      decodeError: null
    }];

    compare_results(codec.decodeFromBuffer(new Buffer('\xb8\x24\x06\x4a', 'ascii')), et_result);

    codec.decode(source.readAll()).then((r:DecodeResult<number>[]) => {
      compare_results(r, et_result);
      done();
    }, () => expect.fail());
  });

  it('should report error when no enough data is available', function(done:MochaDone) {
    let source = new BufferDataSource(new Buffer('\x12', 'ascii'));
    let codec = new IntegerCodec(IntegerFormat.Format16Bit);

    let et_result:DecodeResult<number>[] = [{
      result: null,
      offset: 0,
      binaryLength: 1,
      decodeError: new Errors.NoEnoughData()
    }];

    compare_results(codec.decodeFromBuffer(new Buffer('\x12', 'ascii'), 0, 1), et_result);

    codec.decode(source.readAll(), 1).then((r:DecodeResult<number>[]) => {
      compare_results(r, et_result);
      done();
    }, () => expect.fail());
  });

  it('should decode with offset', function() {
    let buf = new Buffer('0123456789');
    let codec = new IntegerCodec(IntegerFormat.Format32Bit);

    let et_result:DecodeResult<number>[] = [{
      result: 0x36353433,
      offset: 3,
      binaryLength: 4,
      decodeError: null
    }];

    expect(compare_results(codec.decodeFromBuffer(buf, 3, 1), et_result));
  });

  it('should report partial with offset', function() {
    let buf = new Buffer('0123456789');
    let codec = new IntegerCodec(IntegerFormat.Format32Bit);

    let et_result:DecodeResult<number>[] = [{
      result: null,
      offset: 8,
      binaryLength: 2,
      decodeError: new Errors.NoEnoughData()
    }];

    expect(compare_results(codec.decodeFromBuffer(buf, 8, 1), et_result));
  });

  it('should report when buffer is null', function() {
    let codec = new IntegerCodec(IntegerFormat.Format32Bit);
    expect(() => codec.decodeFromBuffer(null)).to.throw(Errors.InvalidArguments);
  });

  it('should throw ArgumentError when no data is available', function() {
    let codec = new IntegerCodec(IntegerFormat.Format32Bit);

    expect(() => codec.decodeFromBuffer(Buffer.alloc(0)).length).throws(Errors.InvalidArguments);
    expect(() => codec.decodeFromBuffer(new Buffer('0123'), 4).length).throws(Errors.InvalidArguments);
  });

  describe('unit_limit > 0', function() {
    let codec:IntegerCodec;

    beforeEach(function() {
      codec = new IntegerCodec(IntegerFormat.Format32Bit);
    });

    it('should not decode more units than required', function() {
      let buf = new Buffer('01234567890123456789');
      expect(codec.decodeFromBuffer(buf, 0, 2).length).equals(2);
    });
  });

  describe('unit_limit == 0', function() {
    let codec:IntegerCodec;

    beforeEach(function() {
      codec = new IntegerCodec(IntegerFormat.Format16Bit);
    });

    it('adds message about partially decoded unit', function() {
      let buf = new Buffer('\x01\x02\x03\x04\x05');

      let et_result = [{
        result: 0x0201,
        offset: 0,
        binaryLength: 2,
        decodeError: null
      }, {
        result: 0x0403,
        offset: 2,
        binaryLength: 2,
        decodeError: null
      }, {
        result: null,
        offset: 4,
        binaryLength: 1,
        decodeError: new Errors.NoEnoughData()
      }];

      compare_results(codec.decodeFromBuffer(buf, 0, 0), et_result);
    });
  });

  describe('unit_limit < 0', function() {
    let codec:IntegerCodec;

    beforeEach(function() {
      codec = new IntegerCodec(IntegerFormat.Format16Bit);
    });

    it('does not add message about partially decoded unit', function() {
      let buf = new Buffer('\x01\x02\x03\x04\x05');

      let et_result = [{
        result: 0x0201,
        offset: 0,
        binaryLength: 2,
        decodeError: null
      }, {
        result: 0x0403,
        offset: 2,
        binaryLength: 2,
        decodeError: null
      }];

      compare_results(codec.decodeFromBuffer(buf, 0, -1), et_result);
    });
  });
});

describe('FloatCodec', function() {
  it('should decode 32-bit float', function(done:MochaDone) {
    let buf = new Buffer('\xda\xc3\xf7\x44', 'ascii');
    let codec = new FloatCodec(FloatFormat.Format32Bit);

    let et_result:DecodeResult<number>[] = [{
      result: 1982.12039,
      offset: 0,
      binaryLength: 4,
      decodeError: null
    }];

    compare_results_float(codec.decodeFromBuffer(buf), et_result, 0.0001);

    codec.decode(new BufferDataSource(buf).readAll()).then((r:DecodeResult<number>[]) => {
      compare_results_float(r, et_result, 0.0001);
      done();
    }, () => expect.fail());
  });

  it('should decode 64-bit float', function(done:MochaDone) {
    let buf = new Buffer('\x10\x23\x84\x47\x7b\xf8\x9e\x40', 'ascii');
    let codec = new FloatCodec(FloatFormat.Format64Bit);

    let et_result:DecodeResult<number>[] = [{
      result: 1982.12039,
      offset: 0,
      binaryLength: 8,
      decodeError: null
    }];

    compare_results_float(codec.decodeFromBuffer(buf), et_result, 0.0001);

    codec.decode(new BufferDataSource(buf).readAll()).then((r:DecodeResult<number>[]) => {
      compare_results_float(r, et_result, 0.0001);
      done();
    }, () => expect.fail());
  });

  it('should decode 64-bit float in big endian', function(done:MochaDone) {
    let buf = new Buffer('\x40\x9e\xf8\x7b\x47\x84\x23\x10', 'ascii');
    let codec = new FloatCodec(FloatFormat.Format64Bit, Endianness.BigEndian);

    let et_result:DecodeResult<number>[] = [{
      result: 1982.12039,
      offset: 0,
      binaryLength: 8,
      decodeError: null
    }];

    compare_results_float(codec.decodeFromBuffer(buf), et_result, 0.0001);

    codec.decode(new BufferDataSource(buf).readAll()).then((r:DecodeResult<number>[]) => {
      compare_results_float(r, et_result, 0.0001);
      done();
    }, () => expect.fail());
  });

  it('should report error when no enough data is available', function(done:MochaDone) {
    let codec = new FloatCodec(FloatFormat.Format64Bit);
    let buf = Buffer.alloc(3);

    let et_result:DecodeResult<number>[] = [{
      result: null,
      offset: 0,
      binaryLength: 3,
      decodeError: new Errors.NoEnoughData()
    }];

    compare_results_float(codec.decodeFromBuffer(buf, 0, 1), et_result);

    codec.decode(new BufferDataSource(buf).readAll(), 1).then((r:DecodeResult<number>[]) => {
      compare_results_float(r, et_result);
      done();
    }, () => expect.fail());
  });
});

describe('EncodingManager', function() {
  let manager:EncodingManager;

  before(function() {
    manager = EncodingManager.instance;
  });

  it('instance is not null', function() {
    expect(manager).not.null;
  });

  describe('simpleName', function() {
    it('should strip whitespace, dashes and underscores and convert to lowercase', function() {
      expect(EncodingManager.simpleName('Encoding name___120-1')).equals('encodingname1201');
    });
  });

  describe('hasCodec', function() {
    it('shuuld return true if codec exists', function() {
      expect(manager.hasCodec('Windows 1251')).true;
      expect(manager.hasCodec('Windows-1251')).true;
    });

    it('should return false if codec does not exists', function() {
      expect(manager.hasCodec('Unknown codec')).false;
    });

    it('should return true if codec is specified with alias', function() {
      expect(manager.hasCodec('us')).true;
    });

    it('returned codec has correct name even if queried from alias', function() {
      expect(manager.getCodec('win1251').name).equals('windows-1251');
    });
  });

  describe('getCodec', function() {
    it('should return ICharCodec instance for codec', function() {
      expect(manager.getCodec('windows-1251')).instanceOf(FixedUnitCharCodec);
    });

    it('should return null for codecs that does not exist', function() {
      expect(manager.getCodec('unknown-codec')).null;
    });
  });
});

describe('FixedUnitCharCodec', function() {
  let codec:AbstractCodec;

  beforeEach(function() {
    codec = EncodingManager.instance.getCodec('KOI8-R');
  });

  it('should work.', function() {
    let et_result:DecodeResult<string>[] = [{
      result: 'т',
      offset: 0,
      binaryLength: 1,
      decodeError: null
    }, {
      result: 'е',
      offset: 1,
      binaryLength: 1,
      decodeError: null
    }, {
      result: 'к',
      offset: 2,
      binaryLength: 1,
      decodeError: null
    }, {
      result: 'с',
      offset: 3,
      binaryLength: 1,
      decodeError: null
    }, {
      result: 'т',
      offset: 4,
      binaryLength: 1,
      decodeError: null
    }];

    compare_results(codec.decodeFromBuffer(new Buffer('\xd4\xc5\xcb\xd3\xd4', 'ascii')), et_result);
  });

  it('has correct name', function() {
    expect(codec.name).equals('KOI8-R');
  });
});
