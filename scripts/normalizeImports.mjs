#!/usr/bin/env node
import {readFileSync, readdirSync, statSync, writeFileSync} from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The source roots `@/` points into, one per process (electron.vite.config.ts, the tsconfigs).
 * Preload and shared have no `@/`: they are flat.
 */
const sourceRoots = [path.resolve(__dirname, '../src/main'), path.resolve(__dirname, '../src/renderer/src')];

/**
 * Converts any relative import that goes up 2+ directory levels into an @/ absolute import.
 * Single-level relative imports (../) are left unchanged.
 * Imports that resolve outside the file's source root are left unchanged.
 *
 * Rule: use @/ for ../../ and deeper; use ./ or ../ for same-folder or one-level-up only.
 *
 * this is invoked by a npm script, see package.json
 */
function collectFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, results);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

// Matches paths in import/export/require specifiers starting with ../../ or deeper (2+ occurrences of ../)
const DEEP_RELATIVE = /(?<=\bfrom\s|\bimport\(|\brequire\()(['"])((?:\.\.\/){2,}[^'"]+)\1/g;

let totalFiles = 0;
let totalReplacements = 0;

for (const srcDir of sourceRoots) {
  for (const filePath of collectFiles(srcDir)) {
    const dir = path.dirname(filePath);
    const original = readFileSync(filePath, 'utf8');
    let replacements = 0;

    const updated = original.replace(DEEP_RELATIVE, (match, quote, importPath) => {
      const absolute = path.resolve(dir, importPath);

      // Skip if the resolved path escapes the source root
      if (!absolute.startsWith(srcDir + path.sep) && absolute !== srcDir) {
        return match;
      }

      const aliased = '@/' + path.relative(srcDir, absolute).replace(/\\/g, '/');
      replacements++;
      return `${quote}${aliased}${quote}`;
    });

    if (replacements > 0) {
      writeFileSync(filePath, updated);
      totalFiles++;
      totalReplacements += replacements;
      console.log(`  ${path.relative(srcDir, filePath)}  (${replacements})`);
    }
  }
}

console.log(`\nDone — ${totalReplacements} imports updated across ${totalFiles} files.`);
