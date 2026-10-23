---
name: apex-test-generator
description: Standards for writing Salesforce Apex test classes — TestDataFactory usage, @testSetup, bulk/negative/permission tests, callout mocks, Test.startTest/stopTest, coverage targets, and meaningful assertions with the Assert class. Use this skill whenever creating or fixing any Apex test class, increasing code coverage, writing tests for triggers, batch, queueable, controllers, or callouts, or when a deploy fails because of test failures or low coverage.
---

# Apex Test Generator

Tests exist to prove behaviour, not to hit a coverage number. A test that calls a method without asserting anything gives 75% coverage and zero protection. Every test method should answer: "what behaviour would break if this test failed?"

## Coverage targets

- Salesforce minimum to deploy to production: 75% org-wide, every trigger > 0%.
- Team target: **≥ 85% per class**, and 100% of business-critical paths (pricing, status transitions, integrations).
- Coverage is a side effect of testing the scenarios below, not the goal itself.

## Structure of a test class

```apex
@IsTest
private class OrderServiceTest {

    @TestSetup
    static void setup() {
        Account acc = TestDataFactory.createAccount(true);
        TestDataFactory.createOrders(acc.Id, 200, true);
    }

    @IsTest
    static void submitOrder_validDraft_setsStatusSubmitted() {
        Order__c ord = [SELECT Id FROM Order__c LIMIT 1];

        Test.startTest();
        OrderService.submit(ord.Id);
        Test.stopTest();

        Order__c result = [SELECT Status__c FROM Order__c WHERE Id = :ord.Id];
        Assert.areEqual('Submitted', result.Status__c, 'Draft order should move to Submitted');
    }
}
```

Rules:
- Class is `@IsTest private`, named `<ClassUnderTest>Test`.
- Method names follow `method_scenario_expectedResult`.
- Never use `@IsTest(SeeAllData=true)` except for the rare objects that require it; state the reason in the PR, not in code.
- Arrange (data) → Act (inside `Test.startTest()/stopTest()`) → Assert. `startTest` resets governor limits so the code under test gets its own limits; `stopTest` forces async jobs (future, queueable, batch) to finish so you can assert their results.

## TestDataFactory

All test data comes from `TestDataFactory` (template in `references/test-data-factory.md`). Don't build records inline in each test — when a required field or validation rule is added, only the factory needs updating.

Factory methods:
- Take a `Boolean doInsert` so tests can modify records before inserting.
- Provide both single and bulk versions (`createAccount`, `createAccounts(n)`).
- Fill all required fields and fields needed to pass validation rules, with realistic values.
- Allow overrides via a `Map<String, Object>` or by returning uninserted records.

If the org already has a factory, extend it instead of creating a new one.

## Scenarios every class needs

For each public method, cover as many as apply:

1. **Positive** — normal input, expected result.
2. **Bulk** — 200 records through triggers/services to prove no SOQL/DML in loops.
3. **Negative** — invalid input, missing data, business rule violation. Assert the exception or the error:
   ```apex
   try {
       OrderService.submit(null);
       Assert.fail('Expected OrderValidationException');
   } catch (OrderValidationException e) {
       Assert.isTrue(e.getMessage().contains('Order'), 'Message should mention Order');
   }
   ```
4. **Null / empty** — empty lists, null lookups.
5. **Permission** — run as a restricted user with `System.runAs()` to verify sharing and CRUD/FLS:
   ```apex
   User u = TestDataFactory.createUser('Standard User', true);
   System.runAs(u) { ... }
   ```
6. **Trigger update paths** — when logic depends on field changes, update the field and assert; also update an unrelated field and assert nothing happened.

## Assertions

Use the `Assert` class (`Assert.areEqual`, `Assert.isTrue`, `Assert.isNotNull`, `Assert.fail`). Always include a message describing the expectation — it's what shows in the deploy failure log.

Assert on outcomes, re-queried from the database: field values, record counts, related records created, exception messages. Don't assert things that can't fail (`Assert.isNotNull(new Account())`).

For bulk tests, assert across all records:
```apex
Assert.areEqual(200, [SELECT COUNT() FROM Task WHERE WhatId IN :orderIds], 'One task per order');
```

## Async, callouts, and special cases

- **Callouts**: implement `HttpCalloutMock` and call `Test.setMock(HttpCalloutMock.class, new MyMock(200, body))` before `Test.startTest()`. Test at least one success and one error response (e.g. 500, timeout).
- **Batch**: `Database.executeBatch(new MyBatch(), 200)` inside start/stop; the test runs only one `execute` chunk, so keep test data ≤ batch size.
- **Schedulable**: schedule with a CRON string inside start/stop, assert the `CronTrigger` exists, and test the logic it calls separately.
- **Platform events**: `Test.getEventBus().deliver()` to deliver published events.
- **Custom Metadata**: can't be inserted in tests; wrap access in a class you can override, or rely on existing records.
- **`@AuraEnabled` methods**: test that `AuraHandledException` is thrown with the expected message. Set the message with `setMessage()` in production code, otherwise `getMessage()` returns "Script-thrown exception".

## Output

When generating a test class, also state briefly which scenarios are covered and any branch you could not cover and why.
