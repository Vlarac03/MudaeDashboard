// Prova al navegador de debò: enganxa cada missatge de tests/mostres/ a la casella d'Avui i comprova que no hi ha errors de JavaScript,
// i que «Fet» / «Desfer», les dades velles i la còpia de seguretat funcionen. Executa: node tests/test_navegador.cjs
// Cal Playwright (npm i playwright) i el tauler fet (python mudae.py); si no hi són, la prova es salta.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { execFileSync } = require('node:child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('navegador: Playwright no és instal·lat, prova saltada'); process.exit(0); }

const root = path.join(__dirname, '..'), dash = path.join(root, 'dashboard.html'), mostres = path.join(__dirname, 'mostres');
const sample = n => fs.readFileSync(path.join(mostres, n + '.txt'), 'utf8');

(async () => {
  if (!fs.existsSync(dash)) execFileSync(process.platform === 'win32' ? 'python' : 'python3', [path.join(root, 'mudae.py')], { stdio: 'ignore' });
  const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1200, height: 900 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  const open = () => page.goto('file://' + dash);
  const paste = async text => {
    await page.evaluate(t => { const a = document.getElementById('tuText'); a.value = t; a.dispatchEvent(new Event('paste')); }, text);
    await page.waitForTimeout(150);
    return (await page.textContent('#tuMsg')).trim();
  };
  const millores = () => page.evaluate(() => JSON.parse(localStorage.getItem('mudae-millores') || '{}'));
  await open();

  // 1. cada mostra de Mudae s'enganxa sense errors i el tauler diu alguna cosa
  for (const f of fs.readdirSync(mostres).filter(f => f.endsWith('.txt'))) {
    const msg = await paste(sample(f.slice(0, -4)));
    assert.ok(msg, `${f}: cap missatge`);
  }
  assert.deepEqual(errors, [], 'errors de JavaScript en enganxar les mostres');

  // 2. el $kt de 10 pisos: es llegeix a Millores (no és un $tu) i el missatge diu què ha entès
  await page.evaluate(() => localStorage.clear()); await open();
  const msg = await paste(sample('kt10pisos'));
  assert.match(msg, /\$kt: .*10/, 'el resum del $kt: ' + msg);
  let M = await millores();
  assert.equal(M.nf, 10); assert.equal(M.tv, 5000); assert.equal(M.k, 22551);

  // 3. «Fet» a la torre apunta el pis i descompta; «Desfer» ho torna
  await page.evaluate(() => document.querySelector('[data-done^="floor:"]').click());
  M = await millores();
  assert.equal(M.nf, 11); assert.equal(M.f.length, 11); assert.equal(M.k, 0);  // 22.551 - 55.000: no baixa de 0
  await page.evaluate(() => document.querySelector('[data-undo]').click());
  M = await millores();
  assert.equal(M.nf, 10); assert.equal(M.k, 22551);

  // 3b. els efectes de la llista són els de la torre on ets: el $kt d'un amic (torre 2) els porta; sense ell, la torre 2 ja és coneguda
  //     i la 3 avisa que els efectes són menors
  const floor8 = () => page.evaluate(() => document.querySelector('input[data-floor="8"]').nextElementSibling.textContent);
  await page.evaluate(() => localStorage.clear()); await open();
  await paste(sample('kt20pisos'));
  assert.match(await floor8(), /-2%/);
  assert.match(await page.textContent('#towerNext'), /\$build 9/); assert.match(await page.textContent('#towerNext'), /500/);  // el que dona el pis recomanat
  await page.evaluate(() => localStorage.clear()); await open();
  const setTower = n => page.evaluate(v => { const i = document.getElementById('towerNum'); i.value = v; i.dispatchEvent(new Event('change', { bubbles: true })); }, String(n));
  await setTower(2); assert.match(await floor8(), /2% less power/);
  await setTower(3); assert.match(await page.textContent('#towerNext'), /tower 1's; in tower 3 they are weaker/);
  await setTower(1); assert.match(await floor8(), /4% less power/);
  // un $kt d'una torre que no coneixem (la 3): els seus efectes surten sense haver de fer res, i es recorden en canviar de torre
  await paste(sample('kt3torre'));
  assert.match(await page.evaluate(() => document.querySelector('input[data-floor="2"]').nextElementSibling.textContent), /inventat/);
  assert.doesNotMatch(await page.textContent('#towerNext'), /paste your \$kt to see/);  // ja no avisa: els coneix
  await setTower(1); await setTower(3);
  assert.match(await page.evaluate(() => document.querySelector('input[data-floor="2"]').nextElementSibling.textContent), /inventat/);
  await paste(sample('kt10pisos'));

  // 4. dades velles: un $kt de fa 10 dies atenua la targeta i ho diu
  await page.evaluate(() => { const m = JSON.parse(localStorage.getItem('mudae-millores')); m.at = { '$kt': Date.now() - 10 * 864e5 }; localStorage.setItem('mudae-millores', JSON.stringify(m)); });
  await open();
  assert.equal(await page.evaluate(() => document.getElementById('towerBox').style.opacity), '0.6');
  assert.match(await page.textContent('#millMiss'), /\$kt \(10 d\)/);

  // 5. còpia de seguretat: baixar, esborrar, restaurar
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => document.getElementById('bkExport').click())]);
  const file = await dl.path();
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(j.mudae, 1); assert.ok(j.data['mudae-millores']);
  await page.evaluate(() => localStorage.removeItem('mudae-millores'));
  assert.deepEqual(await millores(), {});
  await Promise.all([page.waitForNavigation(), page.setInputFiles('#bkImport', file)]);
  M = await millores(); assert.equal(M.nf, 10);
  // un fitxer que no és una còpia, no toca res
  const bad = path.join(mostres, 'kt10pisos.txt');
  await page.setInputFiles('#bkImport', bad); await page.waitForTimeout(200);
  assert.match(await page.textContent('#bkMsg'), /./);
  assert.equal((await millores()).nf, 10);

  assert.deepEqual(errors, [], 'errors de JavaScript');
  await browser.close();
  console.log('navegador: totes les proves passen');
})().catch(e => { console.error(e); process.exit(1); });
