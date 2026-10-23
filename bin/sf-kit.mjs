#!/usr/bin/env node
// sf-kit: chạy TRONG thư mục dự án (giống `npm install` sinh node_modules).
//   sf-kit init [--clouds a,b] [--all-skills] [--detect] [--with-template]   thêm .claude/, docs/, CLAUDE.md... vào dự án CÓ SẴN (không ghi đè; --with-template mới copy thêm source mẫu)
//   sf-kit mockup add <template> <tênMànHình> | rename | split | templates   làm mockup thẳng trong source dự án, gom trong app "Mockup"
//   sf-kit upgrade [--pull] [--dry-run]                     cập nhật dự án lên kit mới (--pull: git pull kit trước; ghi đè file kit có backup; CLAUDE.md gộp 3 chiều, xung đột/settings.json ghi bản .new)
//   sf-kit install-global                                 cài lệnh /sf-init và /sf-kit cho Claude Code (một lần/máy)
//   sf-kit detect [--apply]                                 quét docs/brd, docs/fsd, tìm cloud/skill cần bật
//   sf-kit add-cloud <cloud...> | install <skill...> | list | registry
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const COLOR = !process.env.NO_COLOR && (process.env.FORCE_COLOR || (process.stdout.isTTY && process.env.TERM !== 'dumb'));
const ansi = (code, s) => COLOR ? `\x1b[${code}m${s}\x1b[0m` : s;
const paint = (line, err) => {
  if (!COLOR) return line;
  let m;
  const body = (s) => s
    .replace(/sf-kit v[\d.]+/g, (x) => ansi('1;35', x))
    .replace(/`([^`]+)`/g, (_, x) => ansi('36', x))
    .replace(/\[x\]/g, ansi('1;32', '[x]'))
    .replace(/(\d+) file mới/g, (_, n) => ansi('1;32', n) + ' file mới')
    .replace(/(\d+) file đã có/g, (_, n) => ansi('2', n + ' file đã có'));
  if ((m = line.match(/^(\s*)>> (Tiếp theo.*)$/))) return m[1] + ansi('1;33', '>>') + ' ' + ansi('1', body(m[2]));
  if ((m = line.match(/^(\s*)>> (.*)$/))) return m[1] + ansi('1;36', '>>') + ' ' + body(m[2]);
  if ((m = line.match(/^(\s*)\+ ([^:]+)(:.*)?$/))) return m[1] + ansi('1;32', '+') + ' ' + ansi('32', m[2]) + (m[3] ? ansi('2', body(m[3])) : '');
  if ((m = line.match(/^(\s*)! (.*)$/))) return m[1] + ansi(err ? '1;31' : '1;33', '!') + ' ' + ansi(err ? '31' : '33', m[2]);
  if ((m = line.match(/^(\s*)= (.*)$/))) return m[1] + ansi('2', '= ' + m[2]);
  if ((m = line.match(/^(\s*)~ (.*)$/))) return m[1] + ansi('1;34', '~') + ' ' + ansi('34', m[2]);
  if ((m = line.match(/^## (v[\d.]+.*)$/))) return ansi('1;35', '## ' + m[1]);
  if ((m = line.match(/^(\s*)- (.*)$/))) return m[1] + ansi('2', '-') + ' ' + body(m[2]);
  if (/^\s*\[ \]/.test(line)) return ansi('2', line);
  return body(line);
};
const banner = (title) => console.log('\n' + ansi('1;35', '== ' + title + ' ' + '='.repeat(Math.max(3, 56 - title.length))) + '\n');
for (const k of ['log', 'error']) {
  const orig = console[k].bind(console);
  console[k] = (...a) => orig(...a.map((x) => (typeof x === 'string' ? x.split('\n').map((l) => paint(l, k === 'error')).join('\n') : x)));
}

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = process.cwd();
const [cmd = 'help', ...args] = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const has = (n) => args.includes(n);

function copyTree(src, dst, stats) {
  if (!fs.existsSync(src)) return;
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const n of fs.readdirSync(src)) copyTree(path.join(src, n), path.join(dst, n), stats);
  } else if (fs.existsSync(dst)) stats.skipped++;
  else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); stats.created++; }
}
function copyTemplated(src, dst, vars, stats) { // file có placeholder {{...}}
  if (fs.existsSync(dst)) { stats.skipped++; return; }
  let t = fs.readFileSync(src, 'utf8');
  for (const [k, v] of Object.entries(vars)) t = t.split(k).join(v);
  fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, t); stats.created++;
}
const kitVersion = () => (fs.readFileSync(path.join(KIT, 'package.json'), 'utf8').match(/"version":\s*"([^"]+)"/) || [])[1] || '0.0.0';
const semver = (v) => String(v).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
const newer = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
const norm = (b) => b.toString('utf8').replace(/\r\n/g, '\n');
function syncTree(src, dst, ctx) { // ghi đè file kit đổi nội dung; file chỉ có ở dự án (vd project-*) giữ nguyên
  if (!fs.existsSync(src)) return;
  if (fs.statSync(src).isDirectory()) { for (const n of fs.readdirSync(src)) syncTree(path.join(src, n), path.join(dst, n), ctx); return; }
  const rel = path.relative(cwd, dst).split(path.sep).join('/');
  if (path.basename(src) === 'README.md' && dst.includes('mockup-templates')) return;
  if (!fs.existsSync(dst)) { ctx.added.push(rel); if (!ctx.dry) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); } return; }
  if (norm(fs.readFileSync(src)) === norm(fs.readFileSync(dst))) return;
  ctx.updated.push(rel);
  if (ctx.dry) return;
  const bak = path.join(ctx.backup, rel); fs.mkdirSync(path.dirname(bak), { recursive: true }); fs.copyFileSync(dst, bak);
  fs.copyFileSync(src, dst);
}
function proposeFile(content, dst, ctx) { // file team hay sửa: không ghi đè, chỉ ghi bản .new để gộp tay
  const rel = path.relative(cwd, dst).split(path.sep).join('/');
  if (!fs.existsSync(dst)) { ctx.added.push(rel); if (!ctx.dry) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, content); } return; }
  if (norm(fs.readFileSync(dst)) === norm(content)) return;
  ctx.merge.push(rel);
  if (!ctx.dry) fs.writeFileSync(dst + '.new', content);
}
function mergeClaudeMd(content, ctx) { // gộp 3 chiều: bản kit lúc init/upgrade trước (base) + CLAUDE.md hiện tại + bản kit mới
  const dst = path.join(cwd, 'CLAUDE.md'), baseFile = path.join(cwd, '.claude/kit/CLAUDE.base.md');
  const saveBase = () => { if (!ctx.dry) { fs.mkdirSync(path.dirname(baseFile), { recursive: true }); fs.writeFileSync(baseFile, content); } };
  if (!fs.existsSync(dst)) { ctx.added.push('CLAUDE.md'); if (!ctx.dry) fs.writeFileSync(dst, content); saveBase(); return; }
  const cur = norm(fs.readFileSync(dst));
  if (cur === norm(content)) { saveBase(); return; }
  if (fs.existsSync(baseFile)) {
    const tmp = path.join(os.tmpdir(), 'sf-kit-merge-' + process.pid); fs.mkdirSync(tmp, { recursive: true });
    const [a, b, c] = ['cur.md', 'base.md', 'new.md'].map(n => path.join(tmp, n));
    fs.writeFileSync(a, cur); fs.writeFileSync(b, norm(fs.readFileSync(baseFile))); fs.writeFileSync(c, norm(content));
    const r = spawnSync('git', ['merge-file', '-p', '-L', 'dự án', '-L', 'kit cũ', '-L', 'kit mới', a, b, c], { encoding: 'utf8' });
    fs.rmSync(tmp, { recursive: true, force: true });
    if (!r.error && r.status === 0) {
      if (r.stdout === cur) { saveBase(); return; }
      ctx.merged.push('CLAUDE.md (gộp tự động, không xung đột)');
      if (!ctx.dry) { const bak = path.join(ctx.backup, 'CLAUDE.md'); fs.mkdirSync(path.dirname(bak), { recursive: true }); fs.copyFileSync(dst, bak); fs.writeFileSync(dst, r.stdout); }
      saveBase(); return;
    }
    if (!r.error && r.status > 0 && r.status < 100) {
      ctx.merge.push('CLAUDE.md (' + r.status + ' chỗ xung đột, xem dấu <<<<<<< trong CLAUDE.md.new)');
      if (!ctx.dry) { fs.writeFileSync(dst + '.new', r.stdout); saveBase(); }
      return;
    }
  }
  const have = new Set(cur.split('\n').map(l => l.trim()).filter(Boolean));
  const missing = norm(content).split('\n').filter(l => l.trim() && !have.has(l.trim()) && !l.includes('<Điền') && !/^#{1,6}\s/.test(l));
  if (!missing.length) { saveBase(); return; }
  ctx.merged.push('CLAUDE.md (chưa có bản base: thêm ' + missing.length + ' dòng mới của kit vào cuối file, cần rà lại)');
  if (!ctx.dry) {
    const bak = path.join(ctx.backup, 'CLAUDE.md'); fs.mkdirSync(path.dirname(bak), { recursive: true }); fs.copyFileSync(dst, bak);
    fs.writeFileSync(dst, cur.replace(/\n*$/, '\n') + '\n## Quy tắc mới từ sf-kit (rà lại và chuyển vào đúng mục)\n' + missing.join('\n') + '\n');
  }
  saveBase();
}
function printChangelog(from) {
  const text = fs.readFileSync(path.join(KIT, 'CHANGELOG.md'), 'utf8');
  const parts = text.split(/^## (?=v\d)/m).slice(1).filter(p => newer(p.split('\n')[0].trim(), from));
  if (parts.length) console.log('\n>> Thay đổi của kit từ ' + from + ':\n' + parts.map(p => '## ' + p.trimEnd()).join('\n'));
}
const runKit = (a) => spawnSync(process.execPath, [path.join(cwd, '.claude/kit/kit.mjs'), ...a], { stdio: 'inherit', cwd }).status ?? 1;

if (cmd === 'init') {
  const name = path.basename(cwd);
  const version = (fs.readFileSync(path.join(KIT, 'package.json'), 'utf8').match(/"version":\s*"([^"]+)"/) || [])[1] || '0.0.0';
  const s = { created: 0, skipped: 0 };
  banner('sf-kit init');
  console.log(`>> sf-kit v${version}: khởi tạo trong ${cwd}`);
  if (has('--with-template')) copyTree(path.join(KIT, 'starter-kit/project-template'), cwd, s); // chỉ khi dự án trống
  copyTree(path.join(KIT, 'claude/skills'),   path.join(cwd, '.claude/skill-catalog'), s);
  copyTree(path.join(KIT, 'claude/commands'), path.join(cwd, '.claude/commands'), s);
  copyTree(path.join(KIT, 'claude/agents'),   path.join(cwd, '.claude/agents'), s);
  copyTree(path.join(KIT, 'claude/kit'),      path.join(cwd, '.claude/kit'), s);
  fs.mkdirSync(path.join(cwd, '.claude/skills'), { recursive: true });
  fs.copyFileSync(path.join(KIT, 'claude/skill-registry.json'), path.join(cwd, '.claude/kit/skill-registry.json')); // registry luôn theo kit
  copyTree(path.join(KIT, 'cloud-profiles'),  path.join(cwd, '.claude/kit/cloud-profiles'), s);
  copyTree(path.join(KIT, 'claude/settings.template.json'), path.join(cwd, '.claude/settings.json'), s);
  copyTemplated(path.join(KIT, 'claude/mcp.template.json'), path.join(cwd, '.mcp.json'),
    { '{{ORG_ALIAS}}': name, '{{JIRA_URL}}': process.env.JIRA_URL || 'https://your-company.atlassian.net', '{{JIRA_USERNAME}}': process.env.JIRA_USERNAME || 'you@company.com' }, s);
  copyTemplated(path.join(KIT, 'claude/CLAUDE.template.md'), path.join(cwd, 'CLAUDE.md'), { '{{TÊN_DỰ_ÁN}}': name }, s);
  if (!fs.existsSync(path.join(cwd, '.claude/kit/CLAUDE.base.md'))) fs.writeFileSync(path.join(cwd, '.claude/kit/CLAUDE.base.md'), fs.readFileSync(path.join(KIT, 'claude/CLAUDE.template.md'), 'utf8').split('{{TÊN_DỰ_ÁN}}').join(name));
  copyTree(path.join(KIT, 'project-context-template'), path.join(cwd, 'docs'), s);
  fs.mkdirSync(path.join(cwd, 'docs/notes'), { recursive: true });
  copyTree(path.join(KIT, 'claude/mcp/README.md'), path.join(cwd, 'docs/mcp-setup.md'), s);
  copyTree(path.join(KIT, 'mockup-kit/lwc-templates'), path.join(cwd, '.claude/kit/mockup-templates'), s); // template; `mockup add` copy vào source dự án
  fs.rmSync(path.join(cwd, '.claude/kit/mockup-templates/README.md'), { force: true });
  copyTree(path.join(KIT, 'mockup-kit/demo-script-template.md'), path.join(cwd, 'docs/demo-script.md'), s);
  copyTree(path.join(KIT, 'mockup-kit/deploy-prototype.md'), path.join(cwd, 'docs/mockup.md'), s);
  fs.writeFileSync(path.join(cwd, '.kit-version'), `v${version}\n`);
  console.log(`>> ${s.created} file mới, ${s.skipped} file đã có (giữ nguyên)`);
  const clouds = flag('--clouds') || (args.find(a => a.startsWith('--clouds=')) || '').split('=')[1] || '';
  const r = runKit(['init', ...(clouds ? ['--clouds', clouds] : []), ...(has('--all-skills') ? ['--all'] : [])]);
  if (has('--detect')) runKit(['detect', '--apply']);
  console.log('>> Mockup: template nằm ở .claude/kit/mockup-templates. Tạo màn hình thật trong source + app Mockup: node .claude/kit/kit.mjs mockup add listFilterTable orderList --label "Đơn hàng"  (xem docs/mockup.md)');
  console.log(fs.existsSync(path.join(cwd, '.git')) ? '>> Nếu dự án dùng hook deploy của kit (scripts/install-git-hooks.sh) thì chạy nó; không thì bỏ qua.' : '>> Thư mục này chưa có git.');
  console.log('>> Tiếp theo: bỏ BRD/FSD vào docs/brd, docs/fsd; chạy `npx sf-kit detect` (quét nhanh) hoặc `/setup-skills` trong Claude Code (đọc cả PDF/docx/NotebookLM).');
  process.exit(r);
} else if (cmd === 'upgrade') {
  if (has('--pull')) {
    console.log('>> git pull --ff-only trong ' + KIT);
    const p = spawnSync('git', ['-C', KIT, 'pull', '--ff-only'], { stdio: 'inherit' });
    if (p.error || p.status !== 0) { console.error('! git pull thất bại (thư mục kit có thay đổi chưa commit/xung đột, hoặc không có mạng). Xử lý trong thư mục kit rồi chạy lại.'); process.exit(1); }
    process.exit(spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2).filter(a => a !== '--pull')], { stdio: 'inherit', cwd }).status ?? 1);
  }
  if (!fs.existsSync(path.join(cwd, '.claude/kit/kit.mjs'))) { console.error('Chưa khởi tạo. Chạy `sf-kit init` trong thư mục dự án trước.'); process.exit(1); }
  const dry = has('--dry-run'), version = kitVersion();
  const from = (fs.existsSync(path.join(cwd, '.kit-version')) ? fs.readFileSync(path.join(cwd, '.kit-version'), 'utf8').trim() : 'v0.0.0');
  const ctx = { dry, added: [], updated: [], merge: [], merged: [], backup: path.join(cwd, '.claude/.upgrade-backup', new Date().toISOString().replace(/[:.]/g, '-')) };
  banner('sf-kit upgrade');
  console.log(`>> sf-kit upgrade: dự án ${from} -> kit v${version}${dry ? ' (dry-run, không ghi gì)' : ''}`);
  syncTree(path.join(KIT, 'claude/skills'),   path.join(cwd, '.claude/skill-catalog'), ctx);
  const activeDir = path.join(cwd, '.claude/skills');
  for (const n of fs.existsSync(activeDir) ? fs.readdirSync(activeDir) : []) {
    if (!n.startsWith('project-') && fs.existsSync(path.join(KIT, 'claude/skills', n))) syncTree(path.join(KIT, 'claude/skills', n), path.join(activeDir, n), ctx);
  }
  syncTree(path.join(KIT, 'claude/commands'), path.join(cwd, '.claude/commands'), ctx);
  syncTree(path.join(KIT, 'claude/agents'),   path.join(cwd, '.claude/agents'), ctx);
  syncTree(path.join(KIT, 'claude/kit'),      path.join(cwd, '.claude/kit'), ctx);
  syncTree(path.join(KIT, 'claude/skill-registry.json'), path.join(cwd, '.claude/kit/skill-registry.json'), ctx);
  syncTree(path.join(KIT, 'cloud-profiles'),  path.join(cwd, '.claude/kit/cloud-profiles'), ctx);
  syncTree(path.join(KIT, 'mockup-kit/lwc-templates'), path.join(cwd, '.claude/kit/mockup-templates'), ctx);
  const claudeMd = fs.readFileSync(path.join(KIT, 'claude/CLAUDE.template.md'), 'utf8').split('{{TÊN_DỰ_ÁN}}').join(path.basename(cwd));
  mergeClaudeMd(claudeMd, ctx);
  proposeFile(fs.readFileSync(path.join(KIT, 'claude/settings.template.json'), 'utf8'), path.join(cwd, '.claude/settings.json'), ctx);
  if (fs.existsSync(path.join(cwd, 'docs/mockup.md'))) proposeFile(fs.readFileSync(path.join(KIT, 'mockup-kit/deploy-prototype.md'), 'utf8'), path.join(cwd, 'docs/mockup.md'), ctx);
  const show = (t, l) => { if (l.length) console.log(`\n${t} (${l.length}):\n` + l.map(f => '  ' + f).join('\n')); };
  show('+ File mới', ctx.added); show('~ File kit đã cập nhật' + (dry ? ' (sẽ ghi đè)' : ' (bản cũ ở .claude/.upgrade-backup)'), ctx.updated);
  show('= Đã gộp tự động' + (dry ? '' : ' (bản cũ ở .claude/.upgrade-backup)'), ctx.merged);
  show('! Cần gộp tay' + (dry ? '' : ' (đã ghi bản .new cạnh file gốc)'), ctx.merge);
  if (!ctx.added.length && !ctx.updated.length && !ctx.merge.length && !ctx.merged.length) console.log('\n>> Dự án đã khớp kit.');
  printChangelog(from);
  if (!dry) { fs.writeFileSync(path.join(cwd, '.kit-version'), `v${version}\n`); console.log('\n>> Đã cập nhật .kit-version. Gộp các file .new vào file gốc rồi xóa .new; rà git diff trước khi commit.'); }
} else if (cmd === 'install-global') { // cài lệnh /sf-init, /sf-kit vào ~/.claude/commands (một lần cho mỗi máy)
  const dir = path.join(os.homedir(), '.claude', 'commands'); fs.mkdirSync(dir, { recursive: true });
  const kitPath = KIT.split(path.sep).join('/');
  const names = fs.readdirSync(path.join(KIT, 'claude/user-commands')).filter(f => f.endsWith('.md'));
  for (const f of names) fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(KIT, 'claude/user-commands', f), 'utf8').split('{{KIT}}').join(kitPath));
  console.log(`>> Đã cài ${names.map(f => '/' + f.replace(/.md$/, '')).join(', ')} vào ${dir} (kit: ${kitPath}).
>> Mở Claude Code ở thư mục dự án và gõ /sf-init hoặc /sf-kit upgrade. Nếu bạn di chuyển thư mục kit, chạy lại lệnh này.`);
} else if (['detect', 'add-cloud', 'install', 'list', 'registry', 'mockup'].includes(cmd)) {
  if (!fs.existsSync(path.join(cwd, '.claude/kit/kit.mjs'))) { console.error('Chưa khởi tạo. Chạy `sf-kit init` trong thư mục dự án trước.'); process.exit(1); }
  process.exit(runKit([cmd, ...args]));
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 8).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
}
