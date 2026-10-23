import { createElement } from 'lwc';
import ApprovalPanel from 'c/approvalPanel';
import { getApprovals, decideApproval } from 'c/mockDataProvider';

jest.mock(
    'c/mockDataProvider',
    () => ({ getApprovals: jest.fn(), decideApproval: jest.fn() }),
    { virtual: true }
);

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('c-approval-panel', () => {
    beforeEach(() => {
        getApprovals.mockResolvedValue([
            { id: 'a1', title: 'PO-0001', requester: 'A', amount: 100, status: 'Pending' }
        ]);
        decideApproval.mockResolvedValue({});
    });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('BR-000: từ chối mà không có ý kiến thì báo lỗi và không gọi duyệt', async () => {
        const element = createElement('c-approval-panel', { is: ApprovalPanel });
        const toastHandler = jest.fn();
        element.addEventListener('lightning__showtoast', toastHandler);
        document.body.appendChild(element);
        await flushPromises();

        element.shadowRoot.querySelector('lightning-button[data-action="reject"]').click();
        await flushPromises();

        expect(decideApproval).not.toHaveBeenCalled();
        expect(toastHandler.mock.calls[0][0].detail.variant).toBe('error');
    });

    it('BR-000: duyệt thì gọi provider với id và quyết định đúng', async () => {
        const element = createElement('c-approval-panel', { is: ApprovalPanel });
        document.body.appendChild(element);
        await flushPromises();

        element.shadowRoot.querySelector('lightning-button[data-action="approve"]').click();
        await flushPromises();

        expect(decideApproval).toHaveBeenCalledWith('a1', 'Approved', '');
    });
});
