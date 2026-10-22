---
name: sf-platform-gotchas
description: Danh sách lỗi nền tảng Salesforce khó chịu đã gặp thực tế (FLS, picklist RecordType, SOQL null bind, deploy chậm hiện, datatable, sf CLI trên Windows). Đọc trước khi tạo field, deploy, viết SOQL hoặc LWC datatable, và khi gặp lỗi "lạ" sau deploy.
---

# Platform gotchas (cập nhật liên tục)

Mỗi dự án thêm gotcha riêng vào `CLAUDE.md`. Gotcha dùng lại được cho dự án khác thì mở PR về kit (`governance/review-process.md`).

## Metadata & deploy
- **Retrieve trước khi sửa** Object/Field/Layout/FlexiPage: source local hay lệch org thật.
- **FLS ngay sau khi thêm field**: deploy FLS cho profile/permission set trước khi chạy Apex/kiểm tra dữ liệu, nếu không "field does not exist" dễ bị chẩn đoán nhầm là cache.
- **Picklist có RecordType**: field picklist mới mà RecordType không có khối `picklistValues` sẽ từ chối MỌI giá trị của RecordType đó.
- **RecordType mới trên standard object** có thể cần `recordTypeVisibilities` trong profile, không chỉ FLS.
- **Đổi kiểu Formula → Picklist/Text** bị chặn nếu FlexiPage còn tham chiếu qua `relatedListFieldAliases`: gỡ tham chiếu, deploy flexipage, rồi đổi kiểu bằng manifest + `--pre-destructive-changes`.
- **Deploy thành công vẫn có thể vài phút mới hiện** (field mới, LWC). Kiểm tra source đã deploy (Tooling API / retrieve lại) rồi chờ, đừng sửa/deploy lại liên tục.
- **Giá trị picklist có thể bị đổi API name** bởi người khác, làm hỏng Apex/lookup filter hardcode giá trị đó.
- **sf CLI trên Windows**: `-m`/`-d` có khoảng trắng trong tên (vd ApexPage) lỗi `'C:\Program' is not recognized`: dùng `-x package.xml`.
- **"Field mới tồn tại" chưa đủ để chuyển sang dùng**: chạy `SELECT COUNT(Id), COUNT(oldField), COUNT(newField)` so mức độ điền trước khi đổi.

## SOQL / Apex
- `Field = :nullVar` khớp `IS NULL` (không phải 0 dòng). Không OR hai điều kiện bind có thể null.
- SOQL không so sánh `field = field` trong WHERE.
- `SUM()` trên currency khác corporate currency cần chú ý multi-currency.

## LWC
- `lightning-datatable`: `columns` phải là tham chiếu ổn định (field, không phải getter trả mảng mới) kẻo mất draft inline-edit.
- Custom cell type: mỗi `typeAttributes` đến thành `@api` prop phẳng riêng, không lồng trong 1 `@api typeAttributes`.
- Không subclass `LightningDatatable`: đã từng làm hỏng `onsave`/`draftValues` toàn bảng.
- `lightning-input type="number"` trong hàng `for:each` render lại có thể méo số theo locale: dùng `type="text"` + hàm format/parse.
- Không bind `disabled` của nút vào getter đọc state con qua `querySelector`: validate khi click.
- Nút/modal đổi dữ liệu **không được bắt người dùng F5**. `RefreshEvent` từ Quick Action panel không ổn định: dùng LMS + component lắng nghe.
- Bảng cần header 2 tầng hoặc cột đóng băng: tự dựng `<table>` (datatable không làm được).
- LWC Quick Action không đặt được vào `quickActionList` của layout classic: gắn thủ công trong App Builder.
