# Ma trận truy vết
Journey -> Màn hình -> Business rule -> Test -> Ticket. Cập nhật khi thêm/sửa bất kỳ mục nào.

| Journey | Màn hình | Business rule | Test (class.method / file.it) | Ticket | Trạng thái |
|---------|----------|---------------|-------------------------------|--------|------------|
| J-01.1 | SCR-01 | BR-001 | OrderServiceTest.submit_validDraft_setsStatusSubmitted | PROJ-101 | Red |

Trạng thái: **Chưa có test -> Red -> Green -> Done**.
Quy ước: test phải ghi ID BR trong tên hoặc comment (`// BR-001`, `it('BR-001: ...')`).
