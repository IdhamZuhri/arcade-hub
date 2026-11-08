import './style.css';
import { discoverValidGames } from './games';
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
// The build already rejects a bad game.json (see vite.config.ts); at runtime, a bad entry
// is logged and skipped so the other games still render.
const games = discoverValidGames(modules, thumbs, import.meta.env.BASE_URL, (err) =>
  console.error(err),
);
if (root) renderGrid(root, games);
