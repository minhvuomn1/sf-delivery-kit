import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getApprovals, decideApproval } from 'c/mockDataProvider'; // TODO: thay bằng Apex thật khi chốt

export default class ApprovalPanel extends LightningElement {
    items = [];
    comment = '';

    get isEmpty() {
        return this.items.length === 0;
    }

    async connectedCallback() {
        await this.load();
    }

    async load() {
        const all = await getApprovals();
        this.items = all.filter((i) => i.status === 'Pending');
    }

    handleComment(event) {
        this.comment = event.target.value || '';
    }

    handleApprove(event) {
        return this.decide(event.target.dataset.id, 'Approved');
    }

    handleReject(event) {
        return this.decide(event.target.dataset.id, 'Rejected');
    }

    async decide(id, decision) {
        // Ví dụ business rule: từ chối bắt buộc có ý kiến (đổi thành BR thật của dự án)
        if (decision === 'Rejected' && !this.comment.trim()) {
            this.toast('Lỗi', 'Vui lòng nhập ý kiến khi từ chối', 'error');
            return;
        }
        try {
            await decideApproval(id, decision, this.comment);
            this.toast('Thành công', 'Đã xử lý: ' + decision, 'success');
            this.comment = '';
            await this.load();
        } catch (e) {
            this.toast('Lỗi', e.message, 'error');
        }
    }

    toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
