#!/usr/bin/env node
// sf-kit: chạy TRONG thư mục dự án (giống `npm install` sinh node_modules).
//   sf-kit init [--clouds a,b] [--all-skills] [--detect] [--with-template]   thêm .claude/, docs/, CLAUDE.md... vào dự án CÓ SẴN (không ghi đè; --with-template mới copy thêm source mẫu)
//   sf-kit mockup add <template> <tênMànHình> | rename | split | templates   làm mockup thẳng trong source dự án, gom trong app "Mockup"
//   sf-kit install-global                                   cài lệnh /sf-init cho Claude Code (một lần/máy)
//   sf-kit detect [--apply]                                 quét docs/brd, docs/fsd, tìm cloud/skill cần bật
//   sf-kit add-cloud <cloud...> | install <skill...> | list | registry
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

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
const runKit = (a) => spawnSync(process.execPath, [path.join(cwd, '.claude/kit/kit.mjs'), ...a], { stdio: 'inherit', cwd }).status ?? 1;

if (cmd === 'init') {
  const name = path.basename(cwd);
  const version = (fs.readFileSync(path.join(KIT, 'package.json'), 'utf8').match(/"version":\s*"([^"]+)"/) || [])[1] || '0.0.0';
  const s = { created: 0, skipped: 0 };
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
} else if (cmd === 'install-global') { // cài lệnh /sf-init vào ~/.claude/commands (một lần cho mỗi máy)
  const dir = path.join(os.homedir(), '.claude', 'commands'); fs.mkdirSync(dir, { recursive: true });
  const kitPath = KIT.split(path.sep).join('/');
  const t = fs.readFileSync(path.join(KIT, 'claude/user-commands/sf-init.md'), 'utf8').split('{{KIT}}').join(kitPath);
  fs.writeFileSync(path.join(dir, 'sf-init.md'), t);
  console.log(`>> Đã cài lệnh /sf-init vào ${path.join(dir, 'sf-init.md')} (kit: ${kitPath}).\n>> Mở Claude Code ở thư mục dự án và gõ /sf-init. Nếu bạn di chuyển thư mục kit, chạy lại lệnh này.`);
} else if (['detect', 'add-cloud', 'install', 'list', 'registry', 'mockup'].includes(cmd)) {
  if (!fs.existsSync(path.join(cwd, '.claude/kit/kit.mjs'))) { console.error('Chưa khởi tạo. Chạy `sf-kit init` trong thư mục dự án trước.'); process.exit(1); }
  process.exit(runKit([cmd, ...args]));
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 6).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
}
