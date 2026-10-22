// Dữ liệu giả cho prototype. Bám sát field thật trong docs/data-model.md khi đã có.
export const accounts = [
    { Id: '001000000000001', Name: 'Công ty ABC', Status__c: 'Active', Amount__c: 1200000 },
    { Id: '001000000000002', Name: 'Công ty XYZ', Status__c: 'Pending', Amount__c: 800000 },
    { Id: '001000000000003', Name: 'Công ty DEF', Status__c: 'Active', Amount__c: 450000 }
];

export const kpis = [
    { id: 'k1', label: 'Đơn hàng tháng này', value: '128', trend: '+12%' },
    { id: 'k2', label: 'Doanh thu', value: '2.4 tỷ', trend: '+5%' },
    { id: 'k3', label: 'Chờ duyệt', value: '7', trend: '-2' }
];

export const approvals = [
    { id: 'a1', title: 'Đơn hàng PO-0001', requester: 'Nguyễn Văn A', amount: 15000000, status: 'Pending' },
    { id: 'a2', title: 'Đơn hàng PO-0002', requester: 'Trần Thị B', amount: 7200000, status: 'Pending' }
];
