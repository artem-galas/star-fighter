export class Canvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  spaceShip: HTMLImageElement;
  missle: HTMLImageElement;
  alien: HTMLImageElement;
  alienMissle: HTMLImageElement;

  get height() {
    return this.canvas.height;
  }

  get width() {
    return this.canvas.width;
  }

  get element() {
    return this.canvas;
  }

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    document.body.appendChild(this.canvas);

    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerWidth;

    this.spaceShip = new Image();
    this.spaceShip.src = 'images/my_ship.png';

    this.missle = new Image();
    this.missle.src = 'images/my_missle.png';

    this.alien = new Image();
    this.alien.src = 'images/alien.gif';

    this.alienMissle = new Image();
    this.alienMissle.src = 'images/alien_missle.png';
  }
}
