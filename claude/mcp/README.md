# MCP cho Claude Code

`claude/mcp.template.json` → bootstrap sinh `.mcp.json` ở gốc dự án. **Không để API token trong file**; dùng biến môi trường (`${JIRA_API_TOKEN}`) đặt ở máy từng người.

| Server | Để làm gì | Yêu cầu |
|--------|-----------|---------|
| Salesforce_Dev | retrieve/deploy/SOQL/chạy Apex test trên DEV (`--orgs <alias>`) | `sf org login web -a <alias>` trước; Node |
| Salesforce_UAT | như trên cho UAT (alias `<alias>_UAT`); dùng skill `sf-mcp-deploy`, không bao giờ Production | đăng nhập UAT |
| jira | đọc ticket, comment, đổi trạng thái (skill `jira-to-code-workflow`) | `uvx` (cài `uv`), API token Atlassian |
| playwright | mở org, kiểm thử UI theo journey (agent `uat-verifier`) | Node; trình duyệt tự tải |

## Thiết lập máy mới
1. `npm i -g @salesforce/cli`; `sf org login web -a <alias>` (và `<alias>_UAT`).
2. Đặt biến môi trường: `JIRA_API_TOKEN` (Windows: `setx JIRA_API_TOKEN "..."`).
3. Mở Claude Code ở thư mục dự án, chạy `/mcp` kiểm tra các server đã `connected`.

## Mẹo
- Server báo `CONNECT_TIMEOUT` lần đầu thường do `npx` đang tải package; thử lại.
- Pin phiên bản `@salesforce/mcp` (đang `0.30.15`) để tránh đổi hành vi giữa chừng; nâng khi đã thử.
- Mỗi org một server riêng để Claude không nhầm DEV/UAT.
- Lấy login URL cho Playwright: `sf org open -o <alias> --url-only --json` (mỗi phiên lấy mới).

## NotebookLM (tùy chọn, cho /setup-skills)
Để agent hỏi notebook chứa BRD/FSD thay vì đọc file: `claude mcp add notebooklm -- npx notebooklm-mcp@latest`, rồi nhờ Claude chạy `setup_auth` để đăng nhập Google một lần.
- Đây là MCP cộng đồng (PleasePrompto/notebooklm-mcp), không phải của Google/Anthropic; điều khiển trình duyệt bằng tài khoản Google của bạn. Thử trước, rồi pin phiên bản thay cho `@latest` như đã làm với `@salesforce/mcp`.
- Không đưa vào `.mcp.json` của repo vì phiên đăng nhập là của từng người.
- Chỉ nạp tài liệu khách hàng lên NotebookLM nếu hợp đồng cho phép dữ liệu đi qua Google.
