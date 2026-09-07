import './style.css';
import { Game } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const game = new Game(canvas);
game.init();
game.start();
