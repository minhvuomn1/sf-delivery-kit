# Deploy prototype lên Org
1. Component nằm trong `prototype/lwc/` (bootstrap đã copy). Chọn template cần dùng, đổi tên/sửa theo màn hình `SCR-xx`.
2. Chạy test local trước: `npm run test:unit`
3. Deploy (CHỈ sandbox): `sf project deploy start -d prototype/lwc -o <sandbox>`
   (luôn kèm `mockDataProvider` vì các component phụ thuộc vào nó)
4. Gắn component vào App Page / Experience Builder.
5. Chạy theo `prototype/demo-script.md`.
6. Ghi trạng thái màn hình (Mock/Thật) vào `docs/screens.md`.
