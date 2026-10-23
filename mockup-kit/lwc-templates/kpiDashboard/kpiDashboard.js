import { LightningElement } from 'lwc';
import { getKpis } from 'c/mockDataProvider';

export default class KpiDashboard extends LightningElement {
    tiles = [];

    async connectedCallback() {
        this.tiles = await getKpis();
    }
}
