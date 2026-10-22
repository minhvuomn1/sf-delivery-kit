---
name: deploy-troubleshooting
description: Diagnose failed Salesforce deployments and validations (Copado, sf CLI, change sets) — reads the error log, finds the root cause, and gives the fix or rollback path. Use this skill whenever the user pastes a deploy error, mentions "deploy failed", "validation failed", code coverage errors, "No such column", "Invalid type", test failures only in Prod, "entity is locked", flow version errors, or asks how to roll back a deployment.
---

# Deploy Troubleshooting

Read the **first** error, not the last. Later errors are usually knock-on effects of the first (a missing field breaks the class, which breaks the test, which breaks coverage).

## Method
1. Ask for the full error output (Copado deployment log or `sf project deploy report --job-id <id>`) if the user gave only a summary.
2. Separate *component errors* (metadata couldn't be saved) from *test errors* (Apex tests failed) and from *coverage errors* (below 75% org-wide, or per-class target).
3. Find the first component error, map it with the table, state the cause in one sentence, give the fix, and say how to re-run (re-validate before the real deploy in Prod).

## Error map
| Error | Usual cause | Fix |
|---|---|---|
| `No such column 'X__c'`, `Invalid type`, `Variable does not exist` | Field/class/object missing in target | Add the dependency to the commit/manifest; deploy it first |
| `Code coverage ... 75%` / class below target | Tests missing or failing in target | Include test classes; run tests in target; add tests with TestDataFactory |
| Tests pass in Dev, fail in Prod/UAT | Different validation rules, required fields, triggers, flows, or reliance on org data | Create data in the test; remove `SeeAllData`; mirror the target's required fields |
| `Cannot change type of field` / `field in use` | Type change or field referenced elsewhere | Create a new field, migrate, then retire the old one; remove references first |
| `Entity is locked` / flow or job lock | Active flow version, running batch, or pending deployment | Wait for the job, abort it, or deactivate then redeploy |
| `Flow ... cannot be deployed` / missing referenced element | Flow references a field, Apex action, or subflow not in target | Deploy the dependency first; check `FlowDefinition` for active version |
| `In field: ... no ... named X found` in layouts / FlexiPage / permission set | Referenced component absent in target | Add the component, or remove the reference from the file |
| Picklist value not found | Value used by code/validation not yet in target | Deploy the value set / picklist first |
| `Insufficient access` / `INSUFFICIENT_ACCESS_OR_READONLY` | Deploying user lacks permission | Use a user with Modify Metadata / Author Apex, or fix the integration user in Copado credentials |
| Validation rule/trigger fires during test | Target has stricter rules | Fix test data; don't disable rules in Prod |
| Experience site deploy errors on branding/theme/navigation | Bundle references a missing asset or Network setting | Deploy Network/CustomSite and static resources with it; retrieve first to see the bundle type |
| Quick deploy fails: no valid validation | Validation older than 10 days or org changed | Re-run validation |

## Rollback
Salesforce has no automatic rollback after a successful deploy. Options, in order of preference:
1. Fix forward with a small hotfix through the pipeline (preferred).
2. Re-deploy the previous version from the git tag / previous commit through the same pipeline.
3. For Flows: activate the previous version. For permission or config issues: revert the specific item manually.
4. Never "fix" in the Prod UI without back-porting afterward.

## Rules
- Do not suggest `NoTestRun` or disabling tests for Prod.
- Do not suggest editing Prod directly unless the user explicitly describes an emergency; if so, require back-promotion.
- If the error text is unclear or truncated, ask for it rather than guessing.
