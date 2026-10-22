# Changelog
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
