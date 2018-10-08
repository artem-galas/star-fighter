import {
  combineLatest,
  fromEvent as observableFromEvent,
  Observable,
  range as observableRange,
  timer as observableTimer
} from 'rxjs';
import {
  distinctUntilKeyChanged,
  map,
  mergeMap,
  sampleTime,
  scan,
  startWith,
  takeWhile,
  timestamp,
  toArray
} from 'rxjs/operators';

import { Canvas } from './canvas';
import { ENEMY_RESP, ENEMY_SHOT_RESP, SPEED, STARS_NUM } from './const';
import { Enemy, IPoint, IStar } from './models';
import { Util } from './util';

// init canvas and util
const canvas = new Canvas();
const util = new Util(canvas);

// set player position
export const PLAYER_POS: number = canvas.height - 100;

const stars$ = observableRange(1, STARS_NUM)
  .pipe(
    map((): IStar => ({
      size: Math.random() * 3 + 1,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height
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
        );
    })
  );

const mouseMove$ = observableFromEvent(canvas.element, 'mousemove') as Observable<MouseEvent>;
const mySpaceShip$ = mouseMove$
  .pipe(
    map((e: MouseEvent): IPoint => ({
      x: e.pageX - 32,
      y: PLAYER_POS
    })),
    startWith({
      x: canvas.width / 2,
      y: PLAYER_POS
    })
  );

const myFire$ = observableFromEvent(canvas.element, 'click')
  .pipe(
    sampleTime(200),
    timestamp()
  );

const myShots$ = combineLatest(mySpaceShip$, myFire$,
  (mySpaceShip: any, myFire: any) => ({
    timestamp: myFire.timestamp,
    x: mySpaceShip.x
  }))
  .pipe(
    distinctUntilKeyChanged('timestamp'),
    scan((shots: any, shot: any) => {
      shots.push({x: shot.x + 16, y: PLAYER_POS});

      return shots;
    }, [])
  );

const enemies$ = observableTimer(0, ENEMY_RESP)
  .pipe(
    scan((enemies: any) => {
      const enemy = new Enemy(
         Math.random() * canvas.width,
         -30
      );

      observableTimer(0, ENEMY_SHOT_RESP)
        .subscribe(() => {
          if (!enemy.isDead) enemy.shots.push({x: enemy.x + 16, y: enemy.y});

          enemy.shots.filter((item: any) => util.isVisible(item));
        });

      enemies.push(enemy);

      return enemies.filter((_enemy: Enemy) => {
        return !(_enemy.isDead && !_enemy.shots.length && !util.isVisible(_enemy));
      });
    }, [])
  );

const score$ = util.scoreSubject$
  .pipe(
    scan((prev: number, cur: number) => {
      return prev + cur;
    }, 0)
  );

let currentScore = 0;

score$.subscribe((score: number) => currentScore = score);

const game$ = combineLatest(
  stars$, mySpaceShip$, myShots$, enemies$,
  (stars: IStar[], mySpaceShip: any, myShots: any, enemies: any) => ({
    enemies,
    myShots,
    mySpaceShip,
    stars
  }))
  .pipe(
    sampleTime(40),
    takeWhile((items) => {
      return !util.gameOver(items.mySpaceShip, items.enemies);
    })
  );

game$.subscribe((items) => {
  const {stars, mySpaceShip, myShots, enemies} = items;

  util.paintStars(stars);
  util.drawShip(mySpaceShip.x, mySpaceShip.y);
  util.drawMyShots(myShots, enemies);
  util.drawEnemies(enemies);
  util.drawScores(currentScore);
});
