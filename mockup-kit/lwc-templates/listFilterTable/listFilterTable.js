import { LightningElement } from 'lwc';
import { getRecords } from 'c/mockDataProvider'; // TODO: thay bằng Apex thật khi chốt

export default class ListFilterTable extends LightningElement {
    rows = [];
    status = '';
    statusOptions = [
        { label: 'Tất cả', value: '' },
        { label: 'Active', value: 'Active' },
        { label: 'Pending', value: 'Pending' }
    ];
    columns = [
        { label: 'Tên', fieldName: 'Name' },
        { label: 'Trạng thái', fieldName: 'Status__c' },
        { label: 'Giá trị', fieldName: 'Amount__c', type: 'currency' }
    ];

    async connectedCallback() {
        await this.load();
    }

    async handleStatusChange(event) {
        this.status = event.detail.value;
        await this.load();
    }

    async load() {
        this.rows = await getRecords({ status: this.status });
    }
}
