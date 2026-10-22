#!/usr/bin/env node
// Cài skill / sinh thư mục tài liệu theo cloud. Chạy ở gốc dự án: node .claude/kit/kit.mjs <lệnh>
// Không phụ thuộc package ngoài (chỉ Node >= 18), chạy được trên Windows/macOS/Linux.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const claudeDir = path.resolve(here, '..');
const root = path.resolve(claudeDir, '..');
const P = {
  skills: path.join(claudeDir, 'skills'),
  catalog: path.join(claudeDir, 'skill-catalog'),
  profiles: path.join(here, 'cloud-profiles'),
  registry: path.join(here, 'skill-registry.json'),
  lock: path.join(claudeDir, 'skills.lock.json'),
  docs: path.join(root, 'docs'),
};
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');
const registry = () => readJson(P.registry, { core: [], clouds: {}, conditional: {} });
const lock = () => readJson(P.lock, { clouds: [], skills: {} });

function copyDir(src, dst, { overwrite = false } = {}) {
  const created = [];
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) created.push(...copyDir(s, d, { overwrite }));
    else if (overwrite || !fs.existsSync(d)) { fs.copyFileSync(s, d); created.push(d); }
  }
  return created;
}
const rel = (p) => path.relative(root, p).split(path.sep).join('/');

function allSkills() {
  const list = (dir, where) => fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'SKILL.md'))).map(e => ({ name: e.name, where }))
    : [];
  return [...list(P.skills, 'active'), ...list(P.catalog, 'catalog')];
}

function installSkill(name, reason = '') {
  const active = path.join(P.skills, name), inCatalog = path.join(P.catalog, name);
  const l = lock();
  if (fs.existsSync(active)) { console.log(`= ${name}: đã bật`); return true; }
  if (!fs.existsSync(inCatalog)) { console.error(`! ${name}: không có trong .claude/skill-catalog (dùng find-skills nếu là skill ngoài)`); return false; }
  copyDir(inCatalog, active);
  l.skills[name] = { source: 'catalog', reason, at: new Date().toISOString().slice(0, 10) };
  writeJson(P.lock, l);
  console.log(`+ ${name}: đã bật${reason ? ' (' + reason + ')' : ''}`);
  return true;
}

function addCloud(name) {
  const src = path.join(P.profiles, name);
  if (!fs.existsSync(src)) { console.error(`! Không có profile '${name}'. Có: ${fs.readdirSync(P.profiles).join(', ')}`); return false; }
  const prof = readJson(path.join(src, 'profile.json'), {});
  const made = fs.existsSync(path.join(src, 'docs')) ? copyDir(path.join(src, 'docs'), P.docs) : [];
  for (const f of prof.folders || []) { fs.mkdirSync(path.join(root, f), { recursive: true }); const k = path.join(root, f, '.gitkeep'); if (!fs.existsSync(k) && !fs.readdirSync(path.join(root, f)).length) fs.writeFileSync(k, ''); }
  const l = lock(); if (!l.clouds.includes(name)) l.clouds.push(name); writeJson(P.lock, l);
  console.log(`+ cloud ${name} (${prof.label || name}): ${made.length} file tài liệu mới, ${(prof.folders || []).length} thư mục`);
  if (prof.status === 'sample') console.log(`  ! Cloud '${name}' là BẢN MẪU: template tài liệu và skill starter v0.1, chưa được review. Cần người có kinh nghiệm cloud này rà lại trước khi dùng cho khách.`);
  if (prof.status === 'template-only') console.log(`  i Cloud '${name}' chỉ có template tài liệu, chưa có skill riêng (dùng skill core).`);
  for (const s of prof.skills || []) installSkill(s, `cloud ${name}`);
  return true;
}


// ---- detect: quét tài liệu text, khớp signals trong registry (không dùng AI, chỉ từ khóa) ----
const TEXT_EXT = new Set(['.md', '.txt', '.csv', '.json', '.yml', '.yaml', '.html']);
function scanDocs() {
  const files = [], skipped = [];
  const walk = (p) => {
    if (!fs.existsSync(p)) return;
    const st = fs.statSync(p);
    if (st.isDirectory()) return fs.readdirSync(p).forEach(n => walk(path.join(p, n)));
    const base = path.basename(p);
    if (/^(README|BRD-summary-template)\.md$/.test(base)) return;            // template của kit, bỏ qua
    (TEXT_EXT.has(path.extname(p).toLowerCase()) ? files : skipped).push(p);
  };
  ['brd', 'fsd', '00-overview.md'].forEach(n => walk(path.join(P.docs, n)));
  return { files, skipped };
}
function detect(apply) {
  const reg = registry(), generic = new Set(reg.generic || []);
  const { files, skipped } = scanDocs();
  const hits = {}; // signal -> [{file,count}]
  const texts = files.map(f => [f, fs.readFileSync(f, 'utf8')]);
  const all = new Set([...Object.values(reg.clouds).flatMap(c => c.signals), ...Object.values(reg.conditional).flatMap(c => c.signals)]);
  for (const sig of all) {
    const re = new RegExp('(^|[^a-z0-9])' + sig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[ \\-_]+') + '([^a-z0-9]|$)', 'gi');
    for (const [f, t] of texts) { const n = (t.match(re) || []).length; if (n) (hits[sig] ||= []).push({ file: rel(f), n }); }
  }
  const verdict = (signals) => {
    const found = signals.filter(s => hits[s]);
    const strong = found.filter(s => !generic.has(s));
    return { found, ok: strong.length >= 1 || found.length >= 3 };
  };
  const plan = [];
  for (const [id, c] of Object.entries(reg.clouds)) { const v = verdict(c.signals); if (v.found.length) plan.push({ kind: 'cloud', id, label: c.label, ...v }); }
  for (const [id, c] of Object.entries(reg.conditional)) {
    if (reg.core.includes(id)) continue;
    const v = verdict(c.signals); if (v.found.length) plan.push({ kind: 'skill', id, label: id, also: c.also || [], ...v });
  }
  console.log(`Đã quét ${files.length} file text trong docs/brd, docs/fsd, 00-overview.md`);
  if (skipped.length) console.log(`Bỏ qua ${skipped.length} file không phải text (pdf/docx...): ${skipped.map(rel).join(', ')}\n  -> dùng /setup-skills trong Claude Code để đọc chúng hoặc NotebookLM.`);
  if (!plan.length) { console.log('Chưa thấy tín hiệu nào. Bỏ BRD/FSD (md/txt) vào docs/brd, docs/fsd rồi chạy lại.'); return; }
  const lock0 = lock(), lines = ['# Skill plan (sf-kit detect)', '', 'Tạo bằng so khớp từ khóa, chưa phải phán đoán của agent. Rà lại bằng /setup-skills nếu cần.', '', '| Hạng mục | Loại | Kết luận | Bằng chứng |', '|---|---|---|---|'];
  for (const p of plan) {
    const ev = p.found.map(s => `${s} (${hits[s].map(h => `${h.file}×${h.n}`).join(', ')})`).join('; ');
    const state = p.ok ? 'Đề xuất bật' : 'Cần xác nhận (tín hiệu yếu)';
    console.log(`${p.ok ? '[+]' : '[?]'} ${p.kind} ${p.id}: ${ev}`);
    lines.push(`| ${p.id} | ${p.kind} | ${state} | ${ev} |`);
    if (apply && p.ok) {
      if (p.kind === 'cloud') addCloud(p.id);
      else { installSkill(p.id, 'detect: ' + p.found.join(', ')); (p.also || []).forEach(a => installSkill(a, `đi kèm ${p.id}`)); }
    }
  }
  if (apply) { fs.writeFileSync(path.join(P.docs, 'skill-plan.md'), lines.join('\n') + '\n'); console.log('Đã ghi docs/skill-plan.md'); }
  else console.log('\n(Chỉ xem trước. Thêm --apply để bật: node .claude/kit/kit.mjs detect --apply)');
}

// ---- mockup: làm thật trong source dự án (không có thư mục prototype riêng). App "Mockup", mỗi màn hình = LWC thật + App Page + Tab ----
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const XMLH = '<?xml version="1.0" encoding="UTF-8"?>\n';
const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';
const TPL = path.join(here, 'mockup-templates');
const pkgPath = () => ((readJson(path.join(root, 'sfdx-project.json'), {}).packageDirectories || []).find(d => d.default) || { path: 'force-app' }).path;
const SRC = () => path.join(root, pkgPath(), 'main/default');
const cap = (x) => x[0].toUpperCase() + x.slice(1);
const templates = () => fs.existsSync(TPL) ? fs.readdirSync(TPL, { withFileTypes: true }).filter(e => e.isDirectory() && e.name !== 'mockDataProvider').map(e => e.name) : [];
function writeNew(f, content) { // không ghi đè file đã có (người dùng có thể đã sửa)
  if (fs.existsSync(f)) return false;
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); return true;
}
const flexiXml = (s) => `${XMLH}<FlexiPage ${NS}>
    <flexiPageRegions>
        <itemInstances>
            <componentInstance>
                <componentName>c:${s.name}</componentName>
                <identifier>c_${s.name}</identifier>
            </componentInstance>
        </itemInstances>
        <mode>Replace</mode>
        <name>main</name>
        <type>Region</type>
    </flexiPageRegions>
    <masterLabel>Mockup - ${esc(s.label)}</masterLabel>
    <template>
        <name>flexipage:defaultAppHomeTemplate</name>
    </template>
    <type>AppPage</type>
</FlexiPage>
`;
const tabXml = (s) => `${XMLH}<CustomTab ${NS}>
    <flexiPage>Mockup_${s.name}</flexiPage>
    <label>${esc(s.label)}</label>
    <motif>Custom9: Building</motif>
</CustomTab>
`;
const tabLine = (t) => `    <tabs>${t}</tabs>\n`;
const permLine = (t) => `    <tabSettings>\n        <tab>${t}</tab>\n        <visibility>Visible</visibility>\n    </tabSettings>\n`;
const appXml = (name, label, tabs) => `${XMLH}<CustomApplication ${NS}>
    <brand>
        <headerColor>#7F8DE1</headerColor>
        <shouldOverrideOrgTheme>false</shouldOverrideOrgTheme>
    </brand>
    <description>${name === 'Mockup' ? 'App mockup: các màn hình dựng sớm để demo cho khách, là code thật trong dự án.' : 'Tách từ app Mockup.'}</description>
    <formFactors>Large</formFactors>
    <isNavAutoTempTabsDisabled>false</isNavAutoTempTabsDisabled>
    <isNavPersonalizationDisabled>false</isNavPersonalizationDisabled>
    <isNavTabPersistenceDisabled>false</isNavTabPersistenceDisabled>
    <isOmniPinnedViewEnabled>false</isOmniPinnedViewEnabled>
    <label>${esc(label)}</label>
${tabs.map(tabLine).join('')}    <uiType>Lightning</uiType>
    <navType>Standard</navType>
</CustomApplication>
`;
const permXml = (app, label, tabs) => `${XMLH}<PermissionSet ${NS}>
    <applicationVisibilities>
        <application>${app}</application>
        <visible>true</visible>
    </applicationVisibilities>
    <hasActivationRequired>false</hasActivationRequired>
    <label>${esc(label)} Access</label>
${tabs.map(permLine).join('')}</PermissionSet>
`;
function insertBefore(file, markers, text, already) { // thêm vào file đã có mà không đụng phần người dùng sửa
  let t = fs.readFileSync(file, 'utf8'); if (t.includes(already)) return false;
  const m = markers.find(x => t.includes(x)); if (!m) return false;
  fs.writeFileSync(file, t.replace(m, text + m)); return true;
}
function syncApi(dir) { // đồng bộ apiVersion của component copy từ template theo sourceApiVersion của dự án
  const v = readJson(path.join(root, 'sfdx-project.json'), {}).sourceApiVersion; if (!v) return;
  for (const e of fs.readdirSync(dir)) if (e.endsWith('.js-meta.xml')) { const q = path.join(dir, e); fs.writeFileSync(q, fs.readFileSync(q, 'utf8').replace(/<apiVersion>[^<]*<\/apiVersion>/, `<apiVersion>${v}</apiVersion>`)); }
}
function ensureBase() { // app + permission set + mockDataProvider (chỉ tạo nếu chưa có)
  const d = SRC();
  writeNew(path.join(d, 'applications', 'Mockup.app-meta.xml'), appXml('Mockup', 'Mockup', []));
  writeNew(path.join(d, 'permissionsets', 'Mockup_Access.permissionset-meta.xml'), permXml('Mockup', 'Mockup', []));
  const mdp = path.join(d, 'lwc', 'mockDataProvider');
  if (!fs.existsSync(mdp) && fs.existsSync(path.join(TPL, 'mockDataProvider'))) { copyDir(path.join(TPL, 'mockDataProvider'), mdp); syncApi(mdp); console.log(`+ ${rel(mdp)} (service dữ liệu giả, thay bằng Apex thật khi làm chính thức)`); }
}
const deployHint = (alias, mArgs) => console.log(`\nDeploy (CHỈ sandbox, không bao giờ Production):\n  sf project deploy validate ${mArgs} -o ${alias || '<alias-sandbox>'}   (chạy thử)\n  sf project deploy start    ${mArgs} -o ${alias || '<alias-sandbox>'}\n  sf org assign permset -n Mockup_Access -o ${alias || '<alias-sandbox>'}   (lần đầu)\nRồi mở App Launcher, chọn app "Mockup". Chưa thử deploy trên org thật: nếu lỗi metadata, gửi thông báo lỗi để sửa.`);
const mflag = (names) => names.map(n => `-m "${n}"`).join(' ');

function addScreen(tpl, name, label, alias) {
  if (!tpl || !name) return console.error('Dùng: mockup add <template> <tênMànHình> [--label "Tên hiển thị"] [-o alias]\nXem template: mockup templates');
  if (!templates().includes(tpl)) return console.error(`! Không có template '${tpl}'. Có: ${templates().join(', ') || '(chưa có; chạy sf-kit init)'}`);
  if (!/^[a-z][A-Za-z0-9]*$/.test(name)) return console.error('! Tên màn hình phải là camelCase, bắt đầu bằng chữ thường (ví dụ orderList).');
  const d = SRC(), dest = path.join(d, 'lwc', name);
  if (fs.existsSync(dest)) return console.error(`! Đã có LWC '${name}' tại ${rel(dest)}.`);
  ensureBase();
  const kebab = (x) => x.replace(/([A-Z])/g, '-$1').toLowerCase();
  const reA = new RegExp(`\\b${tpl}\\b`, 'g'), reB = new RegExp(`\\b${cap(tpl)}\\b`, 'g'), reC = new RegExp(`c-${kebab(tpl)}\\b`, 'g');
  const walk = (src, dst) => {
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
      const to = path.join(dst, e.name.startsWith(tpl) ? name + e.name.slice(tpl.length) : e.name), from = path.join(src, e.name);
      if (e.isDirectory()) walk(from, to);
      else fs.writeFileSync(to, fs.readFileSync(from, 'utf8').replace(reA, name).replace(reB, cap(name)).replace(reC, `c-${kebab(name)}`));
    }
  };
  walk(path.join(TPL, tpl), dest);
  const metaF = path.join(dest, name + '.js-meta.xml');
  if (label && fs.existsSync(metaF)) fs.writeFileSync(metaF, fs.readFileSync(metaF, 'utf8').replace(/<masterLabel>[^<]*<\/masterLabel>/, `<masterLabel>${esc(label)}</masterLabel>`));
  syncApi(dest);
  const finalLabel = label || ((fs.readFileSync(metaF, 'utf8').match(/<masterLabel>([^<]*)<\/masterLabel>/) || [])[1]) || name;
  const sc = { name, label: finalLabel }, tab = `Mockup_${name}`;
  writeNew(path.join(d, 'flexipages', `${tab}.flexipage-meta.xml`), flexiXml(sc));
  writeNew(path.join(d, 'tabs', `${tab}.tab-meta.xml`), tabXml(sc));
  insertBefore(path.join(d, 'applications', 'Mockup.app-meta.xml'), ['    <uiType>', '</CustomApplication>'], tabLine(tab), `<tabs>${tab}</tabs>`);
  insertBefore(path.join(d, 'permissionsets', 'Mockup_Access.permissionset-meta.xml'), ['</PermissionSet>'], permLine(tab), `<tab>${tab}</tab>`);
  console.log(`+ Màn hình "${finalLabel}": LWC ${rel(dest)} + App Page + Tab ${tab}, đã gắn vào app Mockup`);
  const ig = path.join(root, '.forceignore');
  if (!fs.existsSync(ig) || !/__tests__/.test(fs.readFileSync(ig, 'utf8'))) console.log('! .forceignore chưa loại `**/__tests__/**`: thêm dòng này để thư mục test Jest không bị deploy.');
  deployHint(alias, mflag([`LightningComponentBundle:${name}`, 'LightningComponentBundle:mockDataProvider', `FlexiPage:${tab}`, `CustomTab:${tab}`, 'CustomApplication:Mockup', 'PermissionSet:Mockup_Access']));
}
function renameApp(label, alias) {
  const f = path.join(SRC(), 'applications', 'Mockup.app-meta.xml');
  if (!label) return console.error('Dùng: mockup rename --label "Tên mới"');
  if (!fs.existsSync(f)) return console.error('! Chưa có app Mockup. Chạy `mockup add ...` trước.');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/<label>[^<]*<\/label>/, `<label>${esc(label)}</label>`));
  console.log(`+ Đã đổi tên hiển thị của app thành "${label}" (API name vẫn là Mockup; mọi màn hình giữ nguyên).`);
  deployHint(alias, mflag(['CustomApplication:Mockup']));
}
function splitApp(newApp, csv, label, alias) { // kéo một số màn hình ra app riêng
  if (!newApp || !csv) return console.error('Dùng: mockup split <TênAppMới> --screens a,b [--label "Tên hiển thị"]');
  if (!/^[A-Z][A-Za-z0-9_]*$/.test(newApp)) return console.error('! Tên app (API name) nên bắt đầu bằng chữ hoa, không dấu cách (ví dụ OrderApp).');
  const d = SRC(), appF = path.join(d, 'applications', 'Mockup.app-meta.xml'), permF = path.join(d, 'permissionsets', 'Mockup_Access.permissionset-meta.xml');
  if (!fs.existsSync(appF)) return console.error('! Chưa có app Mockup.');
  const newF = path.join(d, 'applications', `${newApp}.app-meta.xml`);
  if (fs.existsSync(newF)) return console.error(`! App ${newApp} đã tồn tại.`);
  const tabs = csv.split(',').map(x => x.trim()).filter(Boolean).map(n => `Mockup_${n}`);
  const cur = fs.readFileSync(appF, 'utf8'), miss = tabs.filter(t => !cur.includes(`<tabs>${t}</tabs>`));
  if (miss.length) return console.error(`! Không có trong app Mockup: ${miss.join(', ')}`);
  writeNew(newF, appXml(newApp, label || newApp, tabs));
  writeNew(path.join(d, 'permissionsets', `${newApp}_Access.permissionset-meta.xml`), permXml(newApp, label || newApp, tabs));
  for (const f of [appF, permF]) if (fs.existsSync(f)) { let t = fs.readFileSync(f, 'utf8'); for (const tab of tabs) t = t.replace(new RegExp(`\\s*<tabs>${tab}</tabs>`), '').replace(new RegExp(`\\s*<tabSettings>\\s*<tab>${tab}</tab>[\\s\\S]*?</tabSettings>`), ''); fs.writeFileSync(f, t); }
  console.log(`+ App ${newApp} (${label || newApp}) nhận ${tabs.length} màn hình; đã gỡ chúng khỏi app Mockup. Tab/App Page giữ tên Mockup_<màn hình> (tên nội bộ, không ảnh hưởng người dùng).`);
  deployHint(alias, mflag([`CustomApplication:${newApp}`, 'CustomApplication:Mockup', `PermissionSet:${newApp}_Access`, 'PermissionSet:Mockup_Access']));
  console.log(`  (assign permset: sf org assign permset -n ${newApp}_Access)`);
}
function mockupCmd() {
  const pos = args.filter((a, i) => !a.startsWith('-') && !(args[i - 1] || '').startsWith('-')), sub = pos[0], alias = flag('-o') || flag('--org');
  if (sub === 'add') return addScreen(pos[1], pos[2], flag('--label'), alias);
  if (sub === 'rename') return renameApp(flag('--label'), alias);
  if (sub === 'split') return splitApp(pos[1], flag('--screens'), flag('--label'), alias);
  if (sub === 'templates') return console.log('Template: ' + (templates().join(', ') || '(chưa có; chạy sf-kit init)'));
  console.log(`mockup: làm thẳng vào source dự án (${pkgPath()}/main/default), chỉ khác là các màn hình nằm trong app tên "Mockup".\n  mockup templates                                   liệt kê template (${templates().join(', ')})\n  mockup add <template> <tênMànHình> [--label ".."]  tạo LWC + App Page + Tab, gắn vào app Mockup\n  mockup rename --label "Tên mới"                    đổi tên hiển thị app\n  mockup split <TênApp> --screens a,b [--label ".."] kéo màn hình ra app riêng\n  thêm -o <alias> để in sẵn lệnh deploy cho org đó`);
}

const [cmd, ...args] = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
switch (cmd) {
  case 'init': { // bootstrap gọi: bật core + cloud đã chọn
    const names = args.includes('--all') ? allSkills().map(s => s.name) : registry().core;
    for (const s of names) installSkill(s, args.includes('--all') ? 'all-skills' : 'core');
    const clouds = (flag('--clouds') || '').split(',').map(s => s.trim()).filter(Boolean);
    for (const c of clouds) addCloud(c);
    break;
  }
  case 'add-cloud': args.forEach(addCloud); break;
  case 'detect': detect(args.includes('--apply')); break;
  case 'mockup': mockupCmd(); break;
  case 'install': { // install <skill...> [--reason "..."]
    const reason = flag('--reason') || '';
    args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--reason').forEach(s => installSkill(s, reason));
    break;
  }
  case 'list': {
    const l = lock(), reg = registry();
    console.log('Cloud đã bật :', l.clouds.join(', ') || '(chưa có)');
    console.log('Cloud có sẵn :', fs.existsSync(P.profiles) ? fs.readdirSync(P.profiles).join(', ') : '-');
    for (const s of allSkills()) console.log(`${s.where === 'active' ? '[x]' : '[ ]'} ${s.name}${reg.core.includes(s.name) ? '  (core)' : ''}`);
    break;
  }
  case 'registry': console.log(JSON.stringify(registry(), null, 2)); break; // agent đọc để khớp signals
  default:
    console.log('Dùng: node .claude/kit/kit.mjs <init [--clouds a,b] [--all] | add-cloud <cloud...> | install <skill...> [--reason "..."] | detect [--apply] | mockup <add|rename|split|templates> | list | registry>');
}
