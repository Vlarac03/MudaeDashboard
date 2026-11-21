// Proves de la pestanya «Millores»: llegir el $k, el $kt i el $opp. Executa: node tests/test_millores.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const sample = name => readFileSync(new URL(`./mostres/${name}.txt`, import.meta.url), 'utf8');  // missatges de Mudae tal com surten

const py = readFileSync(new URL('../mudae.py', import.meta.url), 'utf8');
const js = py.match(/JS_MILL = r"""([\s\S]*?)"""/)[1];
const BADGES = ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby', 'Emerald', 'Diamond'].map(n => [n, 0]);
const num = js.match(/const num = [^\n]*/)[0];
const costs = js.match(/const PCOST[^\n]*\n[^\n]*\n[^\n]*/)[0], lvl = js.match(/const LVL[^\n]*\n[^\n]*/)[0];
const readFull = new Function('BADGES', [num, costs, lvl, js.match(/function readMudae[\s\S]*?\n}\n/)[0]].join('\n') + 'return readMudae;')(BADGES);
// els efectes de cada pis (fd, fdT) es proven a part; la resta de proves comparen només el que ve darrere
const readMudae = (t, tv) => { const r = readFull(t, tv); delete r.fd; delete r.fdT; return r; };

const k = sample('k');
// el preu que surt és el del nivell següent: Sapphire II → el III costa 15.000 (5.000 per nivell, els de sèrie)
assert.deepEqual(readMudae(k, 5000), { b: { Bronze: 4, Silver: 4, Gold: 4, Sapphire: 2, Ruby: 1, Emerald: 0, Diamond: 0 }, bp: { Sapphire: 5000, Ruby: 7000 }, k: 28223 });
// un servidor amb altres preus ($badgevalue) i el Ruby IV, que ja ve descomptat al $k: el preu per nivell es desa sense descompte
assert.deepEqual(readMudae('Tienes 10!\n Ruby IV · ¡Máximo alcanzado!\n Emerald · 1.500\n Diamond II · 4.500\nDesbloquea un nivel con $bronze', 5000).bp,
  { Emerald: 2000, Diamond: 2000 });
// el $k de Victor (30/10/2026): totes al IV
const kMax = `Tienes 6.221!\nConvierte tu kakera en insignias de poder:\n` + BADGES.map(([n]) => ` ${n} IV · ¡Máximo alcanzado!`).join('\n') + `\nDesbloquea un nivel con $bronze, $silver...`;
assert.deepEqual(readMudae(kMax, 5000), { b: Object.fromEntries(BADGES.map(([n]) => [n, 4])), bp: {}, k: 6221 });
// $mmy=: els personatges amb claus, de més a menys
assert.deepEqual(readMudae('Harem de jo\n\nLanie Parish ·  🔑 (1)\nHello Kitty ·   (12)\nRui (HOHD) ·   (3)', 5000),
  { keys: [['Hello Kitty', 12], ['Rui (HOHD)', 3], ['Lanie Parish', 1]] });
// $tu: les dues «Capital», la de la kakera i la de les esferes
assert.deepEqual(readMudae('Poder: 110%\nCapital: 4.532:kakera:\n\n0 $oh restantes para hoy\nCapital: 1.725 :sp:\n=> $tuarrange', 5000), { k: 4532, sp: 1725 });

const kt = sample('kt');
assert.deepEqual(readMudae(kt, 5000), { ktCost: 40000, nf: 7, k: 615 });
assert.deepEqual(readMudae(kt.replace('cuesta 40.000', 'costs 80,000'), 10000), { ktCost: 80000, nf: 7, k: 615 });
assert.deepEqual(readMudae(kt, null), { ktCost: 40000, k: 615 });  // sense el preu base de la torre, no sabem quants pisos tens
// el $kt sencer d'un amic de Victor (02/11/2026): «+1 torre», el preu per pis i una marca als pisos fets (17 = 12 + 5; 90.000 = 5.000 × 18)
const ktFull = sample('ktFull');
assert.deepEqual(readMudae(ktFull, 7000), { ktCost: 90000, tv: 5000, t: 1, f: [2, 7, 8, 10, 11], nf: 17, k: 29511 });  // el preu per pis del $kt mana
// el $kt sencer a la casella d'Avui no és un $tu (parla de «+1 roll por hora» i del $dk: abans marcava les tirades i el $dk)
const paste = py.match(/JS_PASTE = r"""([\s\S]*?)"""/)[1];
const notTu = new Function('text', paste.match(/const bonusLike = [^\n]*/)[0] + '\nreturn bonusLike;');
assert.equal(notTu(ktFull), true);
assert.equal(notTu('Tienes 0 rolls.\nPuedes reclamar ahora.'), false);
// el $kt d'un jugador amb 10 pisos (Victor, 21/11/2026): codis d'emoji enganxats al text («es:tow10:», «Tienes 22.551:kakera:»)
const kt10 = sample('kt10pisos');
assert.deepEqual(readMudae(kt10, null), { ktCost: 55000, tv: 5000, t: 0, f: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11], nf: 10, k: 22551 });
assert.equal(notTu(kt10), true);  // tampoc no és un $tu: parla de «+1 roll por hora»
// el $kt d'un amic de Victor (21/11/2026): torre 2 amb 8 pisos; 105.000 = 5.000 × 21, i les 8 marques ho confirmen
const kt20 = sample('kt20pisos');
assert.deepEqual(readMudae(kt20, null), { ktCost: 105000, tv: 5000, t: 1, f: [1, 2, 4, 5, 6, 7, 8, 11], nf: 20, k: 11129 });
assert.equal(notTu(kt20), true);
// els efectes de cada pis són els de la torre on ets: el $kt del teu amic (torre 2) els porta tots, el teu (torre 1) també
const fd2 = readFull(kt20, null), fd1 = readFull(kt10, null);
assert.equal(fd2.fdT, 2); assert.equal(fd1.fdT, 1);
assert.equal(Object.keys(fd2.fd).length, 12);
assert.equal(fd2.fd[8], 'Botones de kakera cuestan -2% poder de kakera');   // torre 2: -2 %
assert.equal(fd1.fd[8], 'Botones de kakera cuestan -4% poder de kakera');   // torre 1: -4 %
assert.equal(fd2.fd[12], 'Comandos $colorll y $colorsl desbloqueados');
assert.equal(readFull('El siguiente nivel cuesta 40.000\nTienes 5\nArma un piso usando $build <n>', 5000).fd, undefined);  // sense la llista, no n'hi ha
// un $kt de la torre 3 (és el de la 2 amb el nombre de torres i el preu canviats, i un efecte inventat): els efectes surten com a de la torre 3
const kt3 = readFull(sample('kt3torre'), null);
assert.equal(kt3.t, 2); assert.equal(kt3.nf, 32); assert.equal(kt3.fdT, 3);
assert.match(kt3.fd[2], /\+10% \(inventat/);
// els pisos sense fer amb un emoji davant (copiat d'una altra manera): totes les línies semblen marcades, però el preu diu 17
const ktEmoji = ktFull.replace(/^\[(\d+)\]/gm, '⬛ [$1]');
assert.deepEqual(readMudae(ktEmoji, 5000), { ktCost: 90000, tv: 5000, nf: 17, k: 29511 });
// en un altre idioma, sense el «(+1 torre)» entès: la torre surt del preu i les marques quadren (5 = 17 - 12)
assert.deepEqual(readMudae(ktFull.replace('(+ 1 torre)', '(+ 1 Turmx)'), 5000), { ktCost: 90000, tv: 5000, t: 1, f: [2, 7, 8, 10, 11], nf: 17, k: 29511 });
// els 12 marcats: aquella torre ja és acabada
const kt12 = ktFull.replace(/^\[(\d+)\]/gm, '☑️ [$1]').replace('cuesta 90.000', 'cuesta 125.000');
assert.deepEqual(readMudae(kt12, 5000), { ktCost: 125000, tv: 5000, t: 2, f: [], nf: 24, k: 29511 });
assert.equal(readMudae('Next level cost: 40,000\nYou have 615\nBuild a floor with $build <number>', 5000).ktCost, 40000);  // amb dos punts

const opp = sample('opp');
assert.deepEqual(readMudae(opp, 5000), { opp: { name: 'Harry Potter', levels: [2, 0, 0, 6, 0, 0, 0, 0, 0, 1] }, sp: 1780 });
// el $opp de debò (Victor, 30/10/2026): al màxim posa [MAX], no [LVL 1]
const oppMax = sample('oppMax');
assert.deepEqual(readMudae(oppMax, 5000), { opp: { name: 'Harry Potter', levels: [0, 0, 6, 0, 0, 0, 0, 0, 0, 1] }, sp: 1725 });
// el $opz de Victor (01/11/2026): els personatges amb esferes, un per pàgina, amb el mateix format que el $opp
const opz = sample('opz');
assert.deepEqual(readMudae(opz, 5000), { opp: { name: 'Harry Potter', levels: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1] }, sp: 145 });
const fn = name => js.match(new RegExp(`function ${name}[\\s\\S]*?\\n}\\n`))[0];
// $os: la botiga d'esferes (10 bonus; alguns ocupen dues línies)
const os = sample('os');
assert.deepEqual(readMudae(os, 5000), { shop: [0, 3, 0, 0, 0, 0, 0, 0, 0, 10], sp: 1725 });
assert.equal(readMudae(os.replace('[LVL 3]', '[MAX]'), 5000).shop[1], 10);
// $or et torna el 90 % del que hi has posat: l'Harry Potter de Victor (01/11/2026), millora 4 al LVL 4 i la 10 → 3.000, et torna 2.700
const refundPlan = new Function([costs, js.match(/const spent = [^\n]*/)[0], fn('refundPlan')].join('\n') + 'return refundPlan;')();
const lv = o => Array.from({ length: 10 }, (_, i) => o[i + 1] || 0);
assert.deepEqual(refundPlan(lv({ 4: 4, 10: 1 })), { total: 3000, back: 2700, free: 1700 });  // hi tornes la 10 i en queden 1.700
assert.equal(refundPlan(lv({ 10: 1 })), null);             // només la 10: no hi ha res a tornar
assert.equal(refundPlan(lv({ 4: 1, 10: 1 })), null);       // 1.200 → 1.080, i amb la 10 de nou en queden 80: no val la pena
assert.deepEqual(refundPlan(lv({ 8: 1, 9: 1 })), { total: 2000, back: 1800, free: 1800 });
// les compres d'esferes recomanades: la primera de l'ordre que no és al màxim, nivell a nivell
const [nextBuys, perkMax, perkCost, shopMax, shopCost] = new Function(costs + '\n' + fn('nextBuys') + 'return [nextBuys, perkMax, perkCost, shopMax, shopCost];')();
const PORD = [10, 4, 5, 2, 3, 8, 9, 1, 6, 7];
assert.deepEqual(nextBuys([2, 0, 0, 6, 0, 0, 0, 0, 0, 1], PORD, perkMax, perkCost),  // l'Harry Potter de dalt: 10 i 4 fets, toca la 5
  [{ n: 5, l: 1, cost: 200 }, { n: 5, l: 2, cost: 400 }, { n: 5, l: 3, cost: 600 }]);
assert.deepEqual(nextBuys([0, 0, 0, 5, 0, 0, 0, 0, 0, 0], PORD, perkMax, perkCost, 2), [{ n: 10, l: 1, cost: 1000 }, { n: 4, l: 6, cost: 2000 }]);
assert.deepEqual(nextBuys([6, 6, 6, 6, 6, 1, 1, 1, 1, 1], PORD, perkMax, perkCost), []);  // millorat del tot
assert.deepEqual(nextBuys([0, 3], [2, 4], shopMax, shopCost, 2), [{ n: 2, l: 4, cost: 16000 }, { n: 2, l: 5, cost: 20000 }]);
// la botiga: el nivell més barat d'entre les que et serveixen; si costen igual, la primera de l'ordre
const cheapestBuys = new Function(costs + '\n' + fn('cheapestBuys') + 'return cheapestBuys;')();
assert.deepEqual(cheapestBuys([0, 0, 0, 0], [2, 4], shopMax, shopCost), [{ n: 2, l: 1, cost: 4000 }, { n: 4, l: 1, cost: 4000 }, { n: 2, l: 2, cost: 8000 }]);
assert.deepEqual(cheapestBuys([0, 3, 0, 0], [2, 4], shopMax, shopCost, 2), [{ n: 4, l: 1, cost: 4000 }, { n: 4, l: 2, cost: 8000 }]);

// $bonus de Victor (01/11/2026), dues pàgines («1.» i «2.»): una línia per bonus, i el que en fa servir el tauler
const bonus = sample('bonus');
const B = readMudae(bonus + '\n · Espacios de lista de deseos: +8 (6 $k + 0 $kl + 2 $kt)\n · Espacios de Starwish: +0 (0 $kl + 0 $sw)', 5000).bonus;
assert.equal(B.length, 10);
assert.deepEqual(B[0], ['Rolls por hora', '+8 (6 $k + 1 $kl + 1 $kt)']);
assert.deepEqual(B[6], ['Probabilidad de obtener una llave adicional en deseos', '+10% ($kt)']);
assert.deepEqual(readMudae(bonus.replaceAll('·', '•'), 5000).bonus.slice(0, 1), [['Rolls por hora', '+8 (6 $k + 1 $kl + 1 $kt)']]);  // amb • en lloc de ·
assert.equal(readMudae('Bonos del Jugador\n$limroul $kl', 5000).bonus, undefined);
// un tros del $bonus sense capçalera ni $limroul (d'un amic de Victor): 3 línies o més amb «($kt)», «(6 $k + …)»
assert.deepEqual(readMudae(' · Rolls por hora: +8 (6 $k + 0 $kl + 2 $kt)\n · Poder máximo de Kakera: 115% ($kt)\n · Tiempo de espera para $rt: 20h (-30h $k -0h $kl)', 5000).bonus.length, 3);  // cap línia entesa: no desa un $bonus buit
// les dues pàgines del $bonus, cadascuna sola (Victor, 01/11/2026: la 2 sola no s'entenia), i ajuntades
const [pg1, pg2] = bonus.split('\n2. ');
assert.equal(readMudae(pg1, 5000).bonus.length, 6);
assert.deepEqual(readMudae('2. ' + pg2, 5000).bonus.map(([l]) => l), ['Probabilidad de obtener una llave adicional en deseos', '$oh bono diario']);
const mergeBonus = new Function(js.match(/const mergeBonus = [^\n]*/)[0] + '\nreturn mergeBonus;')();
const both = mergeBonus(readMudae(pg1, 5000).bonus, readMudae('2. ' + pg2, 5000).bonus);
assert.equal(both.length, 8);
assert.equal(mergeBonus(both, [['$oh bono diario', '+80 spheres']]).find(([l]) => l === '$oh bono diario')[1], '+80 spheres');  // la nova mana
// $mmy= per pàgines: la 2a s'ajunta amb la 1a (abans l'esborrava) i el que torna a sortir mana
const k1 = readMudae('Hello Kitty ·  (12)\nLanie Parish ·  (1)\nPágina 1/2', 5000).keys, k2 = readMudae('Rui (HOHD) ·  (3)\nLanie Parish ·  (2)\nPágina 2/2', 5000).keys;
assert.deepEqual(mergeBonus(k1, k2).sort((a, b) => b[1] - a[1]), [['Hello Kitty', 12], ['Rui (HOHD)', 3], ['Lanie Parish', 2]]);
assert.equal(readMudae('[LVL 3] Una megasphere tiene un 1/50\n · Megaspheres: 0', 5000).bonus, undefined);  // el $os no és el $bonus
// el $bonus tal com surt en copiar-lo de Discord (Victor, 01/11/2026): cada línia comença amb el codi de l'emoji
const clip = sample('clip');
const noEmoji = new Function(js.match(/const noEmoji = [^\n]*/)[0] + '\nreturn noEmoji;')();
assert.equal(readMudae(clip, 5000).bonus, undefined);  // sense treure els emojis, no se n'entén cap línia
assert.equal(readMudae(noEmoji(clip), 5000).bonus.length, 21);
assert.equal(noEmoji(' <:sp:123> · Capital: 1.725 :sp:'), ' · Capital: 1.725 :sp:');  // només el del principi de la línia
const bonusFacts = new Function(fn('bonusFacts') + 'return bonusFacts;')();
assert.deepEqual(bonusFacts(B), { pmax: 110, pcost: 36, oh: 40, rt: 20, wl: 8 });  // 7 de base + 8 = els 15 de Victor
assert.deepEqual(bonusFacts(readMudae(noEmoji(clip), 5000).bonus), { pmax: 110, pcost: 36, oh: 80, rt: 20, wl: 8 });
assert.deepEqual(bonusFacts(undefined), { pmax: null, pcost: null, oh: null, rt: null, wl: null });
assert.deepEqual(readMudae('Hola, això no és de Mudae', 5000), {});
assert.deepEqual(readMudae('Kakera rewards\nBonus Bronze I + Silver I + Gold I\n$bronze', 5000), {});  // el $kakerareward no són els teus nivells
// efectes de cada pis per torre, de la taula de la wiki («Kakera Tower/Perks»); T de prova: omple les {variables} del text
const fill = (k, p = {}) => k.replace(/\{(\w+)\}/g, (_, v) => p[v]);
const towerFx = new Function('T', js.match(/const STARWISH = [^\n]*/)[0] + '\n' + fn('towerFx') + 'return towerFx;')(fill);
for (let n = 1; n <= 12; n++) assert.equal(towerFx(n, 1), null);  // la torre 1 és la llista tal qual
const fx = (n, t) => towerFx(n, t);
assert.equal(fx(2, 2), 'El teu $starwish surt un 25 % més'); assert.equal(fx(2, 3), 'El teu $starwish surt un 20 % més');
assert.equal(fx(2, 12), 'El teu $starwish surt un 3 % més'); assert.equal(fx(2, 20), 'El teu $starwish surt un 1 % més');
assert.equal(fx(2, 21), 'El teu $starwish surt un 1 % més (aprox.)');  // la wiki només arriba a la torre 20
assert.equal(fx(3, 2), 'Menys límit de $limroul: 140 $wa, 140 $ha, 70 $wg, 70 $hg');
assert.equal(fx(1, 5), null); assert.equal(fx(4, 2), null);   // +2 llocs i +10 % de segona clau: igual que a la 1
assert.match(fx(4, 3), /^\+5 % de segona clau/); assert.match(fx(4, 22), /^\+5 % de segona clau/); assert.match(fx(4, 23), /tercera clau/);
assert.equal(fx(5, 2), 'El $oh et destapa 1 botó'); assert.equal(fx(5, 8), 'El $oh et destapa 1 botó'); assert.match(fx(5, 9), /^\+0,5 % de doblar/);
assert.equal(fx(6, 2), '+30 esferes amb el $dk'); assert.match(fx(6, 3), /Bronze IV$/); assert.match(fx(6, 4), /\$rolls$/);
assert.match(fx(6, 5), /\+2 esferes més/); assert.match(fx(6, 9), /\+2 esferes més/); assert.match(fx(6, 10), /\+1 esferes més/);
assert.equal(fx(7, 2), 'Poder màxim base de kakera: +5 %'); assert.equal(fx(7, 75), 'Poder màxim base de kakera: +5 %'); assert.equal(fx(7, 76), 'Poder màxim base de kakera: +1 %');
assert.equal(fx(8, 2), 'Clicar kakera gasta un 2 % menys de poder'); assert.equal(fx(8, 4), 'Clicar kakera gasta un 2 % menys de poder'); assert.match(fx(8, 5), /^La kakera vermella/);
assert.equal(fx(9, 11), null); assert.match(fx(9, 12), /^\+100 de kakera/); assert.match(fx(9, 21), /^\+100 de kakera/); assert.match(fx(9, 22), /^\+50 de kakera/);
assert.equal(fx(10, 10), null); assert.match(fx(10, 11), /raresa/);
assert.equal(fx(11, 10), null); assert.match(fx(11, 11), /^\+30 %/); assert.match(fx(11, 30), /^\+30 %/); assert.match(fx(11, 31), /^\+40 %/); assert.match(fx(11, 51), /^\+50 %/);
assert.equal(fx(12, 2), 'Desbloqueja $colorll i $colorsl'); assert.match(fx(12, 3), /\+165 de kakera/); assert.match(fx(12, 10), /\+165 de kakera/); assert.match(fx(12, 11), /\+3 de kakera/);
// torre: 12 pisos per torre; el $kt diu el total i d'aquí surt la torre on ets
const TOWER = [11, 8, 7, 6, 5, 1, 4, 2, 9, 10, 3, 12];
const [towerNext, towerFromKt] = new Function('TOWER', js.match(/const X10_FROM = [^\n]*/)[0] + '\n' + fn('towerOrder') + fn('towerNext') + fn('towerFromKt').replace(/\n$/, '') + '\nreturn [towerNext, towerFromKt];')(TOWER);
assert.deepEqual(towerNext({ f: [11, 8], tv: 5000 }), { tw: 0, built: 2, ok: true, cost: 15000, rec: 7 });
assert.deepEqual(towerNext({ t: 1, f: [], tv: 5000 }), { tw: 1, built: 12, ok: true, cost: 65000, rec: 11 });  // torre 2: torna a començar per l'11
assert.deepEqual(towerFromKt({ f: [11, 8] }, 14), { t: 1, f: [] });  // 14 pisos: torre 2, els marcats eren de la 1
assert.deepEqual(towerFromKt({ t: 1, f: [11, 8] }, 14), { t: 1, f: [11, 8] });
assert.equal(towerNext({ f: [8], tv: null }).cost, null);  // sense preu base, no s'inventa el preu
// l'ordre recomanat canvia amb la torre: a la 5 el 7 abans que el 8, a la 9-10 el 5 va al final, a la 11 el 11 (kakera de Bronze/Silver IV) primer
assert.equal(towerNext({ nf: 48, f: [], tv: 5000 }).rec, 7);                       // torre 5, buida
assert.equal(towerNext({ nf: 49, f: [7], tv: 5000 }).rec, 8);
assert.equal(towerNext({ nf: 96, f: [], tv: 5000 }).rec, 7);                       // torre 9
assert.equal(towerNext({ nf: 120, f: [], tv: 5000 }).rec, 11);                     // torre 11
assert.equal(towerNext({ nf: 131, f: [11, 7, 8, 1, 6, 4, 2, 9, 10, 5, 12], tv: 5000 }).rec, 3);  // torre 11, l'últim
assert.equal(towerNext({ nf: 12, f: [], tv: 5000 }).rec, 11);                      // torre 2: l'ordre de sempre (el de TOWER)
// el $kt (sense marques) diu 18 pisos i en tens 5 de marcats: el preu és el del $kt, i no recomana cap pis (podria ser un que ja tens)
assert.deepEqual(towerNext({ t: 1, f: [2, 7, 8, 10, 11], nf: 18, tv: 5000 }), { tw: 1, built: 18, ok: false, cost: 95000, rec: null });
assert.deepEqual(towerFromKt({ t: 1, f: [2, 7, 8, 10, 11] }, 15), { t: 1, f: [] });  // més marques que pisos: no són bones
assert.deepEqual(towerFromKt({ t: 1, f: [2, 7] }, 17), { t: 1, f: [2, 7] });  // en falten: les deixa i en marques més
// el preu base surt del $kt si has marcat els pisos: 7 pisos i el següent costa 40.000 → 5.000
const towerGuess = new Function('TOWER', js.match(/const X10_FROM = [^\n]*/)[0] + '\n' + fn('towerOrder') + fn('towerNext') + fn('towerGuess') + 'return towerGuess;')(TOWER);
assert.equal(towerGuess({ f: [1, 2, 4, 7, 8, 10, 11], ktCost: 40000 }), 5000);
assert.equal(towerGuess({ f: [], ktCost: 40000 }), null);  // sense pisos marcats no ho sabem
assert.equal(towerGuess({ f: [8], ktCost: 300000 }), null);  // fora de 5.000-50.000: els pisos marcats no quadren
assert.equal(towerGuess({ f: [1, 2], ktCost: 40000 }), null);  // 40.000 / 3 no és exacte: el $kt és d'abans dels pisos marcats
// «Posar al dia» endevina què has enganxat
const upd = py.match(/JS_UPD = r"""([\s\S]*?)"""/)[1];
const detect = new Function(upd.match(/function detect[\s\S]*?\n}\n/)[0] + 'return detect;')();
assert.deepEqual(detect("jo's Wishlist - 2/15\nSnape\n"), { kind: 'wishlist' });
assert.deepEqual(detect('Castle + Pingu   3/7\n(bundle)\nKate Beckett  💞 => jo - Castle\nKevin Ryan - Castle\nPingu - Pingu\n'), { kind: 'totes' });
assert.deepEqual(detect('Kate Beckett - Castle\nPingu - Pingu\n'), { kind: 'harem' });
assert.deepEqual(detect('1. Harry Potter 2/4\n\nHP\n\nDobby  💞 => pep\nWinky\n'), { kind: 'serie', serie: 'Harry Potter' });
assert.deepEqual(detect('Hola'), {});

// Pokédex: el $pd sumrare de Victor (31/10/2026), quants en té de cada raresa en un sol missatge
const pdJs = py.match(/JS_PD = r"""([\s\S]*?)"""/)[1];
const pdSumrare = new Function([pdJs.match(/const pdNum[^\n]*/)[0], pdJs.match(/function pdSumrare[\s\S]*?\n}\n/)[0]].join('\n') + 'return pdSumrare;')();
assert.deepEqual(pdSumrare('vlarac\n\n5 (1/90)\n\n4 (1/165)\n\n3 (8/337)\n\n2 (15/225)\n\n1 (75/177)\n100 / 1.025'),
  { rare: { 1: [75, 177], 2: [15, 225], 3: [8, 337], 4: [1, 165], 5: [1, 90] }, have: 100, total: 1025 });
// tal com surt copiat de Discord, amb l'emoji 🌟 i la línia «Imagen» (de Victor, 31/10/2026)
assert.deepEqual(pdSumrare('Mudae\nAPP\n — 12:33\n\nvlarac\n\n5🌟 (1/90)\n\n4🌟 (1/165)\n\n3🌟 (8/337)\n\n2🌟 (15/225)\n\n1🌟 (75/177)\nImagen\n100 / 1.025'),
  { rare: { 1: [75, 177], 2: [15, 225], 3: [8, 337], 4: [1, 165], 5: [1, 90] }, have: 100, total: 1025 });
// el d'un amic de Victor (02/11/2026): també «Paradox», i l'emoji pot venir com a codi
assert.deepEqual(pdSumrare('ggezw\n\nParadox:sunny: (1/20)\n\n4:sunny: (11/165)\n\n3:sunny: (21/337)\n\n2☀️ (58/225)\n\n1<:pdstar:123456789> (150/177)\n241 / 1.025'),
  { rare: { P: [1, 20], 4: [11, 165], 3: [21, 337], 2: [58, 225], 1: [150, 177] }, have: 241, total: 1025 });
// una altra raresa amb nom (wiki: la fila 6 són les ultraentitats i les paradoxes), amb l'emoji darrere
assert.deepEqual(pdSumrare('Ultra Beast:ub: (2/11)\nParadox (1/20)\n5 (3/90)\n300 / 1.025').rare, { U: [2, 11], P: [1, 20], 5: [3, 90] });
assert.deepEqual(pdSumrare('UB (2/11)\nMítico (4/22)\n5 (3/90)\n300 / 1.025').rare, { U: [2, 11], 'Mítico': [4, 22], 5: [3, 90] });  // una altra amb nom: tal qual
// torre sense marques, de la 77 en amunt: el preu va x10 (wiki «Kakera Tower/Prices»): pis 951 → 952 × 5.000 × 10
assert.equal(readMudae('El siguiente nivel cuesta 47.600.000\nTienes 5\nArma un piso usando $build <n>', 5000).nf, 951);
assert.equal(readMudae('El siguiente nivel cuesta 4.500.000\nTienes 5\nArma un piso usando $build <n>', 5000).nf, 899);  // torre 75: encara sense x10
// la taula de la wiki (Victor, 21/11/2026): el pis N costa 5.000 × N fins al 912 (torre 76 sencera); el 913, el primer de la torre 77, 45.650.000
const nfOf = c => readMudae(`El siguiente nivel cuesta ${c}\nTienes 5\nArma un piso usando $build <n>`, 5000).nf;
assert.equal(nfOf('4.560.000'), 911);   // pis 912: l'últim sense x10
assert.equal(nfOf('45.650.000'), 912);  // pis 913
assert.equal(nfOf('60.000.000'), 1199); // pis 1.200: l'últim
assert.equal(nfOf('4.505.000'), 900);   // pis 901: primer de la torre 76, sense x10
const cost = built => towerNext({ nf: built, f: [], tv: 5000 }).cost;
assert.equal(cost(911), 4560000); assert.equal(cost(912), 45650000); assert.equal(cost(1199), 60000000);
let cum = 0; for (let b = 0; b < 1200; b++) { cum += cost(b); if (b === 11) assert.equal(cum, 390000); if (b === 899) assert.equal(cum, 2027250000); if (b === 911) assert.equal(cum, 2081640000); }
assert.equal(cum, 17295240000);  // acumulat fins al pis 1.200, com diu la taula
assert.equal(pdSumrare('vlarac\n Krabby x2\n100 / 1.025 - Page 1 / 10'), null);  // una pàgina del $pd no és el sumrare
assert.equal(pdSumrare('Castle 5/8'), null);
console.log('millores: totes les proves passen');
