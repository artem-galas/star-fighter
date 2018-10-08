import {
  range as observableRange,
  timer as observableTimer,
  fromEvent as observableFromEvent,
  combineLatest,
  Observable,
  Subject,
} from 'rxjs';
import {
  distinctUntilChanged,
  map,
  mergeMap,
  sampleTime,
  scan,
  startWith,
  takeWhile,
  timestamp,
  toArray
} from 'rxjs/operators';

interface IStar {
  x: number;
  y: number;
  size: number;
}

interface IPoint {
  x: number;
  y: number;
}

class Enemy {
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

class Canvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    document.body.appendChild(this.canvas);

    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerWidth;

    let spaceShip = new Image();
    spaceShip.src = 'images/my_ship.png';

    let missle = new Image();
    missle.src = 'images/my_missle.png';

    let alien = new Image();
    alien.src = 'images/alien.gif';

    let alien_missle = new Image();
    alien_missle.src = 'images/alien_missle.png';
  }
}

/** init canvas*/
let canvas: HTMLCanvasElement = document.createElement('canvas');
let ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
document.body.appendChild(canvas);
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

let spaceShip = new Image();
spaceShip.src = 'images/my_ship.png';

let missle = new Image();
missle.src = 'images/my_missle.png';

let alien = new Image();
alien.src = 'images/alien.gif';

let alien_missle = new Image();
alien_missle.src = 'images/alien_missle.png';


/** init consts*/
const SPEED: number = 40;
const STARS_NUM: number = 250;
const PLAYER_POS: number = canvas.height - 100;
const ENEMY_RESP: number = 1500;
const ENEMY_SHOT_RESP: number = 750;
const SHOTING_SPEED: number = 15;
const SCORE_INC: number = 10;

/** util game functions*/
function isVisible(obj: any) {
  return obj.x > -96 && obj.x < canvas.width + 96 &&
    obj.y > -96 && obj.y < canvas.height + 96
}

function collision(target1: any, target2: any) {
  return (target1.x > target2.x - 14 && target1.x < target2.x + 46) &&
    (target1.y > target2.y - 32 && target1.y < target2.y + 32)
}
function gameOver(ship: any, enemies: any) {
  return enemies.some((enemy:any)=> {
    return enemy.shots.some((shot: any)=> {
      return collision(shot, ship)
    })
  })
}
function paintStars(stars: IStar[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  stars.forEach((star: IStar):void=> {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size / 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  })
}

function drawShip(x: number, y: number) {
  ctx.drawImage(spaceShip, x, y);
}

function drawMyShots(shots: any[], enemies: any[]) {
  ctx.fillStyle = '#B8860B';
  shots.forEach((shot:any, i:number)=> {
    for (let enemy of enemies) {
      if (!i) {
        return;
      }
      if (!enemy.isDead && collision(shot, enemy)) {
        scoreSubject$.next(SCORE_INC);
        enemy.isDead = true;
        enemy.x = enemy.y = -100;
        break;
      }
    }
    shot.y -= SHOTING_SPEED;
    ctx.drawImage(missle, shot.x, shot.y);
    //ctx.drawImage(missle, shot.xR, shot.yR);
  });
}

function drawEnemies(enemies: any) {
  enemies.forEach((enemy:any)=> {
    enemy.y += 5;
    if (!enemy.isDead) {
      ctx.drawImage(alien, enemy.x, enemy.y);
    }
    enemy.shots.forEach((shot:any)=> {
      shot.y += SHOTING_SPEED;
      ctx.drawImage(alien_missle, shot.x, shot.y);
    })
  })
}

function drawScores(score: number) {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`Score: ${score}`, 40, 43)
}

let stars$ = observableRange(1, STARS_NUM)
  .pipe(
    map((): IStar => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1
    })),
    toArray(),
    mergeMap((stars) => {
      return observableTimer(0, SPEED)
        .pipe(
          map(() => {
            stars.forEach((star: IStar) => {
              star.y > canvas.height ? star.y = 0 : star.y += 3;
            });

            return stars;
          })
        )
    })
  );

let mouseMove$ = observableFromEvent(canvas, 'mousemove') as Observable<MouseEvent>;
let mySpaceShip$ = mouseMove$
  .pipe(
    map((e: MouseEvent): IPoint => ({
      x: e.pageX - 32,
      y: PLAYER_POS
    })),
    startWith({
      x: canvas.width / 2,
      y: PLAYER_POS,
    })
  );

let myFire$ = observableFromEvent(canvas, 'click')
  .pipe(
    sampleTime(200),
    timestamp()
  );

let myShots$ = combineLatest(mySpaceShip$, myFire$,
  (mySpaceShip: any, myFire: any) => ({
    timestamp: myFire.timestamp,
    x: mySpaceShip.x
  }))
  .pipe(
    distinctUntilChanged((shot) => shot.timestamp),
    scan((shots: any, shot: any) => {
      shots.push({x: shot.x + 16, y: PLAYER_POS});

      return shots;
    }, [])
  );

let enemies$ = observableTimer(0, ENEMY_RESP)
  .pipe(
    scan((enemies: any) => {
      let enemy = new Enemy(
         Math.random() * canvas.width,
         -30
      );

      observableTimer(0, ENEMY_SHOT_RESP)
        .subscribe(() => {
          if(!enemy.isDead) enemy.shots.push({x: enemy.x + 16, y: enemy.y});

          enemy.shots.filter(isVisible);
        });

      enemies.push(enemy);

      return enemies.filter((enemy: Enemy) => {
        return !(enemy.isDead && !enemy.shots.length && !isVisible(enemy));
      })
    }, [])
  );

let scoreSubject$ = new Subject<number>();

let score$ = scoreSubject$
  .pipe(
    scan((prev: number, cur: number) => {
      return prev + cur;
    }, 0),
  );

let currentScore = 0;

score$.subscribe((score: number) => currentScore = score);


let Game$ = combineLatest(
  stars$, mySpaceShip$, myShots$, enemies$,
  (stars: IStar[], mySpaceShip: any, myShots: any, enemies: any) => ({
    stars,
    mySpaceShip,
    myShots,
    enemies,
  }))
  .pipe(
    sampleTime(40),
    takeWhile((items) => {
      return !gameOver(items.mySpaceShip, items.enemies)
    })
  );

Game$.subscribe((items) => {
  let {stars, mySpaceShip, myShots, enemies} = items;

  paintStars(stars);
  drawShip(mySpaceShip.x, mySpaceShip.y);
  drawMyShots(myShots, enemies);
  drawEnemies(enemies);
  drawScores(currentScore)
});
