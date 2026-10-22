# Changelog
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
