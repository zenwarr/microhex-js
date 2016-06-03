import { DataReadStream, AbstractReadable } from './stream';
import { AbstractDataSource } from './source';
import { AbstractSpan, SourceSpan } from './spans';
import { Chain } from './chain';

export class Document extends AbstractReadable {
  protected _chain:Chain;

  constructor(protected _source:AbstractDataSource = null) {
    super();

    if (this._source != null) {
      let source_span:SourceSpan = new SourceSpan(this._source);
      this._chain = new Chain([source_span]);
    } else {
      this._chain = new Chain();
    }
  }

  get length():number { return this._chain.length; }

  get source():AbstractDataSource { return this._source; }

  _do_readToStream(stream:DataReadStream, cur_offset:number, read_size:number):void {
    this._chain._do_readToStream(stream, cur_offset, read_size);
  }

  insertSpan(span:AbstractSpan, position:number):void {
    this._chain.insertSpan(span, position);
  }

  insertChain(chain:Chain, position:number):void {
    this._chain.insertChain(chain, position);
  }

  pushSpan(span:AbstractSpan):void {
    this._chain.pushSpan(span);
  }

  pushChain(chain:Chain):void {
    this._chain.pushChain(chain);
  }

  remove(start:number, size:number):void {
    this._chain.removeRange(start, size);
  }

  clear():void {
    this._chain.reset();
  }
}
