import { LightningElement } from 'lwc';
import { submitForm } from 'c/mockDataProvider';

export default class MultiStepForm extends LightningElement {
    step = 1;
    form = { name: '', email: '', note: '' };
    error = '';
    resultId = '';

    get currentStepValue() { return String(this.step); }
    get isStep1() { return this.step === 1; }
    get isStep2() { return this.step === 2; }
    get isStep3() { return this.step === 3; }
    get isNotLast() { return this.step < 3; }
    get showActions() { return this.step <= 3; }

    handleChange(event) {
        this.form = { ...this.form, [event.target.name]: event.target.value };
    }

    handleNext() {
        if (this.step === 1 && !(this.form.name || '').trim()) {
            this.error = 'Vui lòng nhập tên';
            return;
        }
        this.error = '';
        this.step += 1;
    }

    handleBack() {
        this.error = '';
        this.step -= 1;
    }

    async handleSubmit() {
        try {
            const result = await submitForm({ ...this.form });
            this.resultId = result.id;
            this.step = 4;
        } catch (e) {
            this.error = e.message;
        }
    }
}
