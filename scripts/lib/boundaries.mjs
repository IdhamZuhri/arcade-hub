import path from 'node:path';

const norm = (p) => p.replaceAll('\\', '/');

export function extractSpecifiers(source) {
  const found = [];
  const patterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of source.matchAll(re)) found.push(m[1]);
  }
  return [...new Set(found)];
}

const matches = (spec, pkg) => spec === pkg || spec.startsWith(`${pkg}/`);

export function checkImport(fromFile, specifier, gameDir, isTest) {
  const file = norm(fromFile);
  const game = path.posix.normalize(norm(gameDir)).replace(/\/$/, '');

  if (specifier.startsWith('.')) {
    const resolved = path.posix.join(path.posix.dirname(file), specifier);
    const inside = resolved === game || resolved.startsWith(`${game}/`);
    return inside ? null : `relative import '${specifier}' resolves outside the game folder`;
  }

  const isPhaser = matches(specifier, 'phaser');
  const isShared = matches(specifier, '@pixel-arcade/shared');
  if ((isPhaser || isShared) && file.includes('/src/logic/')) {
    return `logic files may not import '${specifier}'`;
  }
  if (isPhaser || isShared || (isTest && matches(specifier, 'vitest'))) return null;
  return `import '${specifier}' is not allowed in games`;
}
