---
name: apex-conventions
description: Team coding standards for writing and reviewing Salesforce Apex — trigger handler pattern, bulkification, naming, exception handling, security (CRUD/FLS, sharing), and avoiding SOQL/DML inside loops. Use this skill whenever writing, refactoring, or reviewing any Apex class, trigger, batch, queueable, schedulable, or @AuraEnabled controller, even if the user only says "write a method", "fix this trigger", or "add logic when a record is created".
---

# Apex Conventions

These rules exist because Salesforce enforces governor limits per transaction and our code runs in shared, multi-tenant orgs. Most production bugs we see come from code that works for 1 record in the UI but fails for 200 records from Data Loader, an integration, or a Flow. Write every piece of Apex as if it will receive a list of 200 records.

## 1. Trigger architecture

One trigger per object. The trigger contains no logic — it only delegates to a handler.

```apex
trigger AccountTrigger on Account (
    before insert, before update, before delete,
    after insert, after update, after delete, after undelete
) {
    new AccountTriggerHandler().run();
}
```

The handler extends the shared `TriggerHandler` base class (see `references/trigger-handler-base.md`). Business logic lives in service classes, not in the handler, so it can be reused from batch jobs, LWC controllers, and tests.

```
AccountTrigger            → only calls handler
AccountTriggerHandler     → routes events (beforeInsert, afterUpdate...)
AccountService            → business logic, reusable
AccountSelector           → SOQL queries (optional but recommended)
```

In `afterUpdate`, only process records whose relevant fields actually changed — compare `Trigger.newMap` against `Trigger.oldMap`. This prevents unnecessary work and recursion.

```apex
public override void afterUpdate() {
    Map<Id, Account> oldMap = (Map<Id, Account>) Trigger.oldMap;
    List<Account> changed = new List<Account>();
    for (Account acc : (List<Account>) Trigger.new) {
        if (acc.OwnerId != oldMap.get(acc.Id).OwnerId) {
            changed.add(acc);
        }
    }
    if (!changed.isEmpty()) {
        AccountService.reassignOpenCases(changed);
    }
}
```

Use the handler's bypass mechanism (`TriggerHandler.bypass('AccountTriggerHandler')`) for data migrations instead of commenting out code.

## 2. Bulkification — no SOQL/DML in loops

The pattern is always: **collect → query once → build a map → loop → DML once**.

Bad:
```apex
for (Contact c : contacts) {
    Account a = [SELECT Id, Name FROM Account WHERE Id = :c.AccountId]; // SOQL in loop
    c.Description = a.Name;
    update c;                                                         // DML in loop
}
```

Good:
```apex
Set<Id> accountIds = new Set<Id>();
for (Contact c : contacts) {
    if (c.AccountId != null) accountIds.add(c.AccountId);
}
Map<Id, Account> accounts = new Map<Id, Account>(
    [SELECT Id, Name FROM Account WHERE Id IN :accountIds WITH USER_MODE]
);
for (Contact c : contacts) {
    Account a = accounts.get(c.AccountId);
    if (a != null) c.Description = a.Name;
}
update contacts;
```

Also watch for hidden loops: calling a method that runs SOQL from inside a `for` loop is still SOQL in a loop. When reviewing code, trace method calls, not just the literal loop body.

Other limit-aware habits:
- Use `Map<Id, List<Child__c>>` to group children by parent instead of nested queries per parent.
- Query only the fields you need. Avoid `SELECT` of long text / rich text fields unless required.
- For > 10,000 records or long work, use Batch Apex or Queueable, not a synchronous loop.
- Use `Limits.getQueries()` / `Limits.getDmlStatements()` in debug logs when investigating limit issues.

## 3. Naming

| Item | Convention | Example |
|---|---|---|
| Class | PascalCase, suffix by role | `OrderService`, `OrderSelector`, `OrderTriggerHandler`, `OrderController` |
| Batch / Queueable / Schedulable | suffix `Batch`, `Queueable`, `Schedulable` | `SyncInventoryBatch` |
| Test class | `<ClassName>Test` | `OrderServiceTest` |
| Method / variable | camelCase, verb for methods | `calculateTotal()`, `orderLines` |
| Constant | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Collections | plural or suffix by type | `accounts`, `accountsById`, `accountIdSet` |
| Custom exception | suffix `Exception` | `OrderValidationException` |

Don't use abbreviations that only you understand (`accLst`, `tmpMap2`). Name maps by their key: `accountsById`, `linesByOrderId`.

## 4. Exception handling

- Never swallow exceptions with an empty `catch`. At minimum log them.
- Catch specific exceptions (`DmlException`, `QueryException`, `CalloutException`) before `Exception`.
- For partial success, use `Database.insert(records, false)` and inspect `Database.SaveResult` instead of wrapping everything in try/catch.
- In `@AuraEnabled` methods, catch and rethrow as `AuraHandledException` with a user-friendly message so LWC receives a readable error. Log the technical detail separately.

```apex
@AuraEnabled
public static void submitOrder(Id orderId) {
    try {
        OrderService.submit(orderId);
    } catch (OrderValidationException e) {
        throw new AuraHandledException(e.getMessage());
    } catch (Exception e) {
        Logger.error('submitOrder failed', e); // use the team's logging utility
        AuraHandledException ex = new AuraHandledException('Không thể gửi đơn hàng. Vui lòng thử lại.');
        ex.setMessage('Không thể gửi đơn hàng. Vui lòng thử lại.'); // setMessage so tests can assert it
        throw ex;
    }
}
```

- Define custom exceptions for business rule failures: `public class OrderValidationException extends Exception {}`.
- In triggers, prefer `record.addError('message')` for validation so the user sees the error on the record, rather than throwing.

## 5. Security

- Declare sharing explicitly on every class: `with sharing` by default. Use `without sharing` only with a comment explaining why, and keep that class as small as possible. Use `inherited sharing` for utility classes.
- Enforce CRUD/FLS in user-facing code: `WITH USER_MODE` on SOQL, `Database.insert(records, AccessLevel.USER_MODE)` for DML, or `Security.stripInaccessible()` when you need to drop fields silently.
- Never build dynamic SOQL by concatenating user input. Use bind variables (`Database.queryWithBinds`) or `String.escapeSingleQuotes()`.
- No hardcoded Ids, URLs, or credentials. Use Custom Metadata, Custom Settings, Named Credentials, or `Schema.SObjectType.X.getRecordTypeInfosByDeveloperName()`.

## 6. General style

- Keep methods short and single-purpose. If a method needs a comment explaining each block, split it.
- Put magic numbers and picklist values into constants.
- Use `Assert` / `System.assert` only in tests, never in production logic.
- Avoid `System.debug` spam in committed code; leave only meaningful debug at key points.
- Async: don't chain unbounded Queueables; don't call `@future` from `@future` or batch.

## Review checklist

When reviewing or finishing code, check each item and report issues found:

1. Any SOQL or DML inside a loop (including via called methods)?
2. Does it work with 200 records? With null lookups?
3. Is the trigger logic-free and routed through the handler?
4. Is sharing declared? Is CRUD/FLS enforced for user-facing paths?
5. Are exceptions handled (not swallowed), and are `@AuraEnabled` errors readable?
6. Any hardcoded Ids or strings that should be config?
7. Is there a test class following `apex-test-generator`?
