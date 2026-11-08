import './style.css';
import { discoverGames } from './games';
import { renderGrid } from './render';

const modules = import.meta.glob('../../../games/*/*/game.json', {
  eager: true,
  import: 'default',
});
const thumbs = import.meta.glob('../../../games/*/*/public/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const root = document.getElementById('grid');
if (root) renderGrid(root, discoverGames(modules, thumbs, import.meta.env.BASE_URL));
