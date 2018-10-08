export interface IStar {
  x: number;
  y: number;
  size: number;
}

export interface IPoint {
  x: number;
  y: number;
}

export class Enemy {
  x: number;
  y: number;
  shots: any[] = [];
  isDead: boolean = false;

  constructor(x: number, y: number, shots: any[] = [], isDead: boolean = false) {
    this.x = x;
    this.y = y;
    this.shots = shots;
    this.isDead = isDead;
  }
}
