import * as Errors from '../utils/errors';
import { isNullOrUndefined } from '../utils/utils';
import { Range, QRange } from '../utils/range';
import { AbstractReadable } from './stream';
import { AbstractDataSource, FillDataSource, BufferDataSource } from './source';

/**
 * Span is minimal piece of constant binary data microhex operates on. Depending on implementation,
 * there are different ways for span to hold data, but every span should report its length and
 * provide mechanism to read any sequence of bytes inside itself and support splitting.
 */
export abstract class AbstractSpan extends AbstractReadable {
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
      throw new Errors.AccessRange();
    } else {
      return this._do_split(position);
    }
  }

  /**
   * Implement custom span splitting logic here. Assume \p offset is valid.
   */
  protected abstract _do_split(offset:number):AbstractSpan[];
}

/**
 * This span implementation manages AbstractDataSource region as its source of data.
 */
export class SourceSpan extends AbstractSpan {
  constructor(public source:AbstractDataSource, public source_offset?:number,
              public source_length?:number) {
    super();

    if (isNullOrUndefined(source)) {
      throw new Errors.InvalidArguments();
    }

    if (isNullOrUndefined(source_offset)) {
      this.source_offset = 0;
    }

    let source_range = new QRange(source.length),
        span_range = new Range(this.source_offset, this.source_length);

    if (!span_range.valid) {
      throw new Errors.InvalidArguments();
    }

    if (isNullOrUndefined(source_length)) {
      this.source_length = source_range.itemsFrom(this.source_offset);
    }

    if (!source_range.containsRange(span_range)) {
      throw new Errors.AccessRange();
    }
  }

  get length():number { return this.source_length; }

  _do_readToStream(cur_offset:number, read_size:number):Promise<Buffer> {
    return new Promise<Buffer>((resolve:(b:Buffer)=>void, reject:(err:Error)=>void) => {
      let out_buf;

      this.source.read(cur_offset + this.source_offset, read_size).on('data', (d:Buffer) => {
        if (out_buf === undefined) {
          out_buf = d;
        } else {
          out_buf = Buffer.concat([out_buf, d]);
        }
      }).on('end', () => resolve(out_buf)).on('error', reject);
    });
  }

  _do_split(offset:number):SourceSpan[] {
    let span_range = new QRange(this.length);

    if (offset === 0) {
      return [null, new SourceSpan(this.source, this.source_offset, this.source_length)];
    } else {
      return [new SourceSpan(this.source, this.source_offset, offset),
              new SourceSpan(this.source, this.source_offset + offset, span_range.itemsFrom(offset))];
    }
  }
}

export class FillSpan extends SourceSpan {
  constructor(fill_size:number, fill_byte?:number) {
    super(new FillDataSource(fill_size, fill_byte));
  }
}

export class BufferSpan extends SourceSpan {
  constructor(buf:Buffer) {
    super(new BufferDataSource(buf));
  }
}
