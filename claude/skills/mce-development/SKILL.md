---
name: mce-development
description: Khung làm việc cho Marketing Cloud Engagement (SFMC) - Data Extension, Subscriber Key, SQL Query Activity, AMPscript/SSJS, Journey Builder, Automation Studio, Marketing Cloud Connect, và cách theo dõi thay đổi vì MCE không deploy bằng sf CLI. Dùng khi dự án có Marketing Cloud, MCE, SFMC, journey gửi email/SMS, AMPscript, Data Extension.
---

# Marketing Cloud Engagement (MCE)
> Trạng thái: starter v0.1, viết từ kiến thức chung, chưa qua review của team. Mọi giới hạn/số liệu phải đối chiếu tài liệu Salesforce hiện hành trước khi cam kết với khách.

## Khác biệt cốt lõi so với org Salesforce
- MCE là nền tảng riêng (đăng nhập, API, Business Unit riêng). `sf project deploy` và git của kit **không** phủ MCE. Mọi thứ cần ghi vào `docs/mce/` để truy vết (DE, query, journey, automation).
- Thường không có sandbox giống org core; cách tách DEV/UAT hay gặp là Business Unit con riêng, **cần xác nhận với khách** rồi ghi vào `docs/environments.md`.
- Marketing Cloud Connect nối theo từng cặp org: DEV org <-> BU dev, UAT org <-> BU uat. Không dùng chung kết nối.

## Quy tắc thiết kế
1. **Subscriber Key**: chốt sớm (ví dụ ContactId/Id của Salesforce) và ghi vào `docs/mce/mc-connect.md`. Đổi sau khi đã có dữ liệu rất tốn công.
2. **Data Extension**: ghi PK, sendable + trường liên kết Subscriber, retention, nguồn nạp vào `docs/mce/data-extensions.md`. Tên theo quy ước chung của dự án.
3. **SQL Query Activity**: chỉ SELECT; xác định DE đích và chế độ Overwrite / Append / Update; lưu mỗi query một file trong `docs/mce/queries/` kèm DE nguồn/đích. Chạy thử trên tập nhỏ trước.
4. **AMPscript/SSJS**: đặt khối dùng lại vào `docs/mce/templates/`; luôn xử lý giá trị rỗng (Lookup không ra dòng); không nhúng dữ liệu cá nhân thật vào ví dụ.
5. **Journey Builder**: mô tả entry source, re-entry, split, wait, exit, goal trong `docs/mce/journeys.md`, gắn ID J-xx. Test bằng DE/contact thử, không gửi thật.
6. **Automation Studio**: ghi lịch, thứ tự activity, owner, ai nhận cảnh báo lỗi.
7. **Quyền & tuân thủ**: send classification, sender profile, unsubscribe/opt-out phải có trong BRD; thiếu thì hỏi lại, không tự đặt.

## Truy vết thay đổi
- Cập nhật `docs/traceability.md` với dòng: J-xx -> Journey/Automation/DE -> BR -> cách kiểm (test send, query kết quả) -> ticket.
- Công cụ quản lý metadata MCE bằng code (ví dụ SFMC DevTools/mcdev, cộng đồng) chỉ nên đưa vào sau khi team thử và có ADR trong `docs/decisions/`.

## Hỏi lại khách khi thiếu
Subscriber Key là gì? Có bao nhiêu BU và dùng BU nào cho DEV/UAT? Nguồn dữ liệu vào DE (sync, import, API, query)? Quy tắc opt-out? Ai sở hữu nội dung email?
