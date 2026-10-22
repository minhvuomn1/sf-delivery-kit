---
name: tdd-workflow
description: Quy trình TDD (Red -> Green -> Refactor) cho Apex và LWC, truy vết từ business rule/acceptance criteria tới test. Dùng khi bắt đầu code một tính năng, ticket hoặc business rule mới, khi người dùng nhắc TDD/test-first, hoặc khi sửa bug (viết test tái hiện trước).
---

# TDD Workflow

Chuẩn viết test (TestDataFactory, bulk/negative, assert, coverage) nằm ở skill `apex-test-generator`. Skill này chỉ quy định **thứ tự làm việc** và **truy vết**.

## Vòng lặp cho mỗi acceptance criterion
1. **Chọn 1 AC** (từ `docs/journeys/*` hoặc ticket) và BR tương ứng.
2. **RED**: viết test cho AC đó, tên/comment ghi ID BR. **Chạy và xác nhận test fail đúng lý do** (không phải lỗi biên dịch hay thiếu data).
3. **GREEN**: viết code ít nhất để pass. Không thêm tính năng ngoài test.
4. **REFACTOR**: dọn code (theo `apex-conventions`/`lwc-patterns`) khi test vẫn xanh; chạy lại toàn bộ test của class/component.
5. **Cập nhật** `docs/traceability.md` (Red -> Green -> Done). Lặp lại với AC kế tiếp.

## Chọn loại test
| Đối tượng | Công cụ | Chạy |
|-----------|---------|------|
| Logic nghiệp vụ Apex (service/domain) | Apex test | `sf apex run test -o <sandbox> --tests <Class> --synchronous -r human` |
| Trigger / bulk | Apex test, 200 records | như trên |
| LWC (UI, sự kiện, xử lý lỗi) | Jest | `npm run test:unit` |
| Tích hợp ngoài | Apex test + callout mock | như trên |

Mẹo để vòng lặp nhanh: đặt logic nghiệp vụ vào class service thuần (không phụ thuộc UI/trigger) và logic hiển thị vào LWC có Jest, vì Jest chạy local tức thì, Apex test phải chạy trên org.

## Truy vết
- Apex: `submit_missingApprover_throwsError` kèm comment `// BR-004`.
- Jest: `it('BR-004: ...')`.
- Mỗi BR có >= 1 test (happy path) và >= 1 test ngoại lệ nếu BR có điều kiện lỗi.
- Bug: viết test tái hiện (RED) **trước** khi sửa.

## Commit
- `test(BR-004): ...` rồi `feat(BR-004): ...` (hoặc cùng commit, nhưng test phải có mặt trong PR).
- Không merge khi còn test bị skip/comment out.

## Dấu hiệu làm sai
- Viết code xong mới "bổ sung test cho đủ coverage".
- Test không có assert, hoặc assert quá chung chung.
- Test pass ngay lần chạy đầu (chưa chắc đã kiểm tra đúng cái cần kiểm tra).
