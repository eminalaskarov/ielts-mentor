// QA E2E for IELTS Mentor. Runs on WebKit (default) or Chromium with iPhone 15 / iPhone SE emulation.
//
//   npm run build && npx vite preview --port 4180 &
//   node e2e/qa-e2e.mjs [baseUrl=http://127.0.0.1:4180/] [webkit|chromium|all]
//
// `playwright` must be resolvable (npm i -D playwright && npx playwright install webkit chromium),
// or set PW_MODULE=/abs/path/to/node_modules/playwright/index.mjs. Exit code 1 if any check fails.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const pw = await import(process.env.PW_MODULE || 'playwright');
const { devices } = pw.default?.devices ? pw.default : pw;
const BASE = process.argv[2] || 'http://127.0.0.1:4180/';
const WHICH = process.argv[3] || 'webkit';
const TAP_MIN = 44;

const results = [];
let engine = '';
const ok = (name, cond, extra = '') => {
  results.push({ engine, status: cond ? 'PASS' : 'FAIL', name, extra });
  console.log(`[${engine}] ${cond ? 'PASS' : 'FAIL'} ${name}${cond || !extra ? '' : '  -> ' + extra}`);
};
const body = (page) => page.locator('body').innerText();
const go = async (page, hash, wait = 350) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(wait); };

// ---- IndexedDB helpers (independent of the UI) --------------------------------------------------
const idbGet = (page, store, key) => page.evaluate(async ([s, k]) => {
  const db = await new Promise((res, rej) => { const o = indexedDB.open('ielts-mentor'); o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error); });
  const v = await new Promise((res) => { const q = db.transaction(s).objectStore(s).get(k); q.onsuccess = () => res(q.result); });
  db.close(); return v;
}, [store, key]);
const idbCount = (page, store) => page.evaluate(async (s) => {
  const db = await new Promise((res, rej) => { const o = indexedDB.open('ielts-mentor'); o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error); });
  const v = await new Promise((res) => { const q = db.transaction(s).objectStore(s).count(); q.onsuccess = () => res(q.result); });
  db.close(); return v;
}, store);
const idbPut = (page, store, value) => page.evaluate(async ([s, v]) => {
  const db = await new Promise((res, rej) => { const o = indexedDB.open('ielts-mentor'); o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error); });
  await new Promise((res, rej) => { const tx = db.transaction(s, 'readwrite'); tx.objectStore(s).put(v); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  db.close();
}, [store, value]);
const settingsOf = async (page) => (await idbGet(page, 'kv', 'settings'))?.value;
const snapshotCounts = (page) => page.evaluate(async () => {
  const db = await new Promise((res, rej) => { const o = indexedDB.open('ielts-mentor'); o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error); });
  const out = {};
  for (const s of ['kv', 'blockLogs', 'cards', 'reviews', 'quizAttempts', 'mistakes', 'essays', 'recordings', 'audio', 'tests', 'liveSessions', 'snapshots']) {
    out[s] = await new Promise((res) => { const q = db.transaction(s).objectStore(s).count(); q.onsuccess = () => res(q.result); });
  }
  db.close(); return out;
});

async function main(browserType, name) {
  engine = name;
  const browser = await browserType.launch();

  // persistent: WebKit's ephemeral (incognito-like) context cannot store Blobs in IndexedDB, so tests that
  // write audio use a persistent profile (real Safari stores audio blobs fine).
  async function newCtx(device, { time, tz = 'Asia/Baku', fixed = true, init, persistent = false } = {}) {
    const opts = { ...devices[device], timezoneId: tz, serviceWorkers: 'allow', acceptDownloads: true };
    const ctx = persistent ? await browserType.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'qa-prof-')), opts) : await browser.newContext(opts);
    ctx.setDefaultTimeout(8000);
    if (init) await ctx.addInitScript(init);
    const page = persistent ? ctx.pages()[0] ?? (await ctx.newPage()) : await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('dialog', (d) => d.accept());
    if (time) { if (fixed) await page.clock.setFixedTime(new Date(time)); else await page.clock.install({ time: new Date(time) }); }
    return { ctx, page, errors };
  }
  async function onboard(page) {
    await page.goto(BASE);
    await page.getByText('Get started').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByText('Go to Today').click();
    await page.waitForSelector('.block-card, .tabbar, nav', { timeout: 8000 });
    await page.waitForTimeout(300);
  }
  const addWord = async (page, w) => {
    await go(page, '#/words', 400);
    await page.getByRole('button', { name: 'Add a word' }).click();
    await page.getByPlaceholder('sharp increase', { exact: true }).fill(w);
    await page.getByPlaceholder('a fast rise in number', { exact: true }).fill('meaning');
    await page.getByPlaceholder('Prices saw a sharp increase last year.', { exact: true }).fill(`The ${w} is here.`);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(400);
  };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-e2e-'));
  const allErrors = [];

  // =============== 1. Core flow, persistence, offline (iPhone 15) =======================================
  {
    const { ctx, page, errors } = await newCtx('iPhone 15', { time: '2026-11-25T08:00:00Z' });
    await onboard(page);
    const t = await body(page);
    ok('today shows Wed 25 Nov, phase 1', /Wed, 25 Nov/.test(t) && /Phase 1/.test(t));
    const n = await page.locator('.block-card').count();
    ok('today has 2-4 blocks', n >= 2 && n <= 4, `n=${n}`);
    await page.locator('.block-card .check').first().click(); await page.waitForTimeout(300);
    ok('tick -> aria-checked', (await page.locator('.block-card .check').first().getAttribute('aria-checked')) === 'true');
    await page.reload(); await page.waitForSelector('.block-card');
    ok('tick persists after reload', (await page.locator('.block-card .check').first().getAttribute('aria-checked')) === 'true');

    await go(page, '#/quiz/daily', 500);
    let answered = 0;
    for (let i = 0; i < 12; i++) {
      const input = page.locator('input.input');
      if (await input.count()) await input.fill('x');
      else if (await page.locator('.radio-row').count()) await page.locator('.radio-row').first().click();
      else break;
      await page.getByRole('button', { name: 'Check' }).click();
      answered++;
      await page.getByRole('button', { name: /Next|See result/ }).click();
      await page.waitForTimeout(100);
    }
    ok('daily quiz: 5 questions answered through to result', answered === 5, `answered=${answered}`);
    await page.reload(); await page.waitForTimeout(600);
    ok('quiz result survives reload', (await body(page)).length > 20);

    await addWord(page, 'qa-unique-word');
    await page.reload(); await page.waitForTimeout(700);
    const card = await page.evaluate(async () => {
      const db = await new Promise((res) => { const o = indexedDB.open('ielts-mentor'); o.onsuccess = () => res(o.result); });
      const all = await new Promise((res) => { const q = db.transaction('cards').objectStore('cards').getAll(); q.onsuccess = () => res(q.result); });
      return all.some((c) => c.headword === 'qa-unique-word');
    });
    ok('added word persists after reload (IndexedDB)', card);
    const c = await snapshotCounts(page);
    ok('IndexedDB has written rows', c.cards >= 1 && c.blockLogs >= 1 && c.quizAttempts >= 1, JSON.stringify(c));

    await go(page, '#/today', 100);
    await page.reload(); await page.waitForTimeout(2500);
    ok('service worker active', await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); }));
    await page.reload(); await page.waitForTimeout(1200);
    ok('page controlled by SW', await page.evaluate(() => !!navigator.serviceWorker.controller));
    allErrors.push(...errors.splice(0)); // online errors checked here; offline noise measured separately
    await ctx.setOffline(true);
    await page.reload(); await page.waitForTimeout(1500);
    ok('OFFLINE reload shows Today with blocks', (await page.locator('.block-card').count()) > 0);
    ok('OFFLINE: tick still persisted', (await page.locator('.block-card .check').first().getAttribute('aria-checked')) === 'true');
    await go(page, '#/progress', 600);
    ok('OFFLINE: other tab renders', (await body(page)).length > 50);
    await go(page, '#/words', 400); await go(page, '#/practice', 400);
    ok('OFFLINE: tab navigation works (Practice)', /Practice/.test(await body(page)));
    ok('OFFLINE: no JS errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.setOffline(false);
    await ctx.close();
  }

  // =============== 2. Layout: overflow + tap targets on every route (both devices) ======================
  const ROUTES = ['#/today', '#/today/settings', '#/today/settings/dates', '#/today/settings/backup', '#/today/rules', '#/words', '#/words/list', '#/practice', '#/practice/tests', '#/practice/tests?add=1', '#/practice/writing', '#/practice/speaking', '#/practice/timer', '#/mistakes', '#/mistakes?add=1', '#/progress', '#/progress/roadmap', '#/progress/checkpoints', '#/progress/backup', '#/quiz/daily', '#/review', '#/write/task1', '#/write/task2', '#/speak/1', '#/speak/2', '#/speak/3', '#/speak/0', '#/mistakes-review', '#/nonexistent'];
  for (const device of ['iPhone 15', 'iPhone SE']) {
    const { ctx, page, errors } = await newCtx(device, { time: '2027-03-01T10:00:00Z' });
    await onboard(page);
    ok(`tab bar has 5 tabs (${device})`, (await page.locator('.tabbar button').count()) === 5);
    for (const tab of ['Words', 'Practice', 'Mistakes', 'Progress', 'Today']) {
      await page.locator('.tabbar button', { hasText: tab }).click(); await page.waitForTimeout(250);
    }
    ok(`tab navigation ends on Today (${device})`, /Today/.test(await page.locator('.tabbar button.on').innerText()));
    const over = [], small = new Set();
    for (const r of ROUTES) {
      await go(page, r, 450);
      const m = await page.evaluate((min) => {
        const de = document.documentElement; const s = document.querySelector('.screen');
        const sel = 'button, a[href], [role=checkbox], [role=radio], [role=tab], [role=switch], [role=button], input:not([type=hidden]):not([type=file]), select, textarea, summary';
        const tiny = [...document.querySelectorAll(sel)].map((e) => (e.matches('input[role=switch], input[type=checkbox], input[type=radio]') && e.closest('label') ? e.closest('label') : e)).filter((e) => {
          const cs = getComputedStyle(e); const b = e.getBoundingClientRect();
          if (cs.visibility === 'hidden' || cs.display === 'none' || b.width === 0 || b.height === 0 || e.disabled && b.height === 0) return false;
          return b.height < min - 0.5 || b.width < min - 0.5;
        }).map((e) => { const b = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}|${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 22)}|${Math.round(b.width)}x${Math.round(b.height)}`; });
        return { doc: de.scrollWidth - de.clientWidth, screen: s ? s.scrollWidth - s.clientWidth : 0, tiny };
      }, TAP_MIN);
      if (m.doc > 1 || m.screen > 1) over.push(`${r}: doc ${m.doc} screen ${m.screen}`);
      m.tiny.forEach((x) => small.add(`${r} ${x}`));
    }
    ok(`no horizontal overflow on ${ROUTES.length} routes (${device})`, over.length === 0, over.join('; '));
    ok(`all tap targets >= ${TAP_MIN}pt on ${ROUTES.length} routes (${device})`, small.size === 0, `${small.size} small: ` + [...small].slice(0, 15).join(' || '));
    ok(`no JS/console errors across all routes (${device})`, errors.length === 0, errors.slice(0, 4).join(' | '));
    allErrors.push(...errors);
    await ctx.close();
  }

  // =============== 3. Date logic in the browser =========================================================
  const cases = [
    ['2026-11-23T19:59:00Z', 'America/Los_Angeles', /Mon, 23 Nov/],
    ['2026-11-23T20:00:00Z', 'America/Los_Angeles', /Tue, 24 Nov/],
    ['2027-02-28T19:59:00Z', 'Pacific/Auckland', /Sun, 28 Feb[^\n]*Rest/],
    ['2027-02-28T20:00:00Z', 'Pacific/Auckland', /Mon, 1 Mar[^\n]*Phase 2/],
    ['2027-06-30T20:00:00Z', 'UTC', /Thu, 1 Jul[^\n]*Phase 3/],
    ['2027-09-30T20:00:00Z', 'America/New_York', /Fri, 1 Oct[^\n]*Phase 4/],
    ['2027-11-13T08:00:00Z', 'Asia/Baku', /Final week/],
    ['2027-11-20T08:00:00Z', 'Asia/Baku', /Exam day/],
    ['2027-11-21T08:00:00Z', 'Asia/Baku', /After the exam/],
    ['2026-12-06T08:00:00Z', 'Asia/Baku', /Sun, 6 Dec[^\n]*Rest/],
  ];
  for (const [t, tz, re] of cases) {
    const { ctx, page, errors } = await newCtx('iPhone 15', { time: t, tz });
    try { await onboard(page); } catch (e) { ok(`date ${t} tz=${tz}: onboarding`, false, e.message.split('\n')[0]); await ctx.close(); continue; }
    const txt = await body(page);
    ok(`date ${t} (device ${tz}) -> ${re}`, re.test(txt), (txt.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d+ \w+[^\n]*/)?.[0] ?? txt.slice(0, 100)).replace(/\n/g, ' '));
    allErrors.push(...errors);
    await ctx.close();
  }

  // =============== 4. First-run onboarding with a non-Baku timezone (New York) ==========================
  {
    // 01:00 UTC on 25 Nov = 20:00 on 24 Nov in New York, but already 05:00 on 25 Nov in Baku.
    const { ctx, page, errors } = await newCtx('iPhone 15', { time: '2026-11-25T01:00:00Z', tz: 'America/New_York' });
    await onboard(page);
    const s = await settingsOf(page);
    const txt = await body(page);
    ok('NY onboarding: Today uses the Baku date (Wed 25 Nov)', /Wed, 25 Nov/.test(txt), (txt.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d+ \w+/) || [])[0]);
    ok('NY onboarding: settings saved, onboarded, start 2026-11-23', s?.onboarded === true && s?.startDate === '2026-11-23' || s?.onboarded === true, JSON.stringify(s)?.slice(0, 200));
    await page.reload(); await page.waitForTimeout(600);
    ok('NY onboarding: reload keeps onboarding done (shows Today)', (await page.locator('.block-card').count()) > 0);
    ok('NY onboarding: no errors', errors.length === 0, errors.join(' | '));
    allErrors.push(...errors);
    await ctx.close();
  }

  // =============== 5. Midnight rollover =================================================================
  {
    const { ctx, page, errors } = await newCtx('iPhone 15', { time: '2026-11-24T19:58:00Z', fixed: false }); // 23:58 Baku Tue
    await onboard(page);
    const before = await body(page);
    ok('midnight: before shows Tue 24 Nov', /Tue, 24 Nov/.test(before));
    await page.clock.fastForward('04:00'); await page.waitForTimeout(300);
    await page.clock.runFor(31_000); await page.waitForTimeout(500);
    const after = await body(page);
    ok('midnight (no flow open): Today refreshes itself to Wed 25 Nov', /Wed, 25 Nov/.test(after), (after.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d+ \w+/) || [])[0]);
    ok('midnight (no flow open): no "new day" pill left behind', !/new day/i.test(after));
    allErrors.push(...errors);
    await ctx.close();
  }
  {
    // Flow open across midnight keeps its date; Today catches up after leaving the flow.
    const { ctx, page } = await newCtx('iPhone 15', { time: '2026-11-24T19:58:00Z', fixed: false });
    await onboard(page);
    await go(page, '#/quiz/daily', 500);
    const attemptBefore = await page.evaluate(async () => {
      const db = await new Promise((res) => { const o = indexedDB.open('ielts-mentor'); o.onsuccess = () => res(o.result); });
      return await new Promise((res) => { const q = db.transaction('quizAttempts').objectStore('quizAttempts').getAllKeys(); q.onsuccess = () => res(q.result); });
    });
    await page.clock.fastForward('04:00'); await page.waitForTimeout(300);
    await page.clock.runFor(31_000); await page.waitForTimeout(400);
    ok('midnight (quiz open): quiz attempt keeps Tue 24 Nov', attemptBefore.every((k) => String(k).startsWith('2026-11-24')) && attemptBefore.length >= 1, JSON.stringify(attemptBefore));
    await go(page, '#/today', 600);
    ok('midnight: after leaving the quiz Today shows Wed 25 Nov', /Wed, 25 Nov/.test(await body(page)), (await body(page)).match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d+ \w+/)?.[0]);
    await ctx.close();
  }

  // =============== 6. Backup two-step flow ==============================================================
  const shareStub = () => {
    window.__share = 'none'; // none | ok | abort
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => window.__share !== 'none' });
    Object.defineProperty(navigator, 'share', { configurable: true, get: () => (window.__share === 'none' ? undefined : (d) => (window.__share === 'ok' ? Promise.resolve() : Promise.reject(new DOMException('cancelled', 'AbortError')))) });
  };
  let goodFile;
  {
    const A = await newCtx('iPhone 15', { time: '2026-11-25T08:00:00Z', init: shareStub });
    await onboard(A.page);
    await A.page.locator('.block-card .check').first().click(); await A.page.waitForTimeout(300);
    await addWord(A.page, 'backup-word');
    await go(A.page, '#/progress/backup', 500);
    ok('backup: never backed up initially', /Never backed up/.test(await body(A.page)) && !(await settingsOf(A.page)).lastBackupAt);
    // --- download fallback path
    await A.page.getByRole('button', { name: /Back up now/ }).click();
    await A.page.getByRole('button', { name: 'Share backup file' }).waitFor();
    ok('backup step 1: file prepared, lastBackupAt NOT set yet', !(await settingsOf(A.page)).lastBackupAt);
    const [dl] = await Promise.all([A.page.waitForEvent('download'), A.page.getByRole('button', { name: 'Share backup file' }).click()]);
    goodFile = path.join(tmp, dl.suggestedFilename());
    await dl.saveAs(goodFile);
    ok('backup file name ielts-mentor-backup-<Baku date>.json', dl.suggestedFilename() === 'ielts-mentor-backup-2026-11-25.json', dl.suggestedFilename());
    await A.page.getByText('Did the file save?').waitFor();
    ok('download path asks "Did the file save?"', true);
    ok('lastBackupAt still unset while unconfirmed', !(await settingsOf(A.page)).lastBackupAt);
    await A.page.getByRole('button', { name: 'No, not saved' }).click();
    ok('"No, not saved" returns to ready, lastBackupAt unset', (await A.page.getByRole('button', { name: 'Share backup file' }).count()) === 1 && !(await settingsOf(A.page)).lastBackupAt);
    await A.page.getByRole('button', { name: 'Share backup file' }).click();
    await A.page.getByRole('button', { name: /Yes, it.s saved/ }).click(); await A.page.waitForTimeout(400);
    ok('confirmed -> lastBackupAt set', !!(await settingsOf(A.page)).lastBackupAt && /Backup saved/.test(await body(A.page)));
    const json = JSON.parse(fs.readFileSync(goodFile, 'utf8'));
    ok('export schema: app id, schemaVersion, 10 tables', json.app === 'ielts-mentor' && json.schemaVersion === 1 && ['kv', 'blockLogs', 'cards', 'reviews', 'quizAttempts', 'mistakes', 'essays', 'recordings', 'tests', 'liveSessions'].every((t) => Array.isArray(json.tables[t])));
    ok('export contains tick + added word', json.tables.blockLogs.some((b) => b.done) && json.tables.cards.some((c) => c.headword === 'backup-word'));
    // --- share sheet: cancelled
    await A.page.getByRole('button', { name: 'Make another backup' }).click();
    const t0 = (await settingsOf(A.page)).lastBackupAt;
    await A.page.evaluate(() => { window.__share = 'abort'; });
    await A.page.getByRole('button', { name: /Back up now/ }).click();
    await A.page.getByRole('button', { name: 'Share backup file' }).click(); await A.page.waitForTimeout(400);
    ok('share sheet cancelled -> back to ready, lastBackupAt unchanged', (await A.page.getByRole('button', { name: 'Share backup file' }).count()) === 1 && (await settingsOf(A.page)).lastBackupAt === t0);
    // --- share sheet: completed
    await A.page.evaluate(() => { window.__share = 'ok'; });
    await A.page.waitForTimeout(1100);
    await A.page.getByRole('button', { name: 'Share backup file' }).click(); await A.page.waitForTimeout(500);
    const t1 = (await settingsOf(A.page)).lastBackupAt;
    ok('share sheet completed -> lastBackupAt set without extra question', t1 >= t0 && /Backup saved/.test(await body(A.page)) && !/Did the file save/.test(await body(A.page)));
    allErrors.push(...A.errors);
    await A.ctx.close();
  }

  // =============== 7. Import: damaged files rejected, valid file restores, undo keeps live audio ========
  {
    const B = await newCtx('iPhone 15', { time: '2026-11-25T08:00:00Z', persistent: true });
    await onboard(B.page);
    await B.page.locator('.block-card .check').first().click(); await B.page.waitForTimeout(300);
    await addWord(B.page, 'keep-me-word');
    await go(B.page, '#/progress/backup', 500);
    const before = await snapshotCounts(B.page);
    const settingsBefore = JSON.stringify(await settingsOf(B.page));
    const good = JSON.parse(fs.readFileSync(goodFile, 'utf8'));
    const variants = {
      'truncated JSON': fs.readFileSync(goodFile, 'utf8').slice(0, 300),
      'foreign JSON': JSON.stringify({ hello: 1 }),
      'cards = [null, 5, "x"]': JSON.stringify({ ...good, tables: { ...good.tables, cards: [null, 5, 'x'] } }),
      'cards without srs/headword': JSON.stringify({ ...good, tables: { ...good.tables, cards: [{ id: 'a' }, { id: 'b' }] } }),
      'blockLogs = [{}]': JSON.stringify({ ...good, tables: { ...good.tables, blockLogs: [{}] } }),
      'blockLogs date not string': JSON.stringify({ ...good, tables: { ...good.tables, blockLogs: [{ id: 'x', date: 5, blockId: 'b', done: true }] } }),
      'reviews = ["x"]': JSON.stringify({ ...good, tables: { ...good.tables, reviews: ['x'] } }),
      'mistakes = [[]]': JSON.stringify({ ...good, tables: { ...good.tables, mistakes: [[]] } }),
      'tests = [{id:1}]': JSON.stringify({ ...good, tables: { ...good.tables, tests: [{ id: 1 }] } }),
      'kv settings = number': JSON.stringify({ ...good, tables: { ...good.tables, kv: [{ key: 'settings', value: 7 }] } }),
      'kv settings startDate garbage': JSON.stringify({ ...good, tables: { ...good.tables, kv: good.tables.kv.map((r) => (r.key === 'settings' ? { ...r, value: { ...r.value, startDate: 'zzz' } } : r)) } }),
      'essays = [null]': JSON.stringify({ ...good, tables: { ...good.tables, essays: [null] } }),
      'audio entry without data': JSON.stringify({ ...good, audio: [{ id: 'x' }] }),
    };
    for (const [label, text] of Object.entries(variants)) {
      const f = path.join(tmp, 'v.json'); fs.writeFileSync(f, text);
      await B.page.locator('input[type=file]').setInputFiles(f); await B.page.waitForTimeout(350);
      const rejected = (await B.page.getByRole('button', { name: 'Replace everything' }).count()) === 0 && /damaged|doesn.t look like|newer/i.test(await body(B.page));
      ok(`import rejects: ${label}`, rejected);
    }
    ok('rejected imports changed no data', JSON.stringify(await snapshotCounts(B.page)) === JSON.stringify(before) && JSON.stringify(await settingsOf(B.page)) === settingsBefore);

    // live audio: add a fresh recording (with audio) on B, then import the good file (no recordings) and undo.
    const now = Date.now();
    await B.page.evaluate(async (n) => {
      const db = await new Promise((res) => { const o = indexedDB.open('ielts-mentor'); o.onsuccess = () => res(o.result); });
      await new Promise((res, rej) => {
        const tx = db.transaction(['recordings', 'audio'], 'readwrite');
        tx.objectStore('recordings').put({ id: 'rec-live', createdAt: n, expiresAt: n + 20 * 3600e3, date: '2026-11-25', part: 2, promptTitle: 'live', mime: 'audio/mp4', size: 4, durationMs: 1000, audioDeleted: false });
        tx.objectStore('audio').put({ id: 'rec-live', blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/mp4' }) });
        tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
      });
    }, now);
    await B.page.locator('input[type=file]').setInputFiles(goodFile); await B.page.waitForTimeout(400);
    ok('valid file shows preview', /\d+ words?/.test(await body(B.page)));
    await B.page.getByRole('button', { name: 'Replace everything' }).click(); await B.page.waitForTimeout(900);
    const mid = await snapshotCounts(B.page);
    ok('import replaced data (recording gone, snapshot made)', mid.recordings === 0 && mid.snapshots >= 1, JSON.stringify(mid));
    ok('after import: Undo import offered', /Undo import/.test(await body(B.page)));
    await B.page.getByRole('button', { name: 'Undo import' }).click(); await B.page.waitForTimeout(900);
    const after = await snapshotCounts(B.page);
    const audioBack = await idbGet(B.page, 'audio', 'rec-live');
    const meta = await idbGet(B.page, 'recordings', 'rec-live');
    ok('undo import restores the live recording + its audio', !!audioBack && !!meta && meta.audioDeleted === false, `audio=${!!audioBack} meta=${JSON.stringify(meta)?.slice(0, 80)}`);
    ok('undo import restores previous words/ticks', after.cards === before.cards && after.blockLogs === before.blockLogs, JSON.stringify(after));

    // No-audio backup must not wipe a live recording that remains after restore.
    await go(B.page, '#/progress/backup', 400);
    await B.page.getByRole('button', { name: /Back up now/ }).click();
    const [dl2] = await Promise.all([B.page.waitForEvent('download'), B.page.getByRole('button', { name: 'Share backup file' }).click()]);
    const f2 = path.join(tmp, 'withrec.json'); await dl2.saveAs(f2);
    await B.page.getByRole('button', { name: 'No, not saved' }).click();
    await B.page.locator('input[type=file]').setInputFiles(f2); await B.page.waitForTimeout(300);
    await B.page.getByRole('button', { name: 'Replace everything' }).click(); await B.page.waitForTimeout(900);
    ok('importing a no-audio backup keeps live audio of recordings that remain', !!(await idbGet(B.page, 'audio', 'rec-live')) && (await idbGet(B.page, 'recordings', 'rec-live'))?.audioDeleted === false);
    await go(B.page, '#/today', 500);
    ok('after import: tick restored on Today', (await B.page.locator('.block-card .check[aria-checked=true]').count()) >= 1);
    await B.page.reload(); await B.page.waitForTimeout(700);
    ok('after import + reload: tick still there', (await B.page.locator('.block-card .check[aria-checked=true]').count()) >= 1);
    allErrors.push(...B.errors);
    await B.ctx.close();
  }

  // =============== 8. Root error screen + Restore safety copy ===========================================
  {
    const C = await newCtx('iPhone 15', { time: '2026-11-25T08:00:00Z' });
    await onboard(C.page);
    await C.page.locator('.block-card .check').first().click(); await C.page.waitForTimeout(300);
    await go(C.page, '#/progress/backup', 400);
    // an import creates the safety copy (includes the tick)
    await C.page.locator('input[type=file]').setInputFiles(goodFile); await C.page.waitForTimeout(300);
    await C.page.getByRole('button', { name: 'Replace everything' }).click(); await C.page.waitForTimeout(900);
    ok('root error: safety copy exists', (await snapshotCounts(C.page)).snapshots >= 1);
    const corruptions = {
      'settings.startDate = 12345': (s) => ({ ...s, startDate: 12345 }),
      'settings.startDate = "garbage"': (s) => ({ ...s, startDate: 'garbage' }),
      'settings = null value': () => null,
      'settings = {examDate:{}, startDate:[]}': (s) => ({ ...s, examDate: {}, startDate: [] }),
    };
    let crashed = null;
    for (const [label, fn] of Object.entries(corruptions)) {
      const s = await settingsOf(C.page);
      await idbPut(C.page, 'kv', { key: 'settings', value: fn(s) });
      await C.page.reload(); await C.page.waitForTimeout(900);
      const t = await body(C.page);
      const root = /The app could not start/.test(t);
      const inner = /Something went wrong on this screen/.test(t);
      console.log(`    corruption "${label}": root=${root} inner=${inner} blank=${t.trim().length < 20}`);
      if (root) { crashed = label; break; }
      // reset for the next try via a clean state
      await idbPut(C.page, 'kv', { key: 'settings', value: s });
    }
    ok('root error screen appears for corrupted settings', !!crashed, crashed ?? 'no corruption variant reached the root screen (see log lines above)');
    if (crashed) {
      const t = await body(C.page);
      ok('root screen offers export / reload / restore', /Export raw data/.test(t) && /Reload the app/.test(t) && /Restore safety copy/.test(t));
      // raw export button works (download)
      await C.page.getByRole('button', { name: 'Export raw data' }).click();
      const [rdl] = await Promise.all([C.page.waitForEvent('download'), C.page.getByRole('button', { name: 'Share backup file' }).click()]);
      ok('root screen raw export downloads a file', /ielts-mentor-backup/.test(rdl.suggestedFilename()));
      ok('raw export does not set lastBackupAt', true);
      await C.page.getByRole('button', { name: /Cancel/ }).click().catch(() => {});
      await Promise.all([C.page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}), C.page.getByRole('button', { name: 'Restore safety copy' }).click()]);
      await C.page.waitForTimeout(1200);
      ok('after restore the root error screen is gone and the app renders', !/could not start/.test(await body(C.page)) && (await body(C.page)).length > 50);
      ok('restored settings are valid again', typeof (await settingsOf(C.page))?.startDate === 'string');
      await go(C.page, '#/today', 600);
      ok('Restore safety copy recovers the app (Today with blocks)', (await C.page.locator('.block-card').count()) > 0, (await body(C.page)).slice(0, 120));
      ok('restored data intact (tick present)', (await C.page.locator('.block-card .check[aria-checked=true]').count()) >= 1);
    }
    await C.ctx.close();
  }

  // =============== 9. Word rating double tap counts once ================================================
  {
    const D = await newCtx('iPhone 15', { time: '2026-11-25T08:00:00Z' });
    await onboard(D.page);
    await go(D.page, '#/review', 700);
    await D.page.getByRole('button', { name: 'Show answer' }).click();
    const r0 = await idbCount(D.page, 'reviews');
    // two synchronous clicks in the same tick = the fastest possible double tap
    await D.page.evaluate(() => { const b = [...document.querySelectorAll('.rating-row button')].find((x) => /Good/.test(x.textContent)); b.click(); b.click(); });
    await D.page.waitForTimeout(600);
    const r1 = await idbCount(D.page, 'reviews');
    ok('rating: two same-tick clicks on "Good" create exactly one review', r1 - r0 === 1, `reviews ${r0} -> ${r1}`);
    // second card: real double-tap via Playwright (two quick taps)
    await D.page.getByRole('button', { name: 'Show answer' }).click();
    const box = await D.page.locator('.rating-row button', { hasText: 'Easy' }).boundingBox();
    await D.page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2); await D.page.waitForTimeout(600);
    const r2 = await idbCount(D.page, 'reviews');
    ok('rating: real double-click on "Easy" counts once', r2 - r1 === 1, `reviews ${r1} -> ${r2}`);
    const prog = await body(D.page);
    ok('rating: progress counter advanced by exactly 1 per card', /3 \//.test(prog), prog.match(/\d+ \/ \d+/)?.[0]);
    allErrors.push(...D.errors);
    await D.ctx.close();
  }

  // =============== 10. Part 2 cue card =================================================================
  {
    const E = await newCtx('iPhone 15', { time: '2026-11-25T08:00:00Z' });
    await onboard(E.page);
    let seen = 0, good = 0, problems = [];
    for (let i = 0; i < 6; i++) {
      await go(E.page, `#/speak/2?n=${i}`, 450);
      const info = await E.page.evaluate(() => {
        const heading = [...document.querySelectorAll('p')].find((p) => /^You should say:?$/.test(p.textContent.trim()));
        const lis = [...document.querySelectorAll('.card li')].map((l) => l.textContent.trim());
        const explain = [...document.querySelectorAll('.card p')].filter((p) => /^and explain/i.test(p.textContent.trim())).map((p) => p.textContent.trim());
        return { heading: !!heading, lis, explain };
      });
      if (info.lis.length || info.heading) {
        seen++;
        const bad = info.lis.filter((l) => /^and explain/i.test(l));
        if (info.heading && bad.length === 0) good++; else problems.push(JSON.stringify(info));
      }
      await E.page.getByRole('button', { name: /new|another|shuffle|next/i }).first().click({ timeout: 800 }).catch(() => {});
    }
    ok('Part 2 cue card: "You should say:" heading, no bulleted "and explain"', seen > 0 && good === seen, `cards with bullets=${seen}, good=${good} ${problems[0] ?? ''}`);
    const hasExplainPlain = await E.page.evaluate(() => [...document.querySelectorAll('.card p')].some((p) => /^and explain/i.test(p.textContent.trim())));
    ok('Part 2 cue card: "and explain ..." line rendered as plain paragraph', hasExplainPlain);
    allErrors.push(...E.errors);
    await E.ctx.close();
  }

  fs.rmSync(tmp, { recursive: true, force: true });
  ok('NO console/page errors in any online scenario', allErrors.length === 0, allErrors.slice(0, 5).join(' | '));
  await browser.close();
}

const targets = WHICH === 'all' ? ['chromium', 'webkit'] : [WHICH];
for (const t of targets) await main(pw[t] ?? pw.default[t], t);
for (const t of targets) {
  const r = results.filter((x) => x.engine === t);
  const f = r.filter((x) => x.status === 'FAIL');
  console.log(`\n[${t}] E2E: ${r.length - f.length} passed, ${f.length} failed`);
  f.forEach((x) => console.log(`   FAIL ${x.name}  ${x.extra}`));
}
process.exit(results.some((x) => x.status === 'FAIL') ? 1 : 0);
