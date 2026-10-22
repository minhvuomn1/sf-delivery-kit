/**
 * Nguồn duy nhất tạo dữ liệu test. Mở rộng thêm method khi có object mới.
 * Quy ước: có tham số doInsert; có bản đơn và bản bulk.
 */
@IsTest
public class TestDataFactory {

    public static Account createAccount(Boolean doInsert) {
        return createAccounts(1, doInsert)[0];
    }

    public static List<Account> createAccounts(Integer count, Boolean doInsert) {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < count; i++) {
            accounts.add(new Account(Name = 'Test Account ' + i));
        }
        if (doInsert) {
            insert accounts;
        }
        return accounts;
    }
}
