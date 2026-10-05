export class InputQueue {
  laneDelta = 0;
  jump = false;
  slide = false;

  moveLeft(): void {
    this.laneDelta -= 1;
  }

  moveRight(): void {
    this.laneDelta += 1;
  }

  doJump(): void {
    this.jump = true;
  }

  doSlide(): void {
    this.slide = true;
  }

  consume(): { laneDelta: number; jump: boolean; slide: boolean } {
    const action = {
      laneDelta: this.laneDelta,
      jump: this.jump,
      slide: this.slide,
    };
    this.laneDelta = 0;
    this.jump = false;
    this.slide = false;
    return action;
  }

  clear(): void {
    this.laneDelta = 0;
    this.jump = false;
    this.slide = false;
  }
}
