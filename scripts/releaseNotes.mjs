// Prints the CHANGELOG.md section of a version, the notes of its GitHub Release (.github/workflows/release.yml).
// Fails when the section is missing, so a tag without its changelog entry is never released.
//
//   node scripts/releaseNotes.mjs 0.4.0
import {readFileSync} from 'node:fs';

const CHANGELOG_PATH = 'CHANGELOG.md';
const VERSION_HEADING = /^## \[([^\]]+)\]/;

const [version] = process.argv.slice(2);
if (!version) {
  console.error('usage: node scripts/releaseNotes.mjs <version>');
  process.exit(1);
}

const lines = readFileSync(CHANGELOG_PATH, 'utf8').split(/\r?\n/);
const start = lines.findIndex((line) => VERSION_HEADING.exec(line)?.[1] === version);
if (start === -1) {
  console.error(`${CHANGELOG_PATH} has no section "## [${version}]"`);
  process.exit(1);
}
const length = lines.slice(start + 1).findIndex((line) => VERSION_HEADING.test(line));
// the compare links at the bottom ("[0.4.0]: https://...") aren't part of the last section's notes
const section = lines.slice(start + 1, length === -1 ? undefined : start + 1 + length);
const notes = section
  .filter((line) => !/^\[[^\]]+\]: /.test(line))
  .join('\n')
  .trim();

if (notes === '') {
  console.error(`the section "## [${version}]" in ${CHANGELOG_PATH} is empty`);
  process.exit(1);
}
console.log(notes);
