import * as Errors from '../utils/errors';
import {DataReadStream} from './stream';
import {BufferAggregator} from '../utils/utils';
import {Range, QRange} from '../utils/range';

/**
 * This is generic interface for decoding result. Offset indicates offset of binary representation from
 * the start of buffer or stream, and binaryLength is the length of value binary representation.
 * If there was an error while decoding value, result is set to 0, and decodeError hold the error object.
 * If there was not enough data to decode value unit, decodeError field is set to instance of Errors.NoEnoughData
 * and binaryLength field holds number of octets that was provided.
 * If the start of next unit in flow of provided stream of buffer cannot be the first octet of value unit, decodeError is set
 * to instance of Errors.PositionIsNotUnitStart, binaryLength is set to 0 and offset is set to correct
 * position of buffer or stream from which code unit was attempted to be decoded.
 */
export interface IDecodeResult {
  result:any;
  offset:number;
  binaryLength: number;
  decodeError:Error;
}

export class DecodeResult<T> implements IDecodeResult {
  public result:T;
  public offset:number;
  public binaryLength:number;
  public decodeError:Error;
}

export interface IAbstractCodecOptions {
  isFixedSize:boolean;
  unitSize:number;
}

export class DecodeContext {
  public buffer:Buffer = null; // should not be changed by codec implementation
  public bufferOffset:number = 0;
  public prevBufferOffset:number = 0; // should not be changed by codec implementation
}

/**
 * Class that allows to get values from binary data and encode values in binary.
 * Value unit is binary representation of value in stream of binary data.
 */
export abstract class AbstractCodec {
  constructor(protected _options:IAbstractCodecOptions) { }

  /**
   * @returns {boolean} True if every valid value unit has binary representation of same size
   */
  get isFixedSize():boolean { return this._options.isFixedSize; }

  /**
   * @returns {number} If isFixedSize is true, returns number of octets in unit. Otherwise, -1 is returned.
   */
  get unitSize():number {
    return this._options.isFixedSize ? this._options.unitSize : -1;
  }

  /**
   * Each codec should have unique human-readable name, which makes it possible to retrieve codec with same parameters.
   */
  get name():string { throw Errors.NotImplemented; }

  protected _processUnit(context:DecodeContext, unitLimit:number, result:IDecodeResult[]):boolean {
    let buf_range = new Range(context.bufferOffset, new QRange(context.buffer.length).itemsFrom(context.bufferOffset));
    let octets_left = buf_range.itemsFrom(context.bufferOffset);

    if (octets_left === 0) {
      return false;
    }

    if (this.isFixedSize && octets_left < this.unitSize) {
      // no enough data left for unit, exiting
      if (unitLimit >= 0) { // if unitLimit < 0, no need to add this
        result.push({
          result: null,
          offset: context.bufferOffset,
          binaryLength: octets_left,
          decodeError: new Errors.NoEnoughData()
        } as DecodeResult<void>);
      }
      return false;
    }

    try {
      let decoded_unit:IDecodeResult = this._do_decodeUnit(context);

      if (context.bufferOffset < context.prevBufferOffset + decoded_unit.binaryLength) {
        // units should not overlap (although some octets can be skipped)
        console.warn(this.name + ': overlapped value units while decoding');
        result.push({
          result: null,
          offset: context.prevBufferOffset,
          binaryLength: 0,
          decodeError: new Errors.DecodeFlowStop()
        } as DecodeResult<void>);
        return false;
      }

      if (decoded_unit.decodeError != null) { // there was an error reported by codec
        if (decoded_unit.decodeError instanceof Errors.NoEnoughData) {
          if (decoded_unit.binaryLength !== octets_left) {
            console.warn('Incorrect binary length reported by codec ' + this.name);
            decoded_unit.binaryLength = octets_left;
          }
          if (unitLimit >= 0) {
            result.push(decoded_unit);
          }
          return false;
        } else if (context.prevBufferOffset >= context.bufferOffset) {
          // codec has not changed bufferOffset, seems stuck, we cannot recover from this error
          result.push(decoded_unit);
          result.push({ // report flow stop
            result: null,
            offset: context.prevBufferOffset + decoded_unit.binaryLength,
            binaryLength: 0,
            decodeError: new Errors.DecodeFlowStop()
          } as DecodeResult<void>);
          return false;
        } else {
          result.push(decoded_unit); // error, but we should continue
        }
      } else if (context.bufferOffset <= context.prevBufferOffset) {
        // Codec seems to be stuck. No way.
        result.push({
          result: null,
          offset: context.prevBufferOffset,
          binaryLength: 0,
          decodeError: new Errors.DecodeFlowStop()
        } as DecodeResult<void>);
        return false;
      } else {
        result.push(decoded_unit);
      }
    } catch (err) {
      // exception decoding! We should not try to recover in this case. Codecs should indicate errors by returning
      // results that indicate an error, not by exceptions.
      result.push({
        result: null,
        offset: context.bufferOffset,
        binaryLength: 0,
        decodeError: err
      } as DecodeResult<void>);
      return false;
    }

    return true;
  }

  /**
   * Tries to get values from its binary representation.
   * @param input Buffer to read from.
   * @param unitLimit Maximal number of units to decode. If unitLimit is > 0, only specified number of units will be
   * decoded, but resulting array can contain less then unitLimit number of entries. If there are no enough data to
   * decode next unit, buf unitLimit is not reached yet, DecodeResult with Errors.NoEnoughData will be placed into
   * result array and decoding ends.
   * If unitLimit equals to zero, codec will decode all available data. If there are no enough data to decode a unit,
   * DecodeResult with Errors.NoEnoughData will be placed into result array and decoding ends.
   * If unitLimit is less than 0, codec will decode all much data as possible. If there are no enough data to decode a unit,
   * decoding will stop without placing DecodeResult with error class into resulting array.
   * @param inputOffset Offset from beginning of the buffer to start decoding from.
   *
   * Regardless of value of \p unitLimit decoding will try to recover and continue on error (unless unitLimit is reached or
   * no more data left).
   * If error makes it impossible to recovery and continue decoding, but there are more data left for decoding
   * (unitLimit is not reached or unitLimit is less or equal 0), special DecodeResult with decodeError field set to instance of
   * Errors.DecodeFlowStop.
   */
  decodeFromBuffer(input:Buffer, inputOffset:number = 0, unitLimit:number = 0):IDecodeResult[] {
    if (input == null || inputOffset >= input.length) {
      throw new Errors.InvalidArguments();
    }

    let result:IDecodeResult[] = [];

    // find range of buffer that we can read from
    let buf_range:Range = new Range(inputOffset, new QRange(input.length).itemsFrom(inputOffset));
    if (!buf_range.valid) {
      throw new Errors.InvalidArguments();
    }
    if (buf_range.size === 0) { // if there are no single byte available...
      if (unitLimit > 0) { // if we need to read specific number of units, we fail.
        result.push({
          result: null,
          offset: inputOffset,
          binaryLength: 0,
          decodeError: new Errors.NoEnoughData()
        } as DecodeResult<void>);
      }
      // if we should decode every byte or all much units as possible, we are done! no need to place anything.
      return result;
    }

    // create decoding context and initialize it with buffer and start position
    let context:DecodeContext = new DecodeContext();
    context.buffer = input;
    context.bufferOffset = inputOffset;

    let already_decoded_unit_count:number = 0;
    while (unitLimit <= 0 || already_decoded_unit_count < unitLimit) {
      if (!this._processUnit(context, unitLimit, result)) {
        break;
      }
      ++already_decoded_unit_count;
      context.prevBufferOffset = context.bufferOffset;
    }

    return result;
  }

  /**
   * Acts as decodeFromBuffer, but gets data from stream instead.
   * @param stream Stream to read from.
   * @param unitLimit See decodeFromBuffer method documentation for details about this parameter.
   */
  abstract decode(stream:DataReadStream, unitLimit:number):Promise<IDecodeResult[]>;

  abstract _do_decodeUnit(context:DecodeContext):IDecodeResult;
}

/**
 * Base class for codecs with fixed value unit width.
 */
abstract class FixedUnitCodec extends AbstractCodec {
  constructor(unitSize:number) {
    super({
      isFixedSize: true,
      unitSize: unitSize
    });
  }

  decode(stream:DataReadStream, unitLimit:number = 0):Promise<IDecodeResult[]> {
    if (stream == null) {
      throw new Errors.InvalidArguments();
    }
    
    return new Promise<IDecodeResult[]>((resolve:PromiseResolve<IDecodeResult[]>, reject:PromiseReject) => {
      let out_buf = new BufferAggregator();
      let wait_size = unitLimit * this.unitSize;
      let already_resolved:boolean = false;

      stream.on('data', (d:Buffer) => {
        out_buf.add(d);

        if (unitLimit > 0 && out_buf.buf != null && out_buf.buf.length >= wait_size) {
          // enough data, decode it now!
          stream.pause();
          try {
            resolve(this.decodeFromBuffer(out_buf.buf, 0, unitLimit));
            already_resolved = true;
          } catch (err) {
            reject(err);
          }
        }
      }).on('end', () => {
        if (!already_resolved) {
          try {
            resolve(this.decodeFromBuffer(out_buf.buf, 0, unitLimit));
          } catch (err) {
            reject(err);
          }
        }
      }).on('error', reject);
    });
  }
}

/**
 * Different integer formats for use with IntegerCodec class
 */
export enum IntegerFormat {
  Format8Bit = 8,
  Format16Bit = 16,
  Format32Bit = 32,
  Format64Bit = 64
}

export enum Endianness {
  LittleEndian,
  BigEndian
}

type StandardNumberDecodeFunction = (offset:number, noAssert:boolean)=>number;

/**
 * Base class for IntegerCodec and FloatCodec, that operates on binary using standard JS functions.
 */
class StandardNumberCodec extends FixedUnitCodec {
  protected _decodeFunc:StandardNumberDecodeFunction = null;

  constructor(_unit_size:number, protected _endianness:Endianness) {
    super(_unit_size);
  }

  get endianness():Endianness { return this._endianness; }

  _do_decodeUnit(context:DecodeContext):DecodeResult<number> {
    let result = {
      result: this._decodeFunc.call(context.buffer, context.bufferOffset, false),
      offset: context.bufferOffset,
      binaryLength: this.unitSize,
      decodeError: null
    };
    context.bufferOffset += this.unitSize;
    return result;
  }
}

/**
 * Class to work with integer representations.
 */
export class IntegerCodec extends StandardNumberCodec {
  constructor(protected _format:IntegerFormat, protected _signed:boolean = true, _endianness:Endianness = Endianness.LittleEndian) {
    super(IntegerCodec._getUnitSize(_format), _endianness);

    let suffix:string = _format === IntegerFormat.Format8Bit ? '' : (_endianness === Endianness.LittleEndian ? 'LE' : 'BE');
    let decode_func_name:string = `read${_signed?'':'U'}Int${_format}${suffix}`;

    this._decodeFunc = (Buffer.alloc(0))[decode_func_name];
  }

  get format():IntegerFormat { return this._format; }

  get signed():boolean { return this._signed; }

  get name():string {
    return 'int_' + (this._signed ? '' : 'u') + this._format + (this._endianness === Endianness.LittleEndian ? 'le' : 'be');
  }

  protected static _getUnitSize(format:IntegerFormat) {
    return format / 8;
  }
}

/**
 * Different floating-point number formats to use with FloatCodec class.
 */
export enum FloatFormat {
  Format32Bit = 32,
  Format64Bit = 64
}

/**
 * Class to work with floating-point number representations.
 */
export class FloatCodec extends StandardNumberCodec {
  constructor(public _format:FloatFormat, public _endianness:Endianness = Endianness.LittleEndian) {
    super(FloatCodec._getUnitSize(_format), _endianness);

    let type:string = _format === FloatFormat.Format32Bit ? 'Float' : 'Double';
    let suffix:string = _endianness === Endianness.LittleEndian ? 'LE' : 'BE';
    let decode_func_name:string = `read${type}${suffix}`;

    this._decodeFunc = (Buffer.alloc(0))[decode_func_name];
  }

  get format():FloatFormat { return this._format; }

  get name():string {
    return 'float_' + this._format + (this._endianness === Endianness.LittleEndian ? 'le' : 'be');
  }

  protected static _getUnitSize(format:FloatFormat) {
    return format / 8;
  }
}

function* _gen_ascii_low() {
  for (let j = 0; j < 128; ++j) {
    yield String.fromCharCode(j);
  }
}

let ascii_low = Array.from(_gen_ascii_low()).join('');

export interface ICharCodec {
  /**
   * Mib enumeration value as specified in IANA character-sets encoding file
   * (http://www.iana.org/assignments/character-sets). You can use this value to check if two codecs
   * are represent the same encoding. For encodings that are not specified in IANA list, mibEnum should
   * be unique and persistent.
   */
  mibEnum:number;
}

/**
 * Class for working with encodings with fixed number of bytes per character.
 */
export class FixedUnitCharCodec extends FixedUnitCodec implements ICharCodec {
  protected _decodeTable:string;

  constructor(protected _name:string, _decodeTable:string, unitSize:number, protected _mibEnum:number) {
    super(unitSize);

    if (unitSize <= 0) {
      throw new Errors.InvalidArguments();
    }

    // we should ensure that length of decode buffer is either 128 or 256 bits (for single-byte encodings)
    if (unitSize === 1 && _decodeTable.length !== 128 && _decodeTable.length !== 256) {
      throw new Errors.InvalidArguments();
    }

    if (unitSize === 1 && _decodeTable.length === 128) {
      this._decodeTable = ascii_low + _decodeTable;
    } else {
      this._decodeTable = _decodeTable;
    }
  }

  _do_decodeUnit(context:DecodeContext):DecodeResult<string> {
    let result:DecodeResult<string>;

    if (this.unitSize === 1) {
      result = {
        result: this._decodeTable.charAt(context.buffer.readUInt8(context.bufferOffset)),
        offset: context.bufferOffset,
        binaryLength: this.unitSize,
        decodeError: null
      } as DecodeResult<string>;
    } else {
      throw new Errors.NotImplemented();
    }

    context.bufferOffset += this.unitSize;
    return result;
  }
  
  get name():string { return this._name; }

  get mibEnum():number { return this._mibEnum; }
}

import * as encodings from './encodings';

class EncodingMap {
  [name:string]: encodings.EncodingData;
}

/**
 * Allows access to installed encodings.
 */
export class EncodingManager {
  protected _enc_map:EncodingMap = new EncodingMap();
  protected static _instance:EncodingManager = null;

  constructor() {
    for (let enc_data of encodings.encodingsData) {
      if (enc_data.aliases != null && enc_data.aliases.length >= 0) {
        for (let alias of enc_data.aliases) {
          this._enc_map[EncodingManager.simpleName(alias)] = enc_data;
        }
      }
      this._enc_map[EncodingManager.simpleName(enc_data.name)] = enc_data;
    }
  }

  /**
   * Returns codec appropriate for decoding characters in specified encoding.
   * @param encName Encoding name or alias to search.
   * @returns {AbstractCodec} Instance of codec
   */
  getCodec(encName:string):AbstractCodec {
    let enc_data:encodings.EncodingData = this.hasCodec(encName) ? this._enc_map[EncodingManager.simpleName(encName)] : null;
    if (enc_data == null) {
      return null;
    }

    if (enc_data instanceof encodings.SinglebyteEncodingData) {
      return new FixedUnitCharCodec(enc_data.name, enc_data.decodeTable, 1, enc_data.mibEnum);
    } else {
      throw new Errors.NotImplemented();
    }
  }

  /**
   * Checks if codec for specified character encoding is installed.
   * @param codecName Encoding name or alias to search
   * @returns {boolean} True if codecs for encoding are installed, False otherwise.
   */
  hasCodec(codecName:string):boolean {
    return this._enc_map.hasOwnProperty(EncodingManager.simpleName(codecName));
  }

  /**
   * @returns {EncodingManager} Singleton instance of EncodingManager
   */
  static get instance():EncodingManager {
    if (EncodingManager._instance == null) {
      EncodingManager._instance = new EncodingManager();
    }
    return EncodingManager._instance;
  }

  /**
   * Simple name that used to compare encoding names. Two encodings with matching simple names
   * are considered the same encoding.
   * @param name Full encoding name
   * @returns {string} Simple encoding name
   */
  static simpleName(name:string):string {
    return name.replace(/[ _-]/g, '').toLowerCase();
  }
}
