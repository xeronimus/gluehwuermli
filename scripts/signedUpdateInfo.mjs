// Writes the hash and size of the signed installer into latest.yml (.github/workflows/release.yml).
// electron-builder writes latest.yml for the installer as it built it; signing changes the file, and electron-updater
// refuses a download whose SHA-512 doesn't match latest.yml.
//
//   node scripts/signedUpdateInfo.mjs dist/latest.yml dist/gluehwuermli-setup-0.4.0.exe
import {createHash} from 'node:crypto';
import {readFileSync, statSync, writeFileSync} from 'node:fs';
import {basename} from 'node:path';

const [updateInfoPath, installerPath] = process.argv.slice(2);
if (!updateInfoPath || !installerPath) {
  console.error('usage: node scripts/signedUpdateInfo.mjs <latest.yml> <installer>');
  process.exit(1);
}

const updateInfo = readFileSync(updateInfoPath, 'utf8');
const installerName = basename(installerPath);
if (!updateInfo.includes(`path: ${installerName}`)) {
  console.error(`${updateInfoPath} doesn't describe ${installerName}`);
  process.exit(1);
}

// electron-updater compares the base64 SHA-512 of the whole file
const sha512 = createHash('sha512').update(readFileSync(installerPath)).digest('base64');
const {size} = statSync(installerPath);

// one installer only: every sha512 and size in the file is that installer's (files[0] and the legacy top-level keys)
const signedUpdateInfo = updateInfo
  .replace(/^(\s*sha512: ).+$/gm, `$1${sha512}`)
  .replace(/^(\s*size: ).+$/gm, `$1${size}`);
writeFileSync(updateInfoPath, signedUpdateInfo);
console.log(`${updateInfoPath}: ${installerName}, ${size} bytes, sha512 ${sha512}`);
