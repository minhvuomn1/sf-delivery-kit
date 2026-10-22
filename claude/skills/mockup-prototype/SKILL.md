---
name: mockup-prototype
description: Dựng mockup cho dự án Salesforce bằng code thật trong source dự án. Mỗi màn hình là một LWC thật cùng App Page và Tab, gom trong Lightning App tên "Mockup", dùng dữ liệu giả. Dùng khi bắt đầu dự án, khi khách cần xem màn hình trước khi làm thật, khi nghe "dựng mockup", "làm màn hình mẫu", "demo cho khách", hoặc khi có SCR-xx cần hiện thực hóa.
---

# Mockup (làm thật, gom trong app "Mockup")

Lệnh gọi nhanh trong Claude Code: `/mockup <SCR-xx | mô tả | template tênMànHình>` và `/mockup-app rename|split ...`.

## Nguyên tắc
- Mockup **là code thật** trong package mặc định của dự án (`<package>/main/default`, lấy `<package>` từ `sfdx-project.json`, mục `default: true`). Không tạo thư mục `prototype/` hay project riêng.
- Các màn hình gom trong **một Lightning App tên `Mockup`** (API name `Mockup`). Khi làm chính thức chỉ cần đổi label app hoặc chuyển bớt tab sang app khác; không phải di chuyển file.
- Dữ liệu giả đi qua service module `c/mockDataProvider`. Màn hình không chứa logic nghiệp vụ thật (trừ ví dụ minh họa BR).
- Không tạo Apex, object, field chỉ để mockup, trừ khi `docs/data-model.md` đã chốt các thứ đó.
- Chỉ deploy lên **sandbox**, không bao giờ Production. Không đưa dữ liệu thật của khách vào mock data.

## Đầu vào cần có
`docs/screens.md` (SCR-xx), `docs/journeys/`, `docs/business-rules.md`, `docs/data-model.md`. Thiếu journey hoặc màn hình thì chạy skill `journey-mapping` trước, hoặc hỏi người dùng đúng một câu về điều còn thiếu. Không tự bịa tên object/field: ghi `(cần xác định)`.

## Quy trình cho mỗi màn hình SCR-xx
1. **Xác định**: ai dùng (persona), mục tiêu, dữ liệu hiển thị, hành động, trạng thái (đang tải, rỗng, lỗi). Ghi/cập nhật dòng SCR-xx trong `docs/screens.md` với trạng thái `Mock`.
2. **Chọn khung**: template có sẵn là `listFilterTable` (danh sách + lọc), `multiStepForm` (biểu mẫu nhiều bước), `kpiDashboard`, `approvalPanel` (duyệt/từ chối), `portalLayout`. Không khớp thì tự viết LWC mới theo mục "Chất lượng giao diện".
3. **Tạo màn hình** (hai cách, kết quả giống nhau):
   - Có kit: `node .claude/kit/kit.mjs mockup add <template> <tênMànHình> --label "<Tên hiển thị>"`. Lệnh copy template vào `lwc/<tênMànHình>`, tạo App Page, Tab, gắn vào app Mockup và permission set `Mockup_Access`, và in lệnh deploy.
   - Không có kit hoặc LWC tự viết: tạo tay các file theo `references/metadata-templates.md` (App Page, Tab, App, Permission Set). Tên cố định: App Page và Tab là `Mockup_<tênMànHình>`, permission set là `Mockup_Access`.
4. **Hoàn thiện LWC** theo màn hình: nhãn và cột bám `data-model.md`; sửa `mockDataProvider/mockData.js` cho sát field thật (LWC không import được file JSON). Nhiều bản ghi mẫu đa dạng: dài/ngắn, rỗng, trạng thái khác nhau.
5. **Test**: `npm run test:unit`. Test mẫu dùng ID `BR-000`; đổi thành BR thật rồi cập nhật `docs/traceability.md`.
6. **Deploy sandbox**: `sf project deploy validate` trước, rồi `deploy start`, rồi `sf org assign permset -n Mockup_Access -o <alias>`. Chỉ deploy các metadata của màn hình vừa làm (danh sách `-m` có trong `references/metadata-templates.md`). Deploy có thể vài phút mới hiện, kiểm tra source đã lên trước khi kết luận lỗi.
7. **Kiểm tra giao diện** trên org (agent `uat-verifier` bằng Playwright, hoặc người xem): mở App Launcher > Mockup, đi hết các trạng thái đã liệt kê ở bước 1.
8. **Demo**: soạn `docs/demo-script.md` từ journey (ai làm gì, bấm gì, thấy gì). Ghi các giả định vào `docs/decisions/`.

## Chất lượng giao diện
- Ưu tiên base component `lightning-*` và lớp tiện ích SLDS; hạn chế CSS tùy biến.
- Luôn có 3 trạng thái: đang tải, rỗng, lỗi. Nhãn và thông báo theo ngôn ngữ ghi trong `CLAUDE.md`.
- Bố cục co giãn (`slds-grid`, `slds-col`), nhãn cho input, `aria-label` cho icon-button.
- Điều hướng giữa các màn hình mockup: dùng `NavigationMixin` với `type: 'standard__navItemPage'` và `apiName: 'Mockup_<tênMànHình>'`.
- Portal Experience Cloud: dùng skill `experience-cloud`; màn hình đặt trong Experience Builder thay vì App Page, nhưng vẫn là LWC thật và dùng `c/mockDataProvider`. Thiết kế riêng: skill `frontend-design`.
- Quy ước LWC của team: skill `lwc-patterns`.

## Khi làm chính thức
- Đổi tên app: sửa `<label>` trong `applications/Mockup.app-meta.xml` (hoặc `node .claude/kit/kit.mjs mockup rename --label "Tên mới"`). API name giữ nguyên.
- Tách màn hình ra app riêng: tạo app mới có các `<tabs>` tương ứng, gỡ chúng khỏi app Mockup, và cấp quyền qua permission set của app mới (hoặc `mockup split <TênApp> --screens a,b`).
- Với từng màn hình khách đã chốt: dùng `tdd-workflow` để thay từng hàm trong `mockDataProvider` bằng Apex thật (viết test trước), giữ nguyên chữ ký hàm. Đổi trạng thái SCR-xx từ `Mock` sang `Thật` trong `docs/screens.md` và cập nhật `docs/traceability.md`.

## Không làm
- Không deploy lên Production, không dùng dữ liệu thật của khách làm mock data.
- Không tự coi business rule minh họa là đã được khách xác nhận (đánh dấu `(đề xuất - cần xác nhận)`).
- Không ghi đè file người dùng đã sửa khi thêm màn hình mới.
