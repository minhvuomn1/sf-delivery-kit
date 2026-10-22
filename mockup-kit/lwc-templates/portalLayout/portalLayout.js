import { LightningElement, api } from 'lwc';

export default class PortalLayout extends LightningElement {
    @api brand = 'Portal';
    @api navItems = [
        { label: 'Trang chủ', value: 'home' },
        { label: 'Đơn hàng', value: 'orders' },
        { label: 'Hỗ trợ', value: 'support' }
    ];

    handleNav(event) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('navigate', { detail: event.currentTarget.dataset.value }));
    }
}
