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
    console.log('Dùng: node .claude/kit/kit.mjs <init [--clouds a,b] [--all] | add-cloud <cloud...> | install <skill...> [--reason "..."] | detect [--apply] | list | registry>');
}
