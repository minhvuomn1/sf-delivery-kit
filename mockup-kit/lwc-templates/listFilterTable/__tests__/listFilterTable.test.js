import { createElement } from 'lwc';
import ListFilterTable from 'c/listFilterTable';
import { getRecords } from 'c/mockDataProvider';

jest.mock('c/mockDataProvider', () => ({ getRecords: jest.fn() }), { virtual: true });

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('c-list-filter-table', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('BR-000: hiển thị dữ liệu trả về trong bảng', async () => {
        getRecords.mockResolvedValue([{ Id: '1', Name: 'ABC', Status__c: 'Active', Amount__c: 100 }]);
        const element = createElement('c-list-filter-table', { is: ListFilterTable });
        document.body.appendChild(element);
        await flushPromises();

        const table = element.shadowRoot.querySelector('lightning-datatable');
        expect(table.data).toHaveLength(1);
    });

    it('BR-000: đổi trạng thái thì gọi lại provider với bộ lọc mới', async () => {
        getRecords.mockResolvedValue([]);
        const element = createElement('c-list-filter-table', { is: ListFilterTable });
        document.body.appendChild(element);
        await flushPromises();

        const combo = element.shadowRoot.querySelector('lightning-combobox');
        combo.dispatchEvent(new CustomEvent('change', { detail: { value: 'Active' } }));
        await flushPromises();

        expect(getRecords).toHaveBeenLastCalledWith({ status: 'Active' });
    });
});
