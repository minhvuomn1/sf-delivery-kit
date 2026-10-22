# Shared LWC utilities

`lwc/utils/utils.js` (set `isExposed` false in its meta file):

```js
/**
 * Normalises Apex, LDS, and JS errors into an array of readable messages.
 */
export function reduceErrors(errors) {
    if (!Array.isArray(errors)) errors = [errors];
    return errors
        .filter((error) => !!error)
        .map((error) => {
            // UI API read errors
            if (Array.isArray(error.body)) return error.body.map((e) => e.message);
            // Page-level DML errors
            if (error?.body?.pageErrors?.length) return error.body.pageErrors.map((e) => e.message);
            // Field-level DML errors
            if (error?.body?.fieldErrors && Object.keys(error.body.fieldErrors).length) {
                return Object.values(error.body.fieldErrors).flat().map((e) => e.message);
            }
            // Output (UI API) errors
            if (error?.body?.output?.errors?.length) return error.body.output.errors.map((e) => e.message);
            // Apex / network errors
            if (typeof error?.body?.message === 'string') return error.body.message;
            // JS errors
            if (typeof error.message === 'string') return error.message;
            return error.statusText || 'Unknown error';
        })
        .flat()
        .filter((message) => !!message);
}
```

Preferred toast usage in components:

```js
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
}
```

Import: `import { reduceErrors } from 'c/utils';`
