---
name: lwc-patterns
description: Team patterns for building Lightning Web Components — folder/component structure, choosing @wire vs imperative Apex, refreshing data with refreshApex / notifyRecordUpdateAvailable / getRecordNotifyChange replacement, error handling with toasts and reduceErrors, parent-child communication, and SLDS styling. Use this skill whenever creating, editing, debugging, or reviewing any LWC (.js, .html, .css, .js-meta.xml), including datatables with inline editing, forms, modals, or when data "doesn't refresh" after save.
---

# LWC Patterns

## 1. Component structure

```
force-app/main/default/lwc/
  orderLineEditor/
    orderLineEditor.html
    orderLineEditor.js
    orderLineEditor.css          (only if SLDS isn't enough)
    orderLineEditor.js-meta.xml
    __tests__/orderLineEditor.test.js
  utils/                          shared helpers (reduceErrors, formatters)
```

- Name in camelCase; the tag becomes kebab-case (`<c-order-line-editor>`).
- Split by responsibility: a **container** component loads data and handles save; **presentational** children receive data via `@api` and emit events. This keeps children reusable and easy to test.
- Keep a component under ~300 lines of JS. If it grows, extract children or a helper module.
- Put shared logic in a service module (`utils/`) and import it, rather than copy-pasting.

## 2. Calling Apex: @wire or imperative?

| Use `@wire` when | Use imperative when |
|---|---|
| Reading data to display | Writing data (insert/update/delete) |
| Data should reload automatically when reactive params (`$recordId`) change | Call must happen on user action (button click, search submit) |
| Result can be cached (`cacheable=true`) | Method does DML (can't be cacheable) |
| | You need to control timing or chain calls |

Wire (Apex must be `@AuraEnabled(cacheable=true)`):
```js
import { LightningElement, api, wire } from 'lwc';
import getLines from '@salesforce/apex/OrderLineController.getLines';

export default class OrderLineEditor extends LightningElement {
    @api recordId;
    lines;
    error;
    wiredLinesResult; // keep the full result for refreshApex

    @wire(getLines, { orderId: '$recordId' })
    wiredLines(result) {
        this.wiredLinesResult = result;
        const { data, error } = result;
        if (data) {
            this.lines = data;
            this.error = undefined;
        } else if (error) {
            this.error = reduceErrors(error);
            this.lines = undefined;
        }
    }
}
```

Imperative:
```js
import saveLines from '@salesforce/apex/OrderLineController.saveLines';

async handleSave() {
    this.isLoading = true;
    try {
        await saveLines({ lines: this.draftValues });
        this.showToast('Thành công', 'Đã lưu', 'success');
        await this.refreshData();
    } catch (error) {
        this.showToast('Lỗi', reduceErrors(error).join(', '), 'error');
    } finally {
        this.isLoading = false;
    }
}
```

Parameters passed to Apex must match the Apex parameter names exactly. Pass plain objects; for complex input, use an Apex wrapper class or JSON string.

## 3. Refreshing data after save

This is the most common bug source. Pick the right tool:

- **Data from an Apex `@wire`** → `refreshApex(this.wiredLinesResult)`. You must pass the *entire* object the wire provisioned (stored above), not `data`. Refreshing does nothing for data loaded imperatively.
- **Data from Lightning Data Service** (`getRecord`, `lightning-record-form`, related lists, the record page highlights) after you changed records via Apex → `notifyRecordUpdateAvailable([{ recordId }])` from `lightning/uiRecordApi`. This tells LDS the records changed so the standard UI and `getRecord` wires reload. (`getRecordNotifyChange` is deprecated.)
- **Both** → do both: `await notifyRecordUpdateAvailable(...)` then `await refreshApex(...)`.
- **Data loaded imperatively** → just call the imperative method again.
- **Child components** → if the parent owns the data, refresh in the parent and pass new data down; or expose an `@api refresh()` method on the child.

```js
import { refreshApex } from '@salesforce/apex';
import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';

async refreshData() {
    await notifyRecordUpdateAvailable([{ recordId: this.recordId }]);
    await refreshApex(this.wiredLinesResult);
}
```

For `lightning-datatable` inline edit: after save, clear `this.draftValues = []` and then refresh, otherwise stale drafts stay on screen.

Remember cacheable wires are cached client-side; if data changed on the server by another process, only `refreshApex` (or new params) reloads it.

## 4. Error handling

Use a shared `reduceErrors` helper (see `references/utils.md`) — Apex, LDS, and JS errors all have different shapes.

- Show user-facing errors with `ShowToastEvent` (`lightning/platformShowToastEvent`) or inline in the template for form fields. Note: toasts don't display in some Experience Cloud contexts or standalone apps — use an inline error panel there.
- Always reset loading state in `finally`.
- Never `console.log` errors and continue silently.
- Apex side should throw `AuraHandledException` with a readable message (see `apex-conventions`).

## 5. Communication between components

- **Parent → child**: `@api` properties. Treat them as read-only in the child; copy before mutating (`this.localLines = [...this.lines]` or `structuredClone`).
- **Child → parent**: `this.dispatchEvent(new CustomEvent('linechange', { detail: { id, value } }))`. Event names lowercase, no hyphens. Put only plain data in `detail`.
- **Unrelated components** (e.g. across the page): Lightning Message Service with a message channel. Avoid pubsub.

## 6. Reactivity gotchas

- Fields are reactive, but mutating a nested object/array in place may not re-render. Reassign: `this.lines = this.lines.map(l => l.id === id ? { ...l, qty } : l);`
- Data from `@wire` is read-only (frozen). Clone before editing.
- Use getters for derived values instead of recomputing in handlers.
- Don't do heavy work in `renderedCallback`; guard it with a flag if you must.

## 7. SLDS and styling

- Use base components (`lightning-button`, `lightning-input`, `lightning-datatable`, `lightning-card`, `lightning-modal`) before writing custom markup.
- Use SLDS utility classes (`slds-m-around_medium`, `slds-grid`, `slds-col`, `slds-text-heading_small`) for spacing/layout rather than custom CSS.
- For custom colours, use styling hooks (`--slds-c-button-brand-color-background`, `--slds-g-color-*`) instead of hard-coded hex values, so the component respects themes (important for Experience Cloud branding).
- Shadow DOM prevents styling base component internals with CSS selectors; use hooks.
- For modals, extend `LightningModal` (`lightning/modal`) instead of building your own.

## 8. Meta file

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>64.0</apiVersion><!-- match the project's sfdx-project.json sourceApiVersion -->
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <objects><object>Order__c</object></objects>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

Only set `isExposed` to true for components meant to be dropped onto pages. For Experience Cloud targets see the `experience-cloud` skill.

## Review checklist

1. Wire vs imperative chosen correctly? Cacheable only for read-only methods?
2. After every save: correct refresh path, draft values cleared, loading state reset?
3. All errors go through `reduceErrors` and are shown to the user?
4. No in-place mutation of `@api` or wired data?
5. SLDS/base components used; no hard-coded colours?
6. Jest test for key behaviour if the project uses Jest?
