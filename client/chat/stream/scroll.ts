export class ScrollFollow {
  following = true;
  private paused = false;
  private movedAway = false;

  pause(): boolean {
    this.paused = true;
    this.movedAway = false;
    return this.following = false;
  }

  resume(): boolean {
    this.paused = false;
    this.movedAway = false;
    return this.following = true;
  }

  observe(distance: number, threshold: number): boolean {
    if (this.paused) {
      if (distance > 1) this.movedAway = true;
      else if (this.movedAway) return this.resume();
      return false;
    }
    return this.following = distance <= threshold;
  }
}
