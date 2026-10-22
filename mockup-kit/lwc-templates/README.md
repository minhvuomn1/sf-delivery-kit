# LWC Templates (prototype)

| Template | Dùng cho | Test mẫu |
|----------|----------|----------|
| `listFilterTable` | Danh sách + bộ lọc | có |
| `multiStepForm` | Biểu mẫu nhiều bước, kiểm tra từng bước | có |
| `kpiDashboard` | Dashboard chỉ số | |
| `approvalPanel` | Duyệt/từ chối, bắt buộc ý kiến khi từ chối | có |
| `portalLayout` | Khung portal (header/nav/footer + slot) | |
| `mockDataProvider` | Service module dữ liệu giả (thay Apex) | |

## Quy tắc
- Mọi component import dữ liệu qua `c/mockDataProvider`. Khi khách chốt, thay thân hàm bằng Apex thật, giữ nguyên chữ ký.
- `bootstrap.sh` copy cả thư mục này vào `prototype/lwc/` của dự án; `prototype` đã được khai báo trong `sfdx-project.json` nên deploy và Jest dùng được ngay.
- Test mẫu dùng ID `BR-000`: đổi thành BR thật rồi cập nhật `docs/traceability.md`.
- Dữ liệu giả sửa trong `mockDataProvider/mockData.js` (LWC không import được file JSON).
