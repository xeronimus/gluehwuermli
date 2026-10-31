import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';

/**
 * The import rules between the processes and, inside the renderer, between its layers (CLAUDE.md, ADR 2).
 * `@/` resolves into the source root of the importing file's process, `@shared/` into src/shared.
 */
const SRC_DIR = path.resolve(__dirname);
const MAIN_DIR = path.join(SRC_DIR, 'main');
const PRELOAD_DIR = path.join(SRC_DIR, 'preload');
const SHARED_DIR = path.join(SRC_DIR, 'shared');
const RENDERER_DIR = path.join(SRC_DIR, 'renderer', 'src');

const RENDERER_DATA_DIR = path.join(RENDERER_DIR, 'data');
const RENDERER_STATE_DIR = path.join(RENDERER_DIR, 'state');
const RENDERER_COMPONENTS_DIR = path.join(RENDERER_DIR, 'components');
const RENDERER_DOMAIN_DIR = path.join(RENDERER_DIR, 'domain');

const COMPOSITION_ROOTS = [path.join(MAIN_DIR, 'services.ts'), path.join(RENDERER_DATA_DIR, 'service', 'services.ts')];
const ICONS_MODULE = path.join(RENDERER_COMPONENTS_DIR, 'commons', 'icons.ts');
const ICON_PACKAGE = '@tabler/icons-react';

const IMPORT_SPECIFIER_PATTERN = /(?:from|import)\s+'([^']+)'/g;

interface ImportOfFile {
  file: string;
  specifier: string;
  /** absolute path for relative and aliased imports, undefined for packages */
  target: string | undefined;
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }
    return /\.tsx?$/.test(entry.name) ? [entryPath] : [];
  });
}

const isInside = (dir: string, target: string) => !path.relative(dir, target).startsWith('..');

const isTestFile = (file: string) => /\.test\.tsx?$/.test(file);

const processRootOf = (file: string) =>
  [MAIN_DIR, PRELOAD_DIR, SHARED_DIR, RENDERER_DIR].find((dir) => isInside(dir, file));

function resolveSpecifier(file: string, specifier: string): string | undefined {
  if (specifier.startsWith('@shared/')) {
    return path.join(SHARED_DIR, specifier.slice('@shared/'.length));
  }
  if (specifier.startsWith('@/')) {
    return path.join(processRootOf(file) ?? SRC_DIR, specifier.slice(2));
  }
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(file), specifier);
  }
  return undefined;
}

function importsOf(file: string): ImportOfFile[] {
  const source = readFileSync(file, 'utf-8');
  return Array.from(source.matchAll(IMPORT_SPECIFIER_PATTERN), ([, specifier = '']) => ({
    file,
    specifier,
    target: resolveSpecifier(file, specifier)
  }));
}

const describeImport = ({file, specifier}: ImportOfFile) => `${path.relative(SRC_DIR, file)} -> ${specifier}`;

const allSourceFiles = listSourceFiles(SRC_DIR).filter((file) => file !== __filename);
const allImports = allSourceFiles.flatMap(importsOf);

const importsFrom = (dir: string) => allImports.filter(({file}) => isInside(dir, file));
const targetsInside = (dir: string) => (anImport: ImportOfFile) =>
  anImport.target !== undefined && isInside(dir, anImport.target);

const isNodeOrElectron = ({specifier, target}: ImportOfFile) =>
  target === undefined && (specifier === 'electron' || specifier.startsWith('node:') || specifier === 'serialport');

test('the renderer imports neither main, preload, Node nor Electron', () => {
  const violations = importsFrom(RENDERER_DIR).filter(
    (anImport) =>
      targetsInside(MAIN_DIR)(anImport) || targetsInside(PRELOAD_DIR)(anImport) || isNodeOrElectron(anImport)
  );

  expect(violations.map(describeImport)).toEqual([]);
});

test('main never imports the renderer or the preload script', () => {
  const violations = importsFrom(MAIN_DIR).filter(
    (anImport) => targetsInside(RENDERER_DIR)(anImport) || targetsInside(PRELOAD_DIR)(anImport)
  );

  expect(violations.map(describeImport)).toEqual([]);
});

test('shared code depends on nothing but itself and plain packages, so every process can use it', () => {
  const violations = importsFrom(SHARED_DIR).filter(
    (anImport) =>
      (anImport.target !== undefined && !isInside(SHARED_DIR, anImport.target)) || isNodeOrElectron(anImport)
  );

  expect(violations.map(describeImport)).toEqual([]);
});

test('only the composition roots (and tests) import implementations from an impl/ folder', () => {
  const violations = allImports.filter(
    ({file, target}) =>
      target !== undefined &&
      target.split(path.sep).includes('impl') &&
      !file.split(path.sep).includes('impl') &&
      !COMPOSITION_ROOTS.includes(file) &&
      !isTestFile(file)
  );

  expect(violations.map(describeImport)).toEqual([]);
});

test('the renderer data layer never depends on the state or UI layer', () => {
  const violations = importsFrom(RENDERER_DATA_DIR).filter(
    (anImport) => targetsInside(RENDERER_STATE_DIR)(anImport) || targetsInside(RENDERER_COMPONENTS_DIR)(anImport)
  );

  expect(violations.map(describeImport)).toEqual([]);
});

test('the renderer state layer never depends on the UI layer', () => {
  const violations = importsFrom(RENDERER_STATE_DIR).filter(targetsInside(RENDERER_COMPONENTS_DIR));

  expect(violations.map(describeImport)).toEqual([]);
});

test('the renderer domain depends on nothing but itself, shared code and packages', () => {
  const violations = importsFrom(RENDERER_DOMAIN_DIR).filter(
    ({file, target}) =>
      !isTestFile(file) &&
      target !== undefined &&
      !isInside(RENDERER_DOMAIN_DIR, target) &&
      !isInside(SHARED_DIR, target)
  );

  expect(violations.map(describeImport)).toEqual([]);
});

test('only commons/icons.ts imports the icon package, everything else uses its semantic names', () => {
  const violations = allImports.filter(({file, specifier}) => file !== ICONS_MODULE && specifier === ICON_PACKAGE);

  expect(violations.map(describeImport)).toEqual([]);
});
