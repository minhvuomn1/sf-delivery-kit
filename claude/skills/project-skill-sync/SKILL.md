---
name: project-skill-sync
description: Đọc tài liệu dự án (docs/brd, docs/fsd, 00-overview) hoặc hỏi notebook NotebookLM qua MCP, xác định dự án dùng cloud/công nghệ nào (Sales, Service, Experience, MCE, Manufacturing, Copado...), rồi đề xuất và bật đúng skill + sinh thư mục tài liệu theo cloud. Dùng khi chạy /setup-skills, khi bắt đầu dự án mới, khi FSD đổi phạm vi, hoặc khi nghe "dự án này cần skill gì", "thêm cloud X vào dự án".
---

# Project Skill Sync

Mục tiêu: dự án chỉ bật skill nó thật sự cần, dựa trên **bằng chứng trong tài liệu**, không dựa trên đoán.
Việc cơ học (copy skill, sinh thư mục, ghi lock) do script `node .claude/kit/kit.mjs` làm. Việc phán đoán (đọc tài liệu, chọn skill) do bạn làm.

## Bước 0. Xem hiện trạng
```bash
node .claude/kit/kit.mjs list       # skill đang bật [x], còn trong catalog [ ], cloud đã bật
node .claude/kit/kit.mjs registry   # core + cloud + conditional (signals -> skill)
```

## Bước 1. Thu thập nguồn (dùng được cả hai, ưu tiên cái có)
**A. Tài liệu trong repo:** `docs/00-overview.md`, `docs/brd/`, `docs/fsd/`, `docs/integrations.md`, `docs/environments.md`.
File dài: `grep -i` các signals trong registry trước, rồi đọc quanh chỗ khớp; không đọc cả file nếu không cần.

**B. NotebookLM qua MCP:** nếu có tool tên dạng `mcp__notebooklm__*`, hỏi notebook của dự án (hỏi người dùng tên/URL notebook nếu chưa biết, một câu duy nhất). Câu hỏi chuẩn (mỗi câu một lần, yêu cầu trả lời kèm nguồn trích):
1. Dự án dùng những sản phẩm/cloud Salesforce nào? (Sales, Service, Experience, Marketing Cloud Engagement, Manufacturing, khác)
2. Có hệ thống ngoài/tích hợp nào? Hướng dữ liệu, cơ chế xác thực?
3. Có portal/cổng khách hàng hoặc đối tác không? Đối tượng người dùng là ai?
4. Quy trình deploy/release: các môi trường (DEV/SIT/UAT/PROD), công cụ (Copado, sf CLI, change set)?
5. Có yêu cầu UI/branding riêng, hay ứng dụng React/UI bundle không?
6. Các phần nào còn chưa chốt hoặc đang mâu thuẫn giữa BRD và FSD?
Nếu **không có** MCP NotebookLM: nói rõ, chỉ ra `docs/mcp-setup.md`, rồi tiếp tục chỉ với nguồn A. Không giả định nội dung notebook.
Lưu ý với người dùng: NotebookLM chạy trên tài khoản Google; chỉ dùng cho tài liệu mà hợp đồng với khách cho phép.

## Bước 2. Rút "tín hiệu dự án" (kèm bằng chứng)
Lập bảng: tín hiệu | loại (cloud / kỹ thuật / deploy / UI) | trích dẫn ngắn (≤ 1 câu) | nguồn (file hoặc "NotebookLM").
- Tín hiệu **đặc thù** (tên cloud/sản phẩm: "Marketing Cloud", "Sales Agreement", "Copado") là đủ.
- Tín hiệu **chung chung** (case, lead, forecast, portal) cần ≥ 2 chỗ độc lập hoặc phải hỏi lại, vì dễ trùng nghĩa.
- Không suy ra cloud từ tên khách hàng/ngành. Mơ hồ thì ghi vào "Cần xác nhận", không tự quyết.

## Bước 3. Khớp với registry
- Cloud khớp `clouds.<id>.signals` -> cloud cần bật (sinh thư mục tài liệu + skill của profile).
- Skill khớp `conditional.<skill>.signals` -> skill cần bật (kèm `also` nếu có).
- Skill `core` luôn bật, không cần lý do.
- Nhu cầu không có skill trong catalog: dùng skill `find-skills` (`npx skills find ...`), kiểm tra install count/nguồn theo quy tắc trong skill đó, **chỉ đề xuất, không tự cài**.

## Bước 4. Ghi kế hoạch và DỪNG chờ xác nhận
Ghi `docs/skill-plan.md`:

| Hạng mục | Loại | Lý do | Bằng chứng (nguồn) | Trạng thái |
|----------|------|-------|--------------------|------------|
| mce | cloud | Journey gửi email từ DE | FSD-v1.0 §4.2 | Đề xuất |

Kèm 3 mục: **Đã bật sẵn (core)**, **Cần xác nhận**, **Skill ngoài kit (từ find-skills)**. Trình bày tóm tắt cho người dùng và hỏi có bật không.

## Bước 5. Sau khi người dùng đồng ý
```bash
node .claude/kit/kit.mjs add-cloud <cloud-id> [...]                 # thư mục docs/<cloud>/ + skill của cloud
node .claude/kit/kit.mjs install <skill> [...] --reason "FSD §x"   # skill lẻ từ catalog
```
Rồi: cập nhật dòng cloud trong `CLAUDE.md` (tiêu đề dự án), đổi "Trạng thái" trong `docs/skill-plan.md` thành Đã bật, nhắc người dùng commit `.claude/skills/`, `.claude/skills.lock.json`, `docs/`. Skill mới có thể cần mở lại phiên Claude Code mới thấy.

## Quy tắc
- Không tự gỡ skill đã bật; nếu một skill không còn bằng chứng, chỉ báo "có thể gỡ".
- Không sửa danh sách `core`/registry khi chạy lệnh này; muốn đổi mặc định thì sửa `.claude/kit/skill-registry.json` có review.
- Chọn skill không đồng nghĩa với xác nhận nghiệp vụ: BR suy ra vẫn phải đánh dấu `(đề xuất - cần xác nhận)`.
- Không đọc/ghi `.env*`, key, token.
