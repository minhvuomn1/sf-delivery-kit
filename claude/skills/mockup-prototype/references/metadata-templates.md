# Metadata cho một màn hình mockup

Thay `<screen>` bằng tên LWC camelCase (ví dụ `orderList`), `<Label>` bằng tên hiển thị. Đặt file trong `<package>/main/default/`.
Các mẫu dưới đây theo định dạng Salesforce nhưng **chưa được kiểm chứng trên org thật**: luôn `deploy validate` trước. Nếu lỗi `motif` của tab thì đổi sang giá trị motif hợp lệ khác; nếu lỗi template của App Page thì tạo một App Page thử bằng Lightning App Builder trong sandbox, retrieve về để xem template/region tên gì.

## App Page: `flexipages/Mockup_<screen>.flexipage-meta.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<FlexiPage xmlns="http://soap.sforce.com/2006/04/metadata">
    <flexiPageRegions>
        <itemInstances>
            <componentInstance>
                <componentName>c:<screen></componentName>
                <identifier>c_<screen></identifier>
            </componentInstance>
        </itemInstances>
        <mode>Replace</mode>
        <name>main</name>
        <type>Region</type>
    </flexiPageRegions>
    <masterLabel>Mockup - <Label></masterLabel>
    <template>
        <name>flexipage:defaultAppHomeTemplate</name>
    </template>
    <type>AppPage</type>
</FlexiPage>
```
LWC cần `<isExposed>true</isExposed>` và `<target>lightning__AppPage</target>` trong `<screen>.js-meta.xml`.

## Tab: `tabs/Mockup_<screen>.tab-meta.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <flexiPage>Mockup_<screen></flexiPage>
    <label><Label></label>
    <motif>Custom9: Building</motif>
</CustomTab>
```

## App: `applications/Mockup.app-meta.xml` (tạo một lần, sau đó thêm `<tabs>`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomApplication xmlns="http://soap.sforce.com/2006/04/metadata">
    <brand>
        <headerColor>#7F8DE1</headerColor>
        <shouldOverrideOrgTheme>false</shouldOverrideOrgTheme>
    </brand>
    <description>App mockup: các màn hình dựng sớm để demo cho khách, là code thật trong dự án.</description>
    <formFactors>Large</formFactors>
    <isNavAutoTempTabsDisabled>false</isNavAutoTempTabsDisabled>
    <isNavPersonalizationDisabled>false</isNavPersonalizationDisabled>
    <isNavTabPersistenceDisabled>false</isNavTabPersistenceDisabled>
    <isOmniPinnedViewEnabled>false</isOmniPinnedViewEnabled>
    <label>Mockup</label>
    <tabs>Mockup_<screen></tabs>
    <uiType>Lightning</uiType>
    <navType>Standard</navType>
</CustomApplication>
```
Thêm màn hình mới: thêm một dòng `<tabs>Mockup_<screen2></tabs>`.

## Permission Set: `permissionsets/Mockup_Access.permissionset-meta.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <applicationVisibilities>
        <application>Mockup</application>
        <visible>true</visible>
    </applicationVisibilities>
    <hasActivationRequired>false</hasActivationRequired>
    <label>Mockup Access</label>
    <tabSettings>
        <tab>Mockup_<screen></tab>
        <visibility>Visible</visibility>
    </tabSettings>
</PermissionSet>
```
Thêm màn hình mới: thêm một khối `<tabSettings>` tương ứng.

## Deploy một màn hình (sandbox)
```
sf project deploy validate -m "LightningComponentBundle:<screen>" -m "LightningComponentBundle:mockDataProvider" -m "FlexiPage:Mockup_<screen>" -m "CustomTab:Mockup_<screen>" -m "CustomApplication:Mockup" -m "PermissionSet:Mockup_Access" -o <alias>
sf project deploy start    (cùng danh sách -m) -o <alias>
sf org assign permset -n Mockup_Access -o <alias>
```

## Điều hướng giữa màn hình (trong LWC)
```js
import { NavigationMixin } from 'lightning/navigation';
export default class X extends NavigationMixin(LightningElement) {
    goToOrders() {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: { apiName: 'Mockup_orderList' }
        });
    }
}
```
