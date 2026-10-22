# Chuẩn TDD của team
- Mọi acceptance criterion có test trước khi có code; vòng Red -> Green -> Refactor (skill `tdd-workflow`).
- Chuẩn test Apex: skill `apex-test-generator` (>= 85%/class, bulk, negative, assert có ý nghĩa).
- Test LWC: Jest trong `__tests__/` cạnh component; mock Apex/service bằng `jest.mock`.
- Mỗi test ghi ID business rule; ma trận ở `docs/traceability.md`.
- Definition of Done của ticket: test Green + traceability cập nhật + `/review` sạch Blocker/Major.
