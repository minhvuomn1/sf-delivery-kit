---
name: experience-cloud
description: Guidance for building on Salesforce Experience Cloud (community/portal sites) — guest user access and sharing, authenticated partner/customer users, exposing LWCs to Experience Builder, navigation and site-relative URLs, and security review items (without sharing, guest data exposure, CSP, Lightning Web Security). Use this skill whenever work touches a portal, community, Experience Builder site, guest/public pages, self-registration, login flows, or LWCs meant to run on a site, even if the user just says "portal" or "trang cho đại lý / khách hàng".
---

# Experience Cloud

Experience Cloud code runs for external users, and guest pages run for anyone on the internet. A mistake that is harmless internally (a `without sharing` controller, a query without filters) can leak data from the whole org. Treat every Apex method callable from a site as a public API.

## 1. User types — know who is calling

| User | Profile / license | Typical access |
|---|---|---|
| Guest (unauthenticated) | Site Guest User profile | Public pages, registration, very limited read |
| Customer Community (Plus) | Customer Community (Plus) Login/Member | Own records, account-level via sharing sets or roles (Plus) |
| Partner Community | Partner Community | Account role hierarchy, leads/opps, more objects |

Every external user is linked to a Contact → Account. Much of the data model (dealer, franchisee, distributor) hangs off that Account, so most queries should filter by the user's Account:

```apex
Id accountId = [SELECT Contact.AccountId FROM User WHERE Id = :UserInfo.getUserId()].Contact.AccountId;
```

In LWC: `import isGuest from '@salesforce/user/isGuest';` and `import userId from '@salesforce/user/Id';`

## 2. Guest user rules

Salesforce enforces "Secure guest user record access": guest users can't own records beyond creation, org-wide defaults are Private for them, and they only see records through **guest user sharing rules** (criteria-based). Design with this in mind:

- Grant guest access through guest sharing rules and the guest profile's object/field permissions — minimum needed only.
- Guest users cannot update or delete records they don't see; records they create are assigned to a default owner.
- Avoid guest-callable Apex where possible. If needed (e.g. registration, public lookup), the class must:
  - Validate and sanitise all input (length, format, allowed values).
  - Return only the fields the page needs — use a DTO/wrapper, never return full sObjects.
  - Filter by a non-guessable key, never return "all records".
  - Consider rate limiting or reCAPTCHA for forms.
- Give Apex class access to the guest profile explicitly; missing class access is the usual "You do not have access to the Apex class" error on a site.

## 3. Sharing for authenticated users

- Customer Community: use **Sharing Sets** to grant access based on the user's Account/Contact (e.g. all Orders where `Account__c = User.Contact.AccountId`).
- Customer Community Plus / Partner: roles and sharing rules work; share groups let internal users see records owned by external users.
- Controllers default to `with sharing`. If a `without sharing` class is truly needed (e.g. reading config the user can't see), isolate it in a small inner/helper class, enforce the account filter manually, and comment why.
- Always enforce FLS (`WITH USER_MODE` / `AccessLevel.USER_MODE`) — external profiles often have narrower field access than you expect.
- Test with real external users (`System.runAs(communityUser)`) — see `apex-test-generator` for `createCommunityUser`.

## 4. Exposing LWCs to Experience Builder

```xml
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>64.0</apiVersion>
    <isExposed>true</isExposed>
    <masterLabel>Order History</masterLabel>
    <targets>
        <target>lightningCommunity__Page</target>
        <target>lightningCommunity__Default</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightningCommunity__Default">
            <property name="pageSize" type="Integer" default="10" label="Page size"/>
            <property name="recordId" type="String" default="{!recordId}" label="Record Id"/>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

- `lightningCommunity__Page` makes it draggable; `lightningCommunity__Default` enables property configuration in Builder.
- To use it on a record detail page in the site, expose `recordId` with default `{!recordId}`.
- After deploying, **publish the site** — changes don't show until published.
- Some platform features behave differently on sites: `ShowToastEvent` may not render in all templates (use inline messages), `lightning/navigation` page references differ, and `NavigationMixin` to standard record pages uses `comm__namedPage` / `standard__recordPage` depending on the template.

## 5. Navigation and URLs

- Never hard-code the site path. Use `import basePath from '@salesforce/community/basePath';` and `import communityId from '@salesforce/community/Id';`
- Navigate with `NavigationMixin` and `{ type: 'comm__namedPage', attributes: { name: 'Order_Detail__c' } }` (the page's API name from Builder).
- Static resources and images: use `@salesforce/resourceUrl`; external images need a CSP Trusted Site.

## 6. Security checklist (run before every release)

1. No guest-accessible Apex returns full sObjects or unfiltered lists.
2. Every `@AuraEnabled` method used on the site filters by the current user's Account/Contact or relies on sharing — never trusts an Id passed from the client alone. (A user can call the method with any Id from the browser console.)
3. `without sharing` classes reviewed and justified.
4. Guest profile: minimum object/field permissions, no "View All"/"Modify All", Apex class access only for required classes.
5. CSP Trusted Sites and CORS list only required domains.
6. Components work under Lightning Web Security (no reliance on `window` globals from other namespaces).
7. Site "Guest users can see and interact with the site without logging in" only enabled if required; public pages reviewed.
8. Run Salesforce Code Analyzer (`sf code-analyzer run`) and fix high-severity security findings.

## 7. Common problems

- **"Page doesn't exist" / blank component** → site not published, or component not exposed with community targets.
- **Data visible internally but not on the site** → sharing set / sharing rule / FLS on external profile, or Apex class access missing.
- **Works for admin, fails for portal user** → you tested as admin. Log in as the user (Login As on the Contact) to reproduce.
