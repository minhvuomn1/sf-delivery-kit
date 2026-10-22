# sf-delivery-kit
> Hướng dẫn đầy đủ: mở `guide/index.html` bằng trình duyệt.

Bộ công cụ chuẩn hóa dự án Salesforce kết hợp Claude Code.

| Thư mục | Giải quyết |
|---------|-----------|
| starter-kit/ | Setup dự án nhanh (vấn đề 1): source mẫu, CI, TestDataFactory, Jest, guideline, bootstrap |
| claude/ + project-context-template/ | Nắm nghiệp vụ, kiến trúc, quy tắc; workflow journey/code/review/debug/TDD (vấn đề 2) |
| mockup-kit/ | Prototype sớm để demo (vấn đề 3): 5 template LWC + mock data + test mẫu |
| claude/mcp/ + mcp.template.json | MCP Salesforce DEV/UAT, Jira, Playwright; hướng dẫn thiết lập máy |
| cloud-profiles/ | Thư mục tài liệu + skill theo cloud (Sales, Service, Experience, MCE, Manufacturing) |
| governance/ | Tái sử dụng, version, review (vấn đề 4) |

## Cloud có sẵn
| Cloud | Trạng thái |
|-------|-----------|
| sales-cloud, service-cloud | Chỉ có template tài liệu, chưa có skill riêng |
| experience-cloud | Skill của team + template tài liệu |
| **mce, manufacturing** | **BẢN MẪU** (starter v0.1, chưa review): chỉ là khung để team sửa |

## Lưu ý khi áp dụng cho dự án đã chạy
Repo dự án phải track `CLAUDE.md`, `.claude/`, `docs/` (không đưa vào .gitignore) thì mới review và nâng cấp kit được.

## Chuỗi làm việc
`Yêu cầu -> /journey -> prototype -> /tdd -> /review -> PR`, truy vết bằng ID: J-xx -> SCR-xx -> BR-xx -> test -> ticket.

## Dùng nhanh (trong thư mục dự án có sẵn, giống npm install)
```bash
cd ten-du-an                                   # dự án Salesforce đang có sẵn
npm install --save-dev <đường-dẫn-hoặc-git-url-của-kit>   # vd: ../sf-delivery-kit hoặc git+https://.../sf-delivery-kit.git
npx sf-kit init                                # sinh .claude/ (skill, lệnh, agent), docs/, CLAUDE.md, .mcp.json
npx sf-kit detect --apply                      # quét docs/brd + docs/fsd (md/txt), bật cloud + skill phù hợp
```
- `sf-kit init --clouds sales-cloud,mce` nếu đã biết cloud; `--detect` để quét luôn; `--all-skills` bật hết.
- `init` chỉ thêm phần của kit (.claude, docs, CLAUDE.md, .mcp.json), không đụng source/CI/.gitignore của dự án; thêm `--with-template` nếu thư mục còn trống và muốn lấy luôn source mẫu.
- `init` không ghi đè file đã có, chạy lại an toàn.
- FSD là pdf/docx hoặc nằm trong NotebookLM: dùng `/setup-skills` trong Claude Code (agent đọc được cả hai).
- Dùng lệnh Claude thay cho lệnh node: chạy `node <KIT>/bin/sf-kit.mjs install-global` một lần, rồi trong dự án gõ `/sf-init`, `/setup-skills`, `/mockup`, `/mockup-app`, `/kit-status`.
- Mockup thật trong source dự án, gom trong app "Mockup": `npx sf-kit mockup add listFilterTable orderList --label "Đơn hàng"` (chi tiết: `docs/mockup.md`).
- Thêm cloud sau: `npx sf-kit add-cloud mce` (hoặc `/add-cloud mce`). Xem trạng thái: `npx sf-kit list`.
- Không muốn cài vào node_modules: `node <đường-dẫn-kit>/bin/sf-kit.mjs init` chạy trong thư mục dự án.
- `starter-kit/bootstrap.sh` vẫn dùng được để tạo dự án mới từ đầu.
