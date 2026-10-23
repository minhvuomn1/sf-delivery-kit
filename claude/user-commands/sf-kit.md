---
description: Chạy lệnh sf-kit trong dự án hiện tại, chủ yếu `upgrade` để cập nhật dự án lên bản kit mới
argument-hint: upgrade [--pull] [--dry-run]
allowed-tools: Bash(node {{KIT}}/bin/sf-kit.mjs:*), Bash(git status:*), Bash(git diff:*)
---
Lệnh người dùng gõ: `/sf-kit $ARGUMENTS`. Chạy trong thư mục dự án hiện tại bằng `node {{KIT}}/bin/sf-kit.mjs <lệnh>`.

Nếu `$ARGUMENTS` rỗng: in cách dùng (`upgrade`, `init`, `detect`, `add-cloud`, `list`) và dừng.

Nếu lệnh là `upgrade`:
1. Kiểm tra thư mục hiện tại có `.claude/kit/kit.mjs`; nếu không, nói dự án chưa `init` và dừng.
2. Nếu `$ARGUMENTS` chưa có `--dry-run`: chạy trước `node {{KIT}}/bin/sf-kit.mjs $ARGUMENTS --dry-run`, tóm tắt ngắn file mới, file kit sẽ bị ghi đè, file cần gộp tay (CLAUDE.md, settings.json) và các mục CHANGELOG đáng chú ý, rồi hỏi tôi có áp dụng không. Chỉ khi tôi đồng ý mới chạy lại `node {{KIT}}/bin/sf-kit.mjs $ARGUMENTS`.
3. Nếu `$ARGUMENTS` đã có `--dry-run`: chỉ chạy và tóm tắt, không áp dụng.
4. Sau khi áp dụng: nếu có `CLAUDE.md.new` hoặc `.claude/settings.json.new`, đọc và đề xuất cách gộp vào file gốc, chờ tôi đồng ý rồi mới sửa và xóa file `.new`. Chạy `git status` và nhắc tôi rà `git diff` trước khi commit. Không tự commit, không deploy.
5. Nếu thiếu `--pull` và kit có thể đã cũ, nhắc rằng lệnh chỉ dùng bản kit đang có trên máy.

Lệnh khác (`init`, `detect`, `add-cloud`, `list`): chạy đúng như người dùng gõ rồi tóm tắt kết quả.
