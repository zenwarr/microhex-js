import { AbstractSpan } from './spans';
import * as Errors from '../utils/errors';
import { isNullOrUndefined } from '../utils/utils';
import { Range, QRange } from '../utils/range';
import { AbstractReadable } from '../data/stream';

export class ChainPositionData {
  public span_index:number;
  public span_position_offset:number;
}

/**
 * Chain represents editable sequence of immutable spans. It allows to manipulate data using
 * span operation: inserting spans, removing it, etc.
 */
export class Chain extends AbstractReadable {
  protected _length:number = 0;

  constructor(protected _chain:AbstractSpan[] = []) {
    super();
    this._length = Chain._calcLength(this._chain);
  }

  get spanCount():number { return this._chain.length; }

  /**
   * @returns Copy of span array this chain manages
   */
  get spans():AbstractSpan[] { return this._chain.slice(0); }

  /**
   * Appends span at the end of chain.
   */
  pushSpan(span:AbstractSpan):void {
    if (isNullOrUndefined(span)) {
      throw new Errors.InvalidArguments();
    }

    this.insertSpan(span, this.length);
  }

  /**
   * Appends all spans in given chain to this chain.
   */
  pushChain(chain:Chain):void {
    this.insertChain(chain, this.length);
  }

  /**
   * Inserts single span into chain
   *
   * @param span Span to insert
   * @param position Position to insert span
   */
  insertSpan(span:AbstractSpan, position:number):void {
    if (isNullOrUndefined(span)) {
      throw new Errors.InvalidArguments();
    }

    this.insertChain(new Chain([span]), position);
  }

  /**
    * Inserts all spans from given chain into this chain
    *
    * @param chain Chain which spans will be inserted
    * @param position Position to insert spans
    */
  insertChain(chain:Chain, position:number):void {
    if (isNullOrUndefined(chain) || chain === this) {
      throw new Errors.InvalidArguments();
    }

    let me_range:Range = new QRange(this.length);

    if (this.length + chain.length > Number.MAX_SAFE_INTEGER) {
      throw new Errors.InvalidArguments();
    }

    if (!me_range.isPositionInside(position)) {
      if (!(this.length === 0 && position === 0) && !(position === this.length)) {
        throw new Errors.AccessRange();
      }
    }

    if (position === this.length) { // equivalent of pushing span
      for (let span of chain._chain) {
        this._chain.push(span);
      }
    } else {
      let pd:ChainPositionData = this.splitAtPosition(position);
      this._chain.splice(pd.span_index, 0, ...chain._chain);
    }
    this._length += chain.length;
  }

  /**
   * Removes specified data.
   *
   * @param start Position to start removing from.
   * @param size Number of octets to remove.
   */
  removeRange(start:number, size:number):void {
    if (!new Range(start, size).valid) {
      throw new Errors.InvalidArguments();
    }

    if (!new QRange(this.length).containsRange(new Range(start, size))) {
      throw new Errors.AccessRange();
    }

    if (size === 0) {
      return;
    }

    let pd_start:ChainPositionData = this.splitAtPosition(start);

    if (start + size === this.length) {
      // if we should remove last span too, there is no index of next span after remove area
      this._chain.splice(pd_start.span_index, this._chain.length - pd_start.span_index);
    } else {
      let pd_finish:ChainPositionData = this.splitAtPosition(start + size);
      this._chain.splice(pd_start.span_index, pd_finish.span_index - pd_start.span_index);
    }

    this._length -= size;
  }

  /**
   * Creates new Chain from given region of this chain.
   *
   * @param start Position of required data range
   * @param size Number of octets in new chain
   */
  takeChain(start:number, size:number):Chain {
    if (!new Range(start, size).valid) {
      throw new Errors.InvalidArguments();
    }

    if (!new QRange(this.length).containsRange(new Range(start, size))) {
      throw new Errors.AccessRange();
    }

    if (size === 0) {
      return new Chain();
    }

    let pd_start:ChainPositionData = this.splitAtPosition(start);

    let span_count;
    if (start + size === this.length) {
      span_count = this._chain.length - pd_start.span_index;
    } else {
      let pd_finish:ChainPositionData = this.splitAtPosition(start + size);
      span_count = pd_finish.span_index - pd_start.span_index;
    }

    return new Chain(this._chain.slice(pd_start.span_index, pd_start.span_index + span_count));
  }

  /**
   * Finds index of span and offset from start of this span for given position.
   *
   * @param position The position of byte to find span
   * @returns object which contains span index of spans array and offset of \p position from
   * start of this span.
   */
  positionData(position:number):ChainPositionData {
    let me_range:Range = new QRange(this.length);

    if (!me_range.isPositionInside(position)) {
      throw new Errors.AccessRange();
    }

    let cur_pos = 0;
    for (let j = 0; j < this._chain.length; ++j) {
      if (new Range(cur_pos, this._chain[j].length).isPositionInside(position)) {
        return {
          span_index: j,
          span_position_offset: position - cur_pos
        };
      }
      cur_pos += this._chain[j].length;
    }

    throw new Errors.ObjectInconsistency();
  }

  /**
   * Splits spans at given position, if necessary. Does nothing If octet at \p position is the
   * first octet of a span. Otherwise splits spans in such a way that octet at \p position becomes
   * the first octet of new span. Returns ChainPositionData object for span at \p position after
   * splitting.
   */
  splitAtPosition(position:number):ChainPositionData {
    let pd:ChainPositionData = this.positionData(position);

    if (pd.span_position_offset !== 0) {
      let splitted:AbstractSpan[] = this._chain[pd.span_index].split(pd.span_position_offset);
      this._chain.splice(pd.span_index, 1, ...splitted);

      return {
        span_index: pd.span_index + 1,
        span_position_offset: 0
      };
    } else {
      return pd;
    }
  }

  /**
   * Resets chain.
   */
  reset():void {
    this._chain = [];
    this._length = 0;
  }

  get length():number { return this._length; }

  _do_readToStream(cur_offset:number, read_size:number):Promise<Buffer> {
    return new Promise<Buffer>((resolve:PromiseResolve<Buffer>, reject:PromiseReject) => {
      let pd_start:ChainPositionData = this.positionData(cur_offset);
      let cur_span_index:number = pd_start.span_index, remains:number = read_size;
      let out_buf:Buffer;
      let self = this;

      function add_buf(b:Buffer) {
        out_buf = out_buf === undefined ? b : Buffer.concat([out_buf, b]);
        remains -= b.length;
      }

      function process() {
        function process_next() {
          if (remains > 0) {
            ++cur_span_index;
            process();
          } else {
            resolve(out_buf);
          }
        }

        let cur_span = self._chain[cur_span_index], span_read_pos:number = 0, span_avail_size:number = cur_span.length;

        if (cur_span_index === pd_start.span_index) {
          // first iteration, take span data offset into account
          span_read_pos = pd_start.span_position_offset;
          span_avail_size = new QRange(cur_span.length).itemsFrom(span_read_pos);
        }

        let span_read_size:number = Math.min(remains, span_avail_size);

        cur_span.read(span_read_pos, span_read_size).on('data', (d:Buffer) => {
          add_buf(d);
        }).on('end', () => {
          try {
            process_next();
          } catch(err) {
            reject(err);
          }
        }).on('error', reject);
      }

      process();
    });
  }

  protected static _calcLength(spans:AbstractSpan[]) {
    return spans.reduce((prev:number, cur:AbstractSpan):number => { return prev + cur.length; }, 0);
  }
}
