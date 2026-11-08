import { test, expect } from 'vitest';
import { extractSpecifiers, checkImport } from '../lib/boundaries.mjs';
const G = 'games/idham/rpg';
test('extracts static, dynamic, side-effect and re-export specifiers', () => {
  const src = `import a from './a';\nimport './side';\nexport { b } from "../b";\nconst c = await import('./c');\nimport type { T } from './t';`;
  expect(extractSpecifiers(src).sort()).toEqual(['../b', './a', './c', './side', './t']);
});
test('allows relative imports inside the game', () => {
  expect(checkImport(`${G}/src/scenes/Play.ts`, '../logic/score', G, false)).toBeNull();
});
test('rejects relative imports escaping the game', () => {
  expect(checkImport(`${G}/src/a.ts`, '../../../axhad/fighter/src/x', G, false)).toMatch(/outside/);
});
test('rejects a sibling folder whose name starts with the game name', () => {
  expect(checkImport(`${G}/src/a.ts`, '../../rpg2/src/x', G, false)).toMatch(/outside/);
});
test('allowed bare packages', () => {
  expect(checkImport(`${G}/src/a.ts`, 'phaser', G, false)).toBeNull();
  expect(checkImport(`${G}/src/a.ts`, '@pixel-arcade/shared', G, false)).toBeNull();
  expect(checkImport(`${G}/tests/a.test.ts`, 'vitest', G, true)).toBeNull();
  expect(checkImport(`${G}/src/a.ts`, 'vitest', G, false)).toMatch(/not allowed/);
  expect(checkImport(`${G}/src/a.ts`, 'lodash', G, false)).toMatch(/not allowed/);
});
test('Windows paths behave like POSIX paths', () => {
  expect(
    checkImport('games\\idham\\rpg\\src\\a.ts', '../logic/x', 'games\\idham\\rpg', false),
  ).toBeNull();
  expect(
    checkImport('games\\idham\\rpg\\src\\a.ts', '../../../axhad/x', 'games\\idham\\rpg', false),
  ).toMatch(/outside/);
});
test('logic files may not import phaser or shared', () => {
  expect(checkImport(`${G}/src/logic/a.ts`, 'phaser', G, false)).toMatch(/logic/);
  expect(checkImport(`${G}/src/logic/a.ts`, '@pixel-arcade/shared', G, false)).toMatch(/logic/);
});
