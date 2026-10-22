# TestDataFactory template

Adapt field names to the org. Keep it `@IsTest` so it doesn't count against code size or coverage.

```apex
@IsTest
public class TestDataFactory {

    private static Integer uniqueCounter = 0;
    private static String nextUnique() {
        uniqueCounter++;
        return String.valueOf(uniqueCounter) + String.valueOf(Datetime.now().getTime()).right(6);
    }

    // ---------- Account ----------
    public static Account createAccount(Boolean doInsert) {
        return createAccounts(1, doInsert)[0];
    }

    public static List<Account> createAccounts(Integer count, Boolean doInsert) {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < count; i++) {
            accounts.add(new Account(
                Name = 'Test Account ' + nextUnique(),
                Phone = '0900000000'
            ));
        }
        if (doInsert) insert accounts;
        return accounts;
    }

    // ---------- Contact ----------
    public static List<Contact> createContacts(Id accountId, Integer count, Boolean doInsert) {
        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < count; i++) {
            contacts.add(new Contact(
                AccountId = accountId,
                LastName = 'Test ' + nextUnique(),
                Email = 'test' + nextUnique() + '@example.com'
            ));
        }
        if (doInsert) insert contacts;
        return contacts;
    }

    // ---------- User ----------
    public static User createUser(String profileName, Boolean doInsert) {
        Profile p = [SELECT Id FROM Profile WHERE Name = :profileName LIMIT 1];
        String u = nextUnique();
        User usr = new User(
            ProfileId = p.Id,
            LastName = 'Test' + u,
            Email = 'user' + u + '@example.com',
            Username = 'user' + u + '@example.com.test',
            Alias = ('u' + u).left(8),
            TimeZoneSidKey = 'Asia/Ho_Chi_Minh',
            LocaleSidKey = 'vi_VN',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
        if (doInsert) insert usr;
        return usr;
    }

    public static void assignPermissionSet(Id userId, String permSetName) {
        PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = :permSetName LIMIT 1];
        insert new PermissionSetAssignment(AssigneeId = userId, PermissionSetId = ps.Id);
    }

    // ---------- Community / Experience Cloud user ----------
    // Portal users need a Contact on an Account whose owner has a role.
    public static User createCommunityUser(String profileName, Boolean doInsert) {
        Account acc = createAccount(true);
        Contact con = createContacts(acc.Id, 1, true)[0];
        User usr = createUser(profileName, false);
        usr.ContactId = con.Id;
        if (doInsert) insert usr;
        return usr;
    }
}
```

Note: inserting a User and non-setup objects in the same transaction causes MIXED_DML_OPERATION. Insert users inside `System.runAs(new User(Id = UserInfo.getUserId()))` or in `@TestSetup` separately.

Callout mock template:

```apex
@IsTest
public class HttpMock implements HttpCalloutMock {
    private Integer statusCode;
    private String body;
    public HttpMock(Integer statusCode, String body) {
        this.statusCode = statusCode;
        this.body = body;
    }
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(statusCode);
        res.setHeader('Content-Type', 'application/json');
        res.setBody(body);
        return res;
    }
}
```
