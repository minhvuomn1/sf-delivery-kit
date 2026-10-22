# Runbook: Deploy DEV → UAT
1. Liệt kê khác biệt DEV/UAT: xem skill `deploy-checklist` (và `docs/environments.md`).
2. Validate (dry-run): `/validate <uat-alias>`.
3. Thứ tự deploy: Custom Labels → Objects/Fields → FLS/Permission Sets/Profiles → Apex → LWC/Aura → Layouts/FlexiPages → Flows.
4. Sau deploy: kích hoạt flow, gán permission set, thiết lập Custom Metadata/credential theo môi trường, smoke test theo journey.
5. Rollback: <điền theo dự án: deploy lại bản trước / destructive changes>.
6. Ghi kết quả vào `docs/tasks/` và `docs/notes/`.
