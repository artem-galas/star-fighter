import {Subject} from 'rxjs';

import {Canvas} from './canvas';
import {SCORE_INC, SHOTING_SPEED} from './const';
import {Enemy, IPoint, IStar} from './models';

export class Util {
  scoreSubject$: Subject<number>;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private canvas: Canvas) {
    this.ctx = this.canvas.ctx;
    this.scoreSubject$ = new Subject<number>();
  }

  isVisible(obj: any): boolean {
    return obj.x > -96 && obj.x < this.canvas.width + 96 &&
      obj.y > -96 && obj.y < this.canvas.height + 96;
  }

  collision(target1: IPoint, target2: IPoint): boolean {
    return (target1.x > target2.x - 14 && target1.x < target2.x + 46) &&
      (target1.y > target2.y - 32 && target1.y < target2.y + 32);
  }

  gameOver(ship: any, enemies: Enemy[]): boolean {
    return enemies.some((enemy: Enemy) => {
      return enemy.shots.some((shot: any) => {
        return this.collision(shot, ship);
      });
    });
  }

  paintStars(stars: IStar[]): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#ffffff';
    stars.forEach((star: IStar): void => {
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size / 2, 0, 2 * Math.PI);
      this.ctx.closePath();
      this.ctx.fill();
    });
  }

  drawShip(x: number, y: number): void {
    this.ctx.drawImage(this.canvas.spaceShip, x, y);
  }

  drawMyShots(shots: any[], enemies: Enemy[]): void {
    this.ctx.fillStyle = '#B8860B';
    shots.forEach((shot: any, i: number) => {
      for (const enemy of enemies) {
        if (!i) {
          return;
        }
        if (!enemy.isDead && this.collision(shot, enemy)) {
          this.scoreSubject$.next(SCORE_INC);
          enemy.isDead = true;
          enemy.x = enemy.y = -100;
          break;
        }
      }
      shot.y -= SHOTING_SPEED;
      this.ctx.drawImage(this.canvas.missle, shot.x, shot.y);
    });
  }

  drawEnemies(enemies: Enemy[]): void {
    enemies.forEach((enemy: Enemy) => {
      enemy.y += 5;
      if (!enemy.isDead) {
        this.ctx.drawImage(this.canvas.alien, enemy.x, enemy.y);
      }
      enemy.shots.forEach((shot: any) => {
        shot.y += SHOTING_SPEED;
        this.ctx.drawImage(this.canvas.alienMissle, shot.x, shot.y);
      });
    });
  }

  drawScores(score: number): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 26px sans-serif';
    this.ctx.fillText(`Score: ${score}`, 40, 43);
  }
}
