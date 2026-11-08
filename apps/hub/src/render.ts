import type { GameEntry } from './games';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function renderGrid(root: HTMLElement, games: GameEntry[]): void {
  root.replaceChildren();
  if (games.length === 0) {
    root.append(el('p', 'No games yet — run npm run new-game', 'empty'));
    return;
  }
  for (const g of games) {
    const card = el('article', undefined, 'card');
    const img = el('img');
    img.src = g.thumbnailUrl;
    img.alt = g.title;
    const play = el('a', 'Play', 'play');
    play.href = g.url;
    card.append(
      img,
      el('h2', g.title),
      el('p', `by ${g.author}`, 'author'),
      el('p', g.description, 'desc'),
      play,
    );
    root.append(card);
  }
}
