import { Readable } from 'stream';
import { ErrorClass } from '../utils/error';
import { Range, QRange } from '../utils/range';
import { DataReadStream, AbstractReadable } from './stream';
import { AbstractDataSource } from './source';

/**
 * Span is minimal piece of constant binary data microhex operates on. Depending on implementation,
 * there are different ways for span to hold data, but every span should report its length and
 * provide mechanism to read any sequence of bytes inside itself and support splitting.
 */
export class AbstractSpan extends AbstractReadable {
  constructor() {
    super();
  }

  /**
   * Splitting is constant operation that results in creating two new spans, where first
   * span references [0; position] bytes of original span data and second one references
   * (position, last] bytes of original span data.
   */
  split(position:number):AbstractSpan[] {
    if (!new QRange(this.length).isPositionInside(position)) {
      throw new ErrorClass.AccessRange()
    } else {
      return this._do_split(position);
    }
  }

  /**
   * Implement custom span splitting logic here. Assume that \p offset is valid.
   */
  protected _do_split(offset:number):AbstractSpan[] {
    throw new ErrorClass.NotImplemented();
  }
}

/**
 * This span implementation manages AbstractDataSource region as its source of data.
 */
export class SourceSpan extends AbstractSpan {
  constructor(public source:AbstractDataSource, public source_offset?:number,
              public source_length?:number) {
    super();

    if (source == null) {
      throw new ErrorClass.InvalidArguments();
    }

    if (source_offset == null) {
      source_offset = 0;
    }

    let source_range = new QRange(source.length),
        span_range = new Range(source_offset, source_length);

    if (!span_range.valid) {
      throw new ErrorClass.InvalidArguments();
    }

    if (source_length == null) {
      source_length = source_range.itemsFrom(source_offset);
    }

    if (!source_range.containsRange(span_range)) {
      throw new ErrorClass.AccessRange();
    }
  }

  get length():number { return this.source_length; }

  _do_readToStream(stream:DataReadStream, cur_offset:number, read_size:number):void {
    let out_buf;

    this.source.read(cur_offset + this.source_offset, read_size).on('data', (d:Buffer) => {
      if (out_buf === undefined) {
        out_buf = d;
      } else {
        out_buf = Buffer.concat([out_buf, d]);
      }
    }).on('end', () => {
      if (out_buf === undefined) {
        stream._do_end();
      } else {
        if (stream._do_push(out_buf)) {
          stream._do_end();
        }
      }
    }).on('error', (err:Error) => {
      stream._do_error(new ErrorClass.IO(null, err));
    });
  }

  _do_split(offset:number):SourceSpan[] {
    let span_range = new QRange(this.length);

    if (offset == 0) {
      return [null, new SourceSpan(this.source, this.source_offset, this.source_length)];
    } else {
      return [new SourceSpan(this.source, this.source_offset, offset),
              new SourceSpan(this.source, this.source_offset + offset, span_range.itemsFrom(offset))];
    }
  }
}
