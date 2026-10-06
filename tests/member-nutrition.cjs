const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'member/index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'member/member-nutrition.js'), 'utf8');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const tick = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };
function fixture(options = {}) {
  const errors = [], calls = [], writes = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://staging.example.invalid/member/', virtualConsole: vc });
  const w = dom.window, d = w.document, el = id => d.getElementById('rm-nutrition-' + id);
  const targets = [
    { nutrient_key: 'energy_kcal', name: 'Calories', unit: 'kcal', minimum: 0, target: 2000, maximum: 2500, source: 'program' },
    { nutrient_key: 'protein_g', name: 'Protein', unit: 'g', minimum: 50, target: 100, maximum: null, source: 'coach' },
    { nutrient_key: 'fat_g', name: 'Fat', unit: 'g', minimum: null, target: 0, maximum: 100, source: 'program' }
  ];
  const day = options.day || { date: today(), totals: { energy_kcal: 200, protein_g: 10, fat_g: 0 }, targets,
    items: [{ id: 'own-item', label: '<img src=x onerror=alert(1)>Synthetic food', meal_slot: 'breakfast', quantity: 2, serving_quantity: 1, serving_unit: 'cup', note: '<script>unsafe</script>', nutrients: { energy_kcal: 200, fat_g: 0 } }] };
  const sources = options.sources || { foods: [{ id: 'food-1', name: 'Published food', brand: 'Brand', serving_size: 2, serving_unit: 'cup', grams_per_serving: 100 }], recipes: [{ id: 'recipe-1', title: 'Published recipe' }] };
  w.RA_MEMBER_CLIENT = { rpc: async (name, args) => {
    calls.push({ name, args });
    if (options.rpc) return options.rpc(name, args);
    if (name === 'get_my_nutrition_day') return { data: { ...day, date: args.p_log_date } };
    if (name === 'get_my_nutrition_sources') return { data: sources };
    if (name === 'get_my_nutrition_trends') return { data: [{ date: today(), totals: { energy_kcal: 200, protein_g: 10, fiber_g: 0, water_g: 50 } }] };
    writes.push(JSON.parse(JSON.stringify({ name, args }))); return { data: name.startsWith('delete') ? true : 'created-id' };
  } };
  w.RA_MEMBER_NUTRITION_ENABLED = options.preloaded === true;
  w.eval(source);
  function event(name, detail) { d.dispatchEvent(new w.CustomEvent(name, { detail })); }
  async function open(enabled = true) {
    d.getElementById('rm-member-content').dataset.activeScreen = 'nutrition';
    event('ra:member-dashboard-loaded', { nutritionEnabled: enabled }); await tick();
  }
  return { dom, w, d, el, calls, writes, errors, event, open, day, sources };
}
test('Nutrition module is allowlisted, cache-versioned and uses the shared client', () => {
  assert(JSON.parse(fs.readFileSync(path.join(root, 'config/public-files.json'))).includes('member/member-nutrition.js'));
  assert.match(html, /member-nutrition\.js\?v=1/); assert.match(html, /member110\.js\?v=213/); assert.match(html, /member110\.css\?v=204/);
  assert.match(source, /window\.RA_MEMBER_CLIENT/); assert.doesNotMatch(source, /createClient/);
  const controller = fs.readFileSync(path.join(root, 'member/member110.js'), 'utf8');
  assert.match(controller, /dispatchEvent\(new CustomEvent\("ra:member-dashboard-loaded",\{detail:\{\s*nutritionEnabled:Boolean\(appAccessResult.data\?\.nutrition_enabled\)/);
  assert.match(controller, /selectors:\["#rm-nutrition-diary-card"/);
});
test('Nutrition waits for authenticated dashboard access and enabled workspace', async () => {
  const f = fixture(); assert.equal(f.calls.length, 0); await f.open(false); assert.equal(f.calls.length, 0); assert(f.el('diary-card').classList.contains('hidden')); f.dom.window.close();
});
test('Nutrition initializes when the dashboard finished before the deferred module loaded', async () => {
  const f = fixture({ preloaded: true });
  f.event('ra:member-screen-changed', { screen: 'nutrition' }); await tick();
  assert.equal(f.calls.length, 3); assert.equal(f.el('summary').children.length, 6);
  f.dom.window.close();
});
test('Nutrition lazy-loads on sidebar navigation and preserves loaded state', async () => {
  const f = fixture(); f.d.getElementById('rm-member-content').dataset.activeScreen = 'home';
  f.event('ra:member-dashboard-loaded', { nutritionEnabled: true }); await tick(); assert.equal(f.calls.length, 0);
  f.event('ra:member-screen-changed', { screen: 'nutrition' }); await tick(); assert.equal(f.calls.length, 3);
  f.event('ra:member-screen-changed', { screen: 'nutrition' }); await tick(); assert.equal(f.calls.length, 3); f.dom.window.close();
});
test('Nutrition renders six core nutrients, real zero and unknown values distinctly', async () => {
  const f = fixture(); await f.open(); assert.equal(f.el('summary').children.length, 6);
  const text = f.el('summary').textContent; assert.match(text, /200 kcal/); assert.match(text, /0 g/); assert.match(text, /Not logged/);
  assert.equal(f.el('full-profile').children.length, 3); assert.deepEqual(f.errors, []); f.dom.window.close();
});
test('Diary groups, hostile labels and notes render as text only', async () => {
  const f = fixture(); await f.open(); assert.equal(f.el('diary-list').querySelectorAll('h3').length, 7);
  assert.match(f.el('diary-list').textContent, /Water \/ Hydration/); assert.match(f.el('diary-list').textContent, /<script>unsafe/);
  assert.equal(f.el('diary-list').querySelectorAll('img,script').length, 0); f.dom.window.close();
});
test('Targets show consumed, minimum/target/maximum, source and measured progress', async () => {
  const f = fixture(); await f.open(); const text = f.el('targets').textContent;
  for (const value of ['Minimum: 0 kcal', 'Target: 2,000 kcal', 'Maximum: 2,500 kcal', '200 kcal logged', '10% of target', 'Coach override', 'Program default']) assert(text.includes(value), value);
  assert.doesNotMatch(text, /NaN|Infinity/); f.dom.window.close();
});
test('Empty sources never expose drafts or enable Add to Diary', async () => {
  const f = fixture({ sources: { foods: [], recipes: [] }, day: { items: [], totals: {}, targets: [] } }); await f.open();
  assert.match(f.el('source-state').textContent, /No published foods or recipes/);
  assert(f.el('log-form').querySelector('button').disabled); assert.match(f.el('targets').textContent, /not configured/);
  assert.doesNotMatch(f.el('summary').textContent, /0 kcal/); f.dom.window.close();
});
test('Food and Recipe choices show serving basis without creating content', async () => {
  const f = fixture(); await f.open(); assert.equal(f.el('source').options.length, 3);
  f.el('source').value = 'food:food-1'; f.el('source').dispatchEvent(new f.w.Event('change')); assert.match(f.el('source-state').textContent, /2 cup \(100 g\)/);
  f.el('source').value = 'recipe:recipe-1'; f.el('source').dispatchEvent(new f.w.Event('change')); assert.match(f.el('source-state').textContent, /one recipe serving/); assert.equal(f.writes.length, 0); f.dom.window.close();
});
test('Date previous, next, Today and picker send the selected calendar day', async () => {
  const f = fixture(); await f.open(); const original = f.el('date').value;
  f.el('prev').click(); await tick(); const previous = f.el('date').value; assert.notEqual(previous, original);
  f.el('next').click(); await tick(); assert.equal(f.el('date').value, original);
  f.el('date').value = '2026-01-02'; f.el('date').dispatchEvent(new f.w.Event('change')); await tick();
  assert.equal(f.calls.filter(c => c.name === 'get_my_nutrition_day').at(-1).args.p_log_date, '2026-01-02');
  f.el('today').click(); await tick(); assert.equal(f.el('date').value, today()); f.dom.window.close();
});
test('Log payload uses own RPC, quantity, meal, source and note without contact identity', async () => {
  const f = fixture(); await f.open(); f.el('source').value = 'recipe:recipe-1'; f.el('quantity').value = '2.5'; f.el('slot').value = 'lunch'; f.el('note').value = '  Test note  ';
  f.el('log-form').dispatchEvent(new f.w.Event('submit', { cancelable: true })); await tick();
  assert.deepEqual(f.writes[0], { name: 'log_my_nutrition_item', args: { p_log_date: today(), p_meal_slot: 'lunch', p_source_type: 'recipe', p_source_id: 'recipe-1', p_quantity: 2.5, p_note: 'Test note' } });
  assert.equal(f.el('note').value, ''); assert.equal(f.el('quantity').value, '1'); f.dom.window.close();
});
test('Invalid quantity and unselected source cannot send diary writes', async () => {
  const f = fixture(); await f.open(); f.el('log-form').dispatchEvent(new f.w.Event('submit')); await tick();
  f.el('source').value = 'food:food-1'; f.el('quantity').value = '0'; f.el('log-form').dispatchEvent(new f.w.Event('submit')); await tick(); assert.equal(f.writes.length, 0); f.dom.window.close();
});
test('Remove uses the selected item ID only and reloads totals', async () => {
  const f = fixture(); await f.open(); f.el('diary-list').querySelector('button').click(); await tick();
  assert.deepEqual(f.writes[0], { name: 'delete_my_nutrition_item', args: { p_item_id: 'own-item' } }); assert.equal(f.calls.filter(c => c.name === 'get_my_nutrition_day').length, 2); f.dom.window.close();
});
test('Seven-day presentation marks missing days instead of fabricated zero totals', async () => {
  const f = fixture(); await f.open(); assert.equal(f.el('trends').children.length, 7);
  assert.equal([...f.el('trends').children].filter(c => c.textContent.includes('No entries')).length, 6);
  assert.match(f.el('trends').textContent, /Fiber: 0 g/); assert.match(f.el('trends').textContent, /Water: 50 g/); f.dom.window.close();
});
test('Failed read clears private data and disables writes with explicit retry', async () => {
  const f = fixture(); await f.open(); f.w.RA_MEMBER_CLIENT.rpc = async () => ({ error: { message: 'Synthetic failure' } });
  f.el('next').click(); await tick(); assert.equal(f.el('diary-list').children.length, 0); assert.equal(f.el('summary').children.length, 0);
  assert.match(f.el('diary-status').textContent, /Synthetic failure/); assert(!f.el('retry').hidden); assert(f.el('log-form').querySelector('button').disabled); f.dom.window.close();
});
test('Delayed old-date response cannot replace the newer selected day', async () => {
  const pending = []; const f = fixture({ rpc: async (name, args) => name === 'get_my_nutrition_day' ? new Promise(resolve => pending.push({ args, resolve })) : { data: name === 'get_my_nutrition_sources' ? { foods: [], recipes: [] } : [] } });
  await f.open(); f.el('prev').click(); await tick(); assert.equal(pending.length, 2);
  pending[1].resolve({ data: { totals: { energy_kcal: 222 }, targets: [], items: [] } }); await tick();
  pending[0].resolve({ data: { totals: { energy_kcal: 999 }, targets: [], items: [] } }); await tick();
  assert.match(f.el('summary').textContent, /222 kcal/); assert.doesNotMatch(f.el('summary').textContent, /999/); f.dom.window.close();
});
test('Sign-out or lifecycle reset clears data and rejects late responses', async () => {
  let resolve; const f = fixture({ rpc: async name => name === 'get_my_nutrition_day' ? new Promise(r => { resolve = r; }) : { data: name === 'get_my_nutrition_sources' ? { foods: [], recipes: [] } : [] } });
  await f.open(); f.event('ra:member-access-reset'); resolve({ data: { totals: { energy_kcal: 999 }, targets: [], items: [] } }); await tick();
  assert.equal(f.el('summary').children.length, 0); assert(f.el('log-form').querySelector('button').disabled); f.dom.window.close();
});
test('In-flight write disables duplicate submission and date switching', async () => {
  const f = fixture(); await f.open(); let finish;
  const original = f.w.RA_MEMBER_CLIENT.rpc;
  f.w.RA_MEMBER_CLIENT.rpc = async (name, args) => name === 'log_my_nutrition_item' ? new Promise(resolve => { f.writes.push({ name, args }); finish = resolve; }) : original(name, args);
  f.el('source').value = 'food:food-1'; f.el('log-form').dispatchEvent(new f.w.Event('submit')); f.el('log-form').dispatchEvent(new f.w.Event('submit')); await tick();
  assert.equal(f.writes.length, 1); assert(f.el('prev').disabled); finish({ data: 'created' }); await tick(); assert(!f.el('prev').disabled); f.dom.window.close();
});
