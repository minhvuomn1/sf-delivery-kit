# TriggerHandler base class

Use this if the org does not already have one. If the org has an existing framework (e.g. fflib, Kevin O'Hara's TriggerHandler), follow that instead — don't introduce a second framework.

```apex
public virtual class TriggerHandler {
    private static Set<String> bypassedHandlers = new Set<String>();
    private static Map<String, Integer> loopCountByHandler = new Map<String, Integer>();
    private static final Integer MAX_LOOP_COUNT = 5;

    public void run() {
        String handlerName = getHandlerName();
        if (!Trigger.isExecuting || bypassedHandlers.contains(handlerName)) return;

        Integer count = loopCountByHandler.containsKey(handlerName) ? loopCountByHandler.get(handlerName) : 0;
        if (count >= MAX_LOOP_COUNT) {
            throw new TriggerHandlerException('Maximum trigger recursion reached for ' + handlerName);
        }
        loopCountByHandler.put(handlerName, count + 1);

        switch on Trigger.operationType {
            when BEFORE_INSERT  { beforeInsert(); }
            when BEFORE_UPDATE  { beforeUpdate(); }
            when BEFORE_DELETE  { beforeDelete(); }
            when AFTER_INSERT   { afterInsert(); }
            when AFTER_UPDATE   { afterUpdate(); }
            when AFTER_DELETE   { afterDelete(); }
            when AFTER_UNDELETE { afterUndelete(); }
        }
    }

    public static void bypass(String handlerName)      { bypassedHandlers.add(handlerName); }
    public static void clearBypass(String handlerName) { bypassedHandlers.remove(handlerName); }
    public static Boolean isBypassed(String handlerName) { return bypassedHandlers.contains(handlerName); }

    private String getHandlerName() {
        return String.valueOf(this).substring(0, String.valueOf(this).indexOf(':'));
    }

    protected virtual void beforeInsert() {}
    protected virtual void beforeUpdate() {}
    protected virtual void beforeDelete() {}
    protected virtual void afterInsert() {}
    protected virtual void afterUpdate() {}
    protected virtual void afterDelete() {}
    protected virtual void afterUndelete() {}

    public class TriggerHandlerException extends Exception {}
}
```

Example handler:

```apex
public with sharing class AccountTriggerHandler extends TriggerHandler {
    protected override void beforeInsert() {
        AccountService.setDefaults((List<Account>) Trigger.new);
    }
    protected override void afterUpdate() {
        AccountService.handleOwnerChange(
            (List<Account>) Trigger.new, (Map<Id, Account>) Trigger.oldMap
        );
    }
}
```

Optionally add a Custom Metadata / Custom Setting check in `run()` so admins can disable a handler in production without a deploy.
