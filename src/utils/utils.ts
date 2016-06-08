export function isNullOrUndefined(value:any):boolean {
  return value == null;
}

export class BufferAggregator {
  public buf:Buffer;

  add(b:Buffer):void {
    this.buf = this.buf === undefined ? b : Buffer.concat([this.buf, b]);
  }
}
