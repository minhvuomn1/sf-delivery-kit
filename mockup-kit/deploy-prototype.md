# Mockup: làm thật, gom trong app "Mockup"
Mockup ở đây là code thật nằm thẳng trong source dự án (`<package>/main/default`), không có thư mục prototype riêng. Chỉ khác là các màn hình được gom trong một Lightning App tên **Mockup**, dùng dữ liệu giả qua `c/mockDataProvider`.

## Tạo màn hình
Trong Claude Code: `/mockup SCR-01` (hoặc `/mockup listFilterTable orderList "Đơn hàng"`); Claude làm theo skill `mockup-prototype` và chờ bạn xác nhận trước khi deploy. Đổi tên/tách app: `/mockup-app`. Tương đương lệnh node bên dưới:
```
node .claude/kit/kit.mjs mockup templates
node .claude/kit/kit.mjs mockup add listFilterTable orderList --label "Đơn hàng" -o <alias-sandbox>
```
Lệnh `add` copy template vào `lwc/orderList` (đổi tên file và định danh bên trong), tạo App Page `Mockup_orderList`, Tab `Mockup_orderList`, gắn vào app `Mockup` và permission set `Mockup_Access`; lần đầu còn tạo app, permission set và `mockDataProvider`. Chạy lại cho màn hình khác; không ghi đè file đã có.

## Deploy (CHỈ sandbox)
Lệnh `add` in sẵn lệnh deploy đúng các metadata vừa tạo. Dạng chung:
```
sf project deploy validate -m "LightningComponentBundle:orderList" -m "FlexiPage:Mockup_orderList" -m "CustomTab:Mockup_orderList" -m "CustomApplication:Mockup" -m "PermissionSet:Mockup_Access" -m "LightningComponentBundle:mockDataProvider" -o <alias>
sf project deploy start    (cùng danh sách) -o <alias>
sf org assign permset -n Mockup_Access -o <alias>
```
Mở App Launcher, chọn app "Mockup", demo theo `docs/demo-script.md`. Ghi trạng thái từng màn hình (Mock/Thật) vào `docs/screens.md`.

## Khi làm chính thức
- Đổi tên hiển thị app: `node .claude/kit/kit.mjs mockup rename --label "Tên mới"`.
- Kéo một số màn hình ra app riêng: `node .claude/kit/kit.mjs mockup split OrderApp --screens orderList,approvalPanel --label "Đặt hàng"`.
- Thay dần thân hàm trong `mockDataProvider` bằng Apex thật (skill `tdd-workflow`), giữ nguyên chữ ký.
- Không cần di chuyển file: mọi thứ đã nằm trong source dự án.
