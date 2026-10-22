---
name: post-deploy-steps
description: Checklist of the manual steps and smoke tests that must happen after a Salesforce deployment to UAT or Production, because metadata deploys (including Copado) do not do them — activating flows, assigning permission sets, publishing Experience Cloud sites, setting per-environment Custom Metadata/credentials, scheduling jobs, loading data. Use this skill whenever the user finishes or plans a deploy, asks "deploy xong rồi làm gì tiếp", "what do I do after deploying", or reports that something is deployed but not working in the target org.
---

# Post-Deploy Steps

A successful deployment means the metadata arrived, not that the feature works. The gap is almost always one of the items below. Work through them in order and report each as done / not needed / blocked.

## 1. Verify the deployment itself
- Setup → Deployment Status shows Succeeded; note the job ID (also in Copado's deployment record).
- Setup → Apex Jobs and Apex Test Execution show no new failures.

## 2. Activation and access
- **Flows:** deployed as a new version — confirm the intended version is Active (or activate it). Check no older version still runs.
- **Permission sets / groups:** assign to the right users or groups. A component can exist and still be invisible without access.
- **Field-level security and object access:** confirm through a permission set, not only the admin profile.
- **Page assignments:** FlexiPage activation (app / record page / app-record-profile) can need setting in the target.

## 3. Per-environment configuration
- Custom Metadata and Custom Setting **values** (endpoints, feature flags, thresholds) — set the target's values, not Dev's.
- Named/External Credentials, Remote Site Settings, Connected App secrets and callback URLs.
- Org-wide email addresses, email deliverability, and integration user setup.
- Scheduled Apex: schedule or reschedule; check it is not duplicated.

## 4. Experience Cloud (if the release touches a site)
- **Publish** the site after deploying the bundle — deployed but unpublished changes are invisible to visitors.
- Check guest-user profile access, sharing rules for guest/portal users, member/profile assignments, navigation menus, and any CSP trusted sites.
- Test by logging in as a real external user (or "Log in to Experience as User"), not as admin.

## 5. Data
- Load reference data or seed records the feature needs (Copado Data Deployer or Data Loader). Remember record IDs differ between orgs — avoid hard-coded IDs in code and flows.

## 6. Smoke test
Log in as an end user of each affected persona and run the main path of the feature end to end, then one negative case (missing permission, empty data). Capture screenshots for the UAT sign-off.

## 7. Close the loop
- Update the Jira ticket with environment, deploy job ID, and manual steps performed.
- Tag the release in git; back-promote any fixes made directly in the target.

## Output format
Return the checklist filled for the user's actual release (only the sections that apply), with who must do each step and which ones are blocked waiting on an admin. Do not claim a step was done — you cannot see the org; mark it "to verify".
