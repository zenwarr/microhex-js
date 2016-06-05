/**
 * This class is intended for managing numerical ranges. It keeps start position and size of
 * range.
 */
export class Range {
  public start:number;
  public size:number;

  constructor(start:number, size:number) {
    this.start = start || 0;
    this.size = size || 0;
  }

  /**
   * Returns absolute position of last item that matches the range
   */
  get last():number {
    return this.size === 0 ? this.start : this.start + this.size - 1;
  }

  /**
   * Checks if item with position is inside the range
   */
  isPositionInside(pos):boolean {
    return this.size === 0 ? false : pos >= this.start && pos <= this.last;
  }

  private getInsideSize_p(another:Range):number {
    if (this.size === 0 || !this.isPositionInside(another.start)) {
      return 0;
    }

    return Math.min(this.last, another.last) - another.start + 1;
  }

  /*
   * Finds number of items that match two ranges. Note that start of range given as argument
   * must be larger or equal to start of this range. Otherwise zero will be returned as result.
   */
  getInsideSize(start_or_range:any, size?:number):number {
    if (typeof start_or_range === 'number') {
      return this.getInsideSize_p(new Range(start_or_range, size));
    } else {
      return this.getInsideSize_p(start_or_range);
    }
  }

  private containsRange_p(another:Range):boolean {
    return this.isPositionInside(another.start) && this.isPositionInside(another.last);
  }

  /**
   * Checks if range given as argument is fully lays inside this range. It means that all items of
   * range given as argument are inside this range.
   */
  containsRange(start_or_range:any, size?:number):boolean {
    if (typeof start_or_range === 'number') {
      return this.containsRange_p(new Range(start_or_range, size));
    } else {
      return this.containsRange_p(start_or_range);
    }
  }

  /**
   * Finds number of items from given position until end of range. Item with given position is
   * taken into account too. If position is outside this range, 0 will be returned.
   */
  itemsFrom(position:number):number {
    return this.isPositionInside(position) ? this.last - position + 1 : 0;
  }

  /**
   * Checks if range is valid. Range is considered invalid if its start position or size is negative,
   * or lays outside of JS safe integers range. Note that methods of Range assume that this range
   * is valid and do not check validity flag. Because of it results of Range methods can be incorrect
   * when used with invalid Range.
   */
  get valid():boolean {
    return this.start <= Number.MAX_SAFE_INTEGER && Number.MAX_SAFE_INTEGER - this.start >= this.size &&
           this.start >= 0 && this.size >= 0;
  }
}

/**
 * Helper class that represents Range starting from 0
 */
export class QRange extends Range {
  constructor(size:number) {
    super(0, size);
  }
}
