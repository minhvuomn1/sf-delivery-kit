---
name: org-parity-check
description: Compare a Salesforce source org (Dev) against a target (UAT/Prod) and produce the list of metadata that must be deployed to make the target match — including what to leave out and what cannot be deployed. Use this skill whenever the user wants UAT or Prod to be "giống Dev", asks what is different between orgs, wants a full list of what to deploy, a package.xml for syncing orgs, or is debugging "works in Dev but not in UAT/Prod".
---

# Org Parity Check

"Make UAT/Prod identical to Dev" sounds like "deploy everything", but a blind full deploy overwrites changes made directly in the target and drags along things that must differ per environment. The right approach is **retrieve → diff → classify → deploy only the delta**.

## Process

1. **Scope.** Decide which metadata types matter (start from `references/metadata-types.md`). A full-org diff is noisy; scope to the feature area or to the types the team owns (Apex, LWC, objects/fields, flows, permission sets, Experience Cloud).
2. **Retrieve from both orgs** with the same manifest so formats match. Use `scripts/diff_orgs.sh <manifest> <source-alias> <target-alias>`; it must run inside an sfdx project. It writes `org-diff/report.txt` with three groups: only in source, only in target, differs.
3. **Classify every difference:**
   - *Only in source* → candidate to deploy (new feature).
   - *Differs* → read the diff. Decide: Dev is newer (deploy), target has a direct change (stop — ask the user, back-port it first), or it is environment-specific (ignore).
   - *Only in target* → do not delete blindly. Ask the user whether it is obsolete; deletions go through `destructiveChangesPost.xml`.
4. **Build the manifest** from the "deploy" bucket. Add dependencies the diff missed (see dependency order in the `deploy-checklist` skill).
5. **Hand off** to `copado-deploy` (commit these components into a User Story) or to `sf project deploy validate` for a quick check against the target.
6. **List the non-deployable items** the user must do by hand — see `post-deploy-steps`.

## Things that legitimately differ per environment (don't sync them)
Named credentials/endpoints, Remote Site URLs pointing at test systems, Custom Metadata or Custom Setting *values* that hold environment config, email deliverability, org-wide email addresses, scheduled jobs, user records and their assignments, sandbox-only test data, Connected App secrets.

## Noise to expect in diffs
Profile and permission-set files reorder entries; flows carry version numbers; layouts and FlexiPages reorder sections; `lastModified*` is not in source files but whitespace sometimes is. Judge by meaning, not by line count.

## Report format
Present a table the user can act on:

| Component | Type | Status | Action |
|---|---|---|---|
| OrderService | ApexClass | differs (Dev newer) | deploy |
| Order__c.Status__c | CustomField | only in Dev | deploy |
| Legacy_Report | Report | only in UAT | ask user |

Close with the manual steps and a recommended test level for the target. State clearly if Prod parity needs a validation-only run first.
