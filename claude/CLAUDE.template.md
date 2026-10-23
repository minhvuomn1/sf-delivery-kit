# {{TÊN_DỰ_ÁN}}
Salesforce {{Sales/Service/Experience Cloud}} cho {{KHÁCH_HÀNG}}. API version: {{62.0}}.

## Lệnh thường dùng
- Test LWC: `npm run test:unit`
- Test Apex: `sf apex run test -o <sandbox> --tests <Class> --synchronous -r human`
- Validate: `sf project deploy validate -o <sandbox> --test-level RunLocalTests`

## Git & Deploy
- Metadata tracked bởi git: Apex, trigger, LWC, Aura, Visualforce. Object/field/layout/profile/flow... KHÔNG nằm trong git (org là source of truth), xem `.gitignore`.
- `pre-push` hook (`scripts/deploy-changes.sh`): push lên nhánh `main` sẽ tự deploy phần `force-app` thay đổi lên org (JWT, `.env.salesforce`). Push `main` = deploy thật, hãy coi như vậy.
- File bị xóa không được deploy tự động: xóa component phải dùng destructiveChanges riêng.
- Claude deploy bằng `sf`/MCP khi làm việc; "đã deploy" và "đã commit/push" là hai bước độc lập do người dùng kiểm soát.
- Chạy `bash scripts/install-git-hooks.sh` một lần trên mỗi máy mới.

## Kiểm tra giao diện trên org
Không có dev server local. Lấy URL đăng nhập một lần: `sf org open -o <alias> --url-only --json`, đưa URL `secur/frontdoor.jsp?...` cho Playwright (thêm `&startURL=%2Flightning%2Fn%2F<AppPage>`). Mỗi phiên lấy URL mới.

## Quy ước (chi tiết trong .claude/skills)
- Apex: apex-conventions | LWC: lwc-patterns | Test: apex-test-generator
- **TDD bắt buộc:** viết test trước (RED), code tối thiểu (GREEN), refactor (skill tdd-workflow, lệnh /tdd)
- Coverage >= 85%, assert có ý nghĩa; mỗi test ghi ID business rule trong TÊN test (không dùng comment)
- **Không viết comment** trong mọi file code (Apex, LWC js/html/css, test): đặt tên rõ nghĩa, tách method nhỏ thay vì chú thích
- **Refresh bắt buộc:** mọi LWC/Apex action làm đổi dữ liệu (lưu, tạo, xóa, đổi trạng thái, gọi Apex imperative) phải làm mới giao diện ngay, không cần F5: `refreshApex` (wire Apex), `notifyRecordUpdateAvailable`/`RefreshEvent` (record page, quick action, tab), xóa `draftValues`, reset loading
- Đọc ticket Jira qua sub-agent `jira-reader`

## Tuyệt đối không
- Deploy trực tiếp lên Production (chỉ qua pipeline)
- Commit credential / sửa metadata managed package
- SOQL/DML trong vòng lặp
- Tự coi business rule do Claude suy ra là đã được khách hàng xác nhận

- Retrieve metadata mới nhất từ org trước khi sửa Object/Field/Layout/FlexiPage
- Thêm field xong deploy FLS ngay, rồi mới kiểm tra bằng Apex/dữ liệu
- Không tự `git add/commit/push` nếu tôi chưa yêu cầu (bỏ dòng này nếu team dùng PR tự động)
- Đọc skill `sf-platform-gotchas` trước khi tạo field, deploy, viết SOQL/LWC datatable

## Bối cảnh dự án
- Tổng quan: @docs/00-overview.md
- Nghiệp vụ: @docs/business-rules.md
- Journey: @docs/journeys/_index.md | Màn hình: @docs/screens.md
- Kiến trúc: @docs/architecture.md | Data model: @docs/data-model.md
- Luồng nghiệp vụ & object đang live: @docs/domain-map.md
- Tiến độ task: `docs/tasks/README.md` (đọc qua sub-agent `task-reader`)
- Truy vết: @docs/traceability.md | Môi trường: @docs/environments.md

## Skill & cloud của dự án
- Skill đang bật: `.claude/skills/`. Skill chưa bật nằm ở `.claude/skill-catalog/` (Claude không tự nạp). Danh sách + lý do bật: `.claude/skills.lock.json`, `docs/skill-plan.md`.
- `/setup-skills` đọc `docs/brd/`, `docs/fsd/` (hoặc NotebookLM qua MCP) rồi đề xuất skill + thư mục tài liệu theo cloud, chờ tôi xác nhận. `/add-cloud <cloud>` thêm cloud về sau.
- Cloud của dự án: <điền sau khi chạy /setup-skills>

## Quy trình
Yêu cầu -> /journey (J-xx, SCR-xx, BR-xx, AC) -> prototype (skill mockup-prototype) ->
ticket -> branch `feature/KEY-123-mo-ta` -> /tdd -> /validate -> /review -> PR.
Cuối phiên: /handover.
ID tham chiếu xuyên suốt: J-xx -> SCR-xx -> BR-xx -> test -> ticket.

## Ngôn ngữ & đặt tên
- <Điền: tên/label API tiếng Anh; chat tiếng Việt, code không có comment; metadata mới có bản dịch VI hay không>

## Known platform gotchas (riêng dự án)
<Thêm mỗi khi gặp lỗi khó chịu, 1-2 dòng/mục. Cái dùng lại được thì đẩy về skill sf-platform-gotchas của kit.>
