import { LightningElement } from 'lwc';
import { getKpis } from 'c/mockDataProvider'; // TODO: thay bằng Apex thật khi chốt

export default class KpiDashboard extends LightningElement {
    tiles = [];

    async connectedCallback() {
        this.tiles = await getKpis();
    }
}
