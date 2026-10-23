import { accounts, kpis, approvals } from './mockData';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
let approvalState = approvals.map((a) => ({ ...a }));

export async function getRecords(filter = {}) {
    await delay();
    return accounts.filter((a) => !filter.status || a.Status__c === filter.status);
}

export async function getKpis() {
    await delay();
    return kpis.map((k) => ({ ...k }));
}

export async function getApprovals() {
    await delay();
    return approvalState.map((a) => ({ ...a }));
}

export async function decideApproval(id, decision, comment) {
    await delay();
    const item = approvalState.find((a) => a.id === id);
    if (!item) {
        throw new Error('Không tìm thấy yêu cầu duyệt');
    }
    item.status = decision;
    item.comment = comment;
    return { ...item };
}

export async function submitForm(payload) {
    await delay();
    return { success: true, id: 'MOCK-' + Date.now(), payload };
}
