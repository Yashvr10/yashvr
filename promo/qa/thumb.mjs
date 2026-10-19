// node qa/thumb.mjs: renders the thumbnail scene (index.html?thumb) at ss=2 (3840×2160) to
// qa/thumb_3840.png and prints its contrast checks. SS is a whole number, so 2560×1440 is made by
// a lanczos downscale from this (see the package step in NOTES.md), not rendered directly.
import { writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab } from '../browser.mjs';

const server = serve();
const browser = await launch();
const page = await openPage(browser, 'thumb&ss=2&check');
await writeFile('qa/thumb_3840.png', await grab(page, 0.5));
console.log((await page.evaluate(() => (window.COPY_CHECKS ?? []).map((b) => `"${b.text}" ${b.ratio?.toFixed(1)}:1`))).join(' | '));
await browser.close();
server.close();
