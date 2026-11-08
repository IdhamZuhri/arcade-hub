export const GAME_ID = 'axhad-fighter';
export const TITLE = 'Pixel Brawl';
export const WIDTH = 320;
export const HEIGHT = 180;
export const SCENES = {
  Preload: 'Preload',
  Menu: 'Menu',
  Play: 'Play',
  GameOver: 'GameOver',
} as const;

export const MAX_HP = 100;
export const PUNCH_DAMAGE = 10;
export const CHIP_RATIO = 0.2;
export const ROUND_TIME = 60;
export const WINS_NEEDED = 2;
export const PUNCH_RANGE = 28;
export const BODY = { w: 24, h: 40 } as const;
export const GROUND_Y = 150;
export const WALK_SPEED = 70;
