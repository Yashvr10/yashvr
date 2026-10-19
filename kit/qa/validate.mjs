// node qa/validate.mjs <job.json…>: opens each job in the player and reports either "ok" (READY,
// with its duration and scenes) or the player's validation error. Exit 1 if any job is invalid.
import { serve, launch, openPage } from '../browser.mjs';

const jobs = process.argv.slice(2);
const server = serve();
const browser = await launch();
let bad = 0;
for (const job of jobs) {
  try {
    const page = await openPage(browser, `job=${encodeURIComponent(job)}`);
    const info = await page.evaluate(() => ({ d: window.DURATION, s: window.JOB.scenes.map((s) => `${s.tpl}${s.tr ? `(${s.tr})` : ''}`).join(' → ') }));
    console.log(`ok       ${job}: ${info.d.toFixed(2)} s, ${info.s}`);
    await page.close();
  } catch (e) {
    bad++;
    console.log(`INVALID  ${e.message.split('\n')[0]}`);
  }
}
await browser.close();
server.close();
process.exit(bad ? 1 : 0);
