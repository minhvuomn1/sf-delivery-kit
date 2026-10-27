# Changelog
## v1.13.1
- Guide: thêm mục "Dùng agent để làm việc" (danh sách 20 agent, gọi riêng một agent, `/orchestrate` và quality gate, cách làm từ issue trong sheet).
## v1.13.0
- Thêm 14 agent theo vai trò (requirements-analyst, solution-architect, data-model-designer, apex-developer, lwc-developer, flow-declarative-developer, integration-developer, experience-cloud-developer, code-reviewer, security-reviewer, qa-uat-engineer, deployment-engineer, documentation-writer, debug-support) và lệnh `/orchestrate` điều phối từ ticket đến deploy có quality gate. Bỏ `apex-test-engineer` vì trùng `test-writer`.
- Chỉnh theo quy ước kit: skill ở `.claude/skills/`, không viết comment trong code (code-reviewer coi là BLOCKER), dùng `test-writer` và `jira-reader`.
## v1.12.0
- Output CLI có màu và tiêu đề (`sf-kit.mjs`, `kit.mjs`): `>>` cyan, `+` xanh lá, `!` vàng/đỏ, `~` xanh dương, `[x]` xanh lá. Chỉ bật khi là terminal; `NO_COLOR=1` tắt, `FORCE_COLOR=1` ép bật.
## v1.11.1
- Sửa hai skill còn trái quy tắc không comment: `apex-test-generator` (SeeAllData=true) và `experience-cloud` (without sharing) giờ ghi lý do trong PR, không ghi trong code.
## v1.11.0
- Lệnh Claude `/sf-kit` (cài bằng `sf-kit install-global`, cài lại để có lệnh mới): `/sf-kit upgrade [--pull] [--dry-run]` chạy dry-run trước, hỏi xác nhận rồi áp dụng và đề xuất cách gộp file `.new`. `install-global` cài mọi lệnh trong `claude/user-commands/`.
## v1.10.0
- Lệnh `sf-kit upgrade [--pull] [--dry-run]`: cập nhật dự án đã init lên kit mới. Ghi đè file kit (skill-catalog, skill đang bật, agents, commands, `.claude/kit/`) và lưu bản cũ ở `.claude/.upgrade-backup/`; giữ `project-*`. `--pull` chạy `git pull --ff-only` trong thư mục kit trước.
- `CLAUDE.md` gộp 3 chiều (base lưu ở `.claude/kit/CLAUDE.base.md`); xung đột ghi `CLAUDE.md.new`. `settings.json` ghi bản `.new`. In CHANGELOG từ `.kit-version` đến bản mới.
- `init` ghi `.claude/kit/CLAUDE.base.md`. Cập nhật `governance/upgrade-guide.md` và guide mục 12.
## v1.9.0
- Quy ước mới: không viết comment trong code (Apex, LWC, test); ID business rule ghi trong tên test. Áp dụng vào CLAUDE.template, apex-conventions, lwc-patterns, tdd-workflow, coding-convention, review-checklist; apex-reviewer coi comment là blocker. Đã gỡ comment khỏi template mockup-kit và TestDataFactory.
- Quy ước refresh: mọi LWC/Apex action đổi dữ liệu phải làm mới giao diện ngay (`refreshApex`, `notifyRecordUpdateAvailable`, `RefreshEvent`, xóa `draftValues`).
- Thêm agent `jira-reader` (chỉ đọc ticket Jira, trả tóm tắt + AC); lệnh `/new-feature` dùng agent này.
## v1.8.0
- Lệnh Claude thay cho lệnh node: `/mockup`, `/mockup-app`, `/kit-status` (trong dự án), `/sf-init` (cài một lần bằng `sf-kit install-global`, ghi vào ~/.claude/commands kèm đường dẫn kit). Các lệnh kit khai báo `allowed-tools` cho `node .claude/kit/kit.mjs`; deploy vẫn cần xác nhận.
## v1.7.1
- Viết lại skill `mockup-prototype` (2.0.0) thành skill tự đủ: quy trình từng màn hình SCR-xx, checklist giao diện, cách chuyển sang chính thức; `references/metadata-templates.md` có sẵn mẫu App/Tab/App Page/Permission Set và lệnh deploy để dùng được cả khi không có `kit.mjs`.
## v1.7.0
- Bỏ thư mục `prototype/` và lệnh `promote`. Mockup làm thẳng vào source dự án: `mockup add <template> <tênMànHình> [--label]` copy template vào `<package>/main/default/lwc`, tạo App Page + Tab, gắn vào Lightning App `Mockup` và permission set `Mockup_Access`; `mockup rename --label` đổi tên app; `mockup split <App> --screens a,b` kéo màn hình ra app riêng.
- `init` đặt template ở `.claude/kit/mockup-templates`, tài liệu ở `docs/mockup.md`, `docs/demo-script.md`. Dự án đã `init` bản cũ: xóa `prototype/` và dòng `{ "path": "prototype" }` trong sfdx-project.json nếu có.
## v1.6.0
- `mockup` tạo metadata thật: Lightning App `Mockup`, mỗi màn hình (LWC có target `lightning__AppPage` trong `prototype/lwc`) một Tab + App Page, Permission Set `Mockup_Access`; chạy lại để thêm màn hình mới, không ghi đè file đã sửa. CHƯA thử deploy trên org thật.
- `promote [--label "Tên"] [--only a,b]`: đổi tên app, chuyển metadata + LWC được dùng từ `prototype/` sang `force-app`.
## v1.5.3
- Lệnh `mockup [-o alias]`: thêm `prototype` vào sfdx-project.json (có .bak), đồng bộ apiVersion component mẫu, cảnh báo thiếu `**/__tests__/**` trong .forceignore, in lệnh deploy mockup lên sandbox.
- `init` copy thêm `prototype/DEPLOY.md`; skill mockup-prototype trỏ tới lệnh mới.
## v1.5.2
- Profile có `status` (sample / template-only / team-skill); `add-cloud` in cảnh báo cho cloud mẫu (mce, manufacturing). Tài liệu hướng dẫn ghi rõ trạng thái từng cloud.
## v1.5.0
- Kit thành gói npm có CLI `sf-kit` (`bin/sf-kit.mjs`): `init` chạy ngay trong thư mục dự án có sẵn, không ghi đè file đã có.
- `sf-kit detect [--apply]`: quét docs/brd, docs/fsd, 00-overview (md/txt) bằng từ khóa, bật cloud + skill, ghi docs/skill-plan.md. Tín hiệu chung chung cần >=3 từ khóa khác nhau.
## v1.4.0
- Cloud profile (`cloud-profiles/`): sales-cloud, service-cloud, experience-cloud, mce, manufacturing. Mỗi profile sinh `docs/<cloud>/` (template) và bật skill kèm theo.
- Thư mục tài liệu chung mới: `docs/brd/`, `docs/fsd/`, `docs/uat/`.
- `/setup-skills` + skill `project-skill-sync`: đọc BRD/FSD hoặc NotebookLM (MCP), khớp `skill-registry.json`, ghi `docs/skill-plan.md`, chờ xác nhận rồi bật skill. `/add-cloud` thêm cloud sau.
- `claude/kit/kit.mjs` (Node, không phụ thuộc gói ngoài): init / add-cloud / install / list / registry; ghi `.claude/skills.lock.json`.
- bootstrap: skill vào `.claude/skill-catalog/`, chỉ bật `core` (+ skill theo `--clouds`); `--all-skills` giữ hành vi cũ.
- Skill mới (starter v0.1, cần review): mce-development, manufacturing-cloud.
## v1.3.0
- Thêm 10 skill đang dùng ở DongTienPaper: copado-deploy, deploy-troubleshooting, find-skills, frontend-design, org-parity-check, post-deploy-steps, salesforce, salesforce-developer, sf-mcp-deploy, using-ui-bundle-salesforce-data.
- Git giống DongTienPaper: `.gitignore` (chỉ track Apex/trigger/LWC/Aura/VF), `scripts/deploy-changes.sh` (pre-push auto-deploy từ main), `scripts/install-git-hooks.sh`, `.env.salesforce.example`; bootstrap tự cài hook.
- MCP: `mcp.template.json` (Salesforce_Dev/UAT, jira, playwright), `claude/mcp/README.md`; settings.template.json mở rộng allow/deny.
- `CLAUDE.template.md`: mục Git & Deploy, kiểm tra giao diện bằng Playwright.
## v1.2.0
- Thêm skill `sf-platform-gotchas`; agent `task-reader`, `fsd-analyst`, `uat-verifier`; `claude/mcp.template.json`.
- Project context: thêm `tasks/`, `runbooks/deploy-dev-to-uat.md`, `domain-map.md`.
- `CLAUDE.template.md`: thêm quy tắc retrieve-trước-khi-sửa, FLS, git, mục ngôn ngữ và gotchas riêng.
- bootstrap tạo `.mcp.json`, `docs/fsd/`.
## v1.1.0
- Thêm Journey: `journeys/` (template, index), `screens.md`, `traceability.md`, skill `journey-mapping`, lệnh `/journey`.
- Thêm TDD: skill `tdd-workflow`, lệnh `/tdd`, `guidelines/tdd-standard.md`, `TestDataFactory.cls`, `jest.config.js`.
- Prototype: thêm 4 template (multiStepForm, kpiDashboard, approvalPanel, portalLayout), Jest mẫu; `mockDataProvider` thành LWC service module (`c/mockDataProvider`); `prototype/` khai báo trong sfdx-project.json.
- `code-review` và `CLAUDE.template.md` cập nhật theo TDD + truy vết.
## v1.0.0
- Bản đầu: starter-kit, claude skills/commands/agents, project-context-template, mockup-kit, governance.
