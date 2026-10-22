# Manifest templates

Replace the API version with the one in `sfdx-project.json` (`sourceApiVersion`).

## package.xml — typical feature release

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Order__c.Status__c</members>
        <members>Order__c.Total_Amount__c</members>
        <name>CustomField</name>
    </types>
    <types>
        <members>OrderService</members>
        <members>OrderServiceTest</members>
        <members>OrderLineController</members>
        <members>OrderLineControllerTest</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>OrderTrigger</members>
        <name>ApexTrigger</name>
    </types>
    <types>
        <members>orderLineEditor</members>
        <members>utils</members>
        <name>LightningComponentBundle</name>
    </types>
    <types>
        <members>Order_Submit_Flow</members>
        <name>Flow</name>
    </types>
    <types>
        <members>Order_Manager</members>
        <name>PermissionSet</name>
    </types>
    <types>
        <members>Order_Error_Message</members>
        <name>CustomLabel</name>
    </types>
    <version>64.0</version>
</Package>
```

## package.xml — retrieve everything of common types (for diff/backup)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types><members>*</members><name>ApexClass</name></types>
    <types><members>*</members><name>ApexTrigger</name></types>
    <types><members>*</members><name>LightningComponentBundle</name></types>
    <types><members>*</members><name>AuraDefinitionBundle</name></types>
    <types><members>*</members><name>CustomObject</name></types>
    <types><members>*</members><name>Flow</name></types>
    <types><members>*</members><name>PermissionSet</name></types>
    <types><members>*</members><name>CustomLabels</name></types>
    <types><members>*</members><name>StaticResource</name></types>
    <types><members>*</members><name>CustomMetadata</name></types>
    <types><members>*</members><name>FlexiPage</name></types>
    <version>64.0</version>
</Package>
```

Note: `*` does not retrieve standard objects' custom fields via `CustomObject` for all types — list standard objects (Account, Contact...) explicitly if needed.

## Experience Cloud

```xml
<types><members>My_Portal1</members><name>DigitalExperienceBundle</name></types>
<types><members>My_Portal</members><name>Network</name></types>
<types><members>My_Portal</members><name>CustomSite</name></types>
```

(Older sites use `ExperienceBundle` instead of `DigitalExperienceBundle`. Retrieve first to see which the org uses.)

## destructiveChangesPost.xml

Deploy together with a package.xml (can be empty of types, only `<version>`).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>OldOrderHelper</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>Order__c.Legacy_Code__c</members>
        <name>CustomField</name>
    </types>
    <version>64.0</version>
</Package>
```
