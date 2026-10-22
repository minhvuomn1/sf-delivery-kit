import { createElement } from 'lwc';
import MultiStepForm from 'c/multiStepForm';

jest.mock('c/mockDataProvider', () => ({ submitForm: jest.fn() }), { virtual: true });

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('c-multi-step-form', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    // Thay BR-000 bằng ID business rule thật của dự án
    it('BR-000: không cho sang bước 2 khi chưa nhập tên', async () => {
        const element = createElement('c-multi-step-form', { is: MultiStepForm });
        document.body.appendChild(element);

        element.shadowRoot.querySelector('lightning-button[data-id="next"]').click();
        await flushPromises();

        expect(element.shadowRoot.querySelector('.error').textContent).toBe('Vui lòng nhập tên');
        expect(element.shadowRoot.querySelector('lightning-progress-indicator').currentStep).toBe('1');
    });

    it('BR-000: nhập tên rồi thì sang bước 2', async () => {
        const element = createElement('c-multi-step-form', { is: MultiStepForm });
        document.body.appendChild(element);

        const input = element.shadowRoot.querySelector('lightning-input[data-id="name"]');
        input.value = 'Vũ';
        input.dispatchEvent(new CustomEvent('change'));
        element.shadowRoot.querySelector('lightning-button[data-id="next"]').click();
        await flushPromises();

        expect(element.shadowRoot.querySelector('lightning-progress-indicator').currentStep).toBe('2');
    });
});
