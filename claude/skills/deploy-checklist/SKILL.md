---
name: deploy-checklist
description: Salesforce deployment process for the team — retrieving/deploying with the sf CLI, building package.xml manifests, validating (dry-run) with the right test level, quick deploy, destructive changes, metadata deploy order, environment promotion order (Dev → SIT/QA → UAT → Production), and pre/post-deploy steps. Use this skill whenever the user wants to deploy, validate, retrieve, build a package.xml, move changes between orgs/sandboxes, prepare a release, or debug a failed deployment.
---

# Deploy Checklist

Deployments fail for predictable reasons: missing dependencies, test failures in production, and metadata that exists in one org but not another. This process catches those before the production window, not during it.

## 1. Environment order

```
Developer sandbox / scratch org
        ↓  (PR merged)
SIT / QA (integration testing)
        ↓
UAT (business sign-off)
        ↓
Production  (validate early, quick deploy in the release window)
```

Never deploy to a later environment something that hasn't passed the previous one. Hotfixes still go through at least one sandbox, then must be back-ported to lower environments so they don't get overwritten.

## 2. Before deploying

- [ ] Code merged to the release branch and reviewed.
- [ ] All Apex tests pass locally/in sandbox: `sf apex run test --test-level RunLocalTests --code-coverage --result-format human --wait 30 -o <alias>`
- [ ] Coverage ≥ 75% org-wide and ≥ team target per changed class.
- [ ] Manifest contains every changed component and its dependencies (see §4).
- [ ] Manual pre-deploy steps listed (e.g. create a record type, enable a feature, data prep).
- [ ] Target org has no conflicting changes made directly in the org (retrieve and diff if unsure).
- [ ] Run static analysis: `sf code-analyzer run --target force-app` and review high-severity findings.

## 3. Commands (sf CLI v2)

```bash
# Authenticate
sf org login web -a uat -r https://test.salesforce.com
sf org login web -a prod -r https://login.salesforce.com

# Retrieve
sf project retrieve start --manifest manifest/package.xml -o dev
sf project retrieve start --metadata ApexClass:OrderService LightningComponentBundle:orderLineEditor -o dev

# Generate manifest from source
sf project generate manifest --source-dir force-app --name manifest/package.xml

# Validate only (no changes saved) — do this against production days before release
sf project deploy validate --manifest manifest/package.xml --test-level RunLocalTests -o prod --wait 60
#   or with specific tests (faster, must still cover the deployed classes):
sf project deploy validate --manifest manifest/package.xml \
  --test-level RunSpecifiedTests --tests OrderServiceTest --tests OrderLineControllerTest -o prod

# Quick deploy a successful validation (within 10 days, no org changes in between)
sf project deploy quick --job-id <validationJobId> -o prod

# Normal deploy to sandbox
sf project deploy start --manifest manifest/package.xml --test-level RunLocalTests -o uat

# With destructive changes
sf project deploy start --manifest manifest/package.xml \
  --post-destructive-changes manifest/destructiveChangesPost.xml -o uat

# Check status / report
sf project deploy report --job-id <jobId> -o prod
```

Test levels: `NoTestRun` (sandbox only, non-Apex changes), `RunSpecifiedTests`, `RunLocalTests` (default for production when Apex is included), `RunAllTestsInOrg`.

Always pass `-o <alias>` explicitly — never rely on the default org when deploying.

## 4. Manifests and dependency order

Templates are in `references/manifests.md`. A single deploy handles most ordering automatically, but when splitting into multiple deploys or when a deploy fails with "no such column/invalid type", deploy in this order:

1. Custom Objects, Custom Fields, Record Types, Global Value Sets
2. Custom Metadata Types (and records), Custom Settings, Custom Labels
3. Apex Classes (non-test and test together), then Apex Triggers
4. LWC / Aura components, Visualforce, Static Resources
5. Flows, Validation Rules, Layouts, Lightning Pages (FlexiPage)
6. Permission Sets, Profiles (field/class access), Permission Set Groups
7. Experience Cloud: `ExperienceBundle`/`DigitalExperienceBundle`, Network, CustomSite — then publish the site

Common gotchas:
- Profiles deployed alone overwrite only included permissions; prefer Permission Sets.
- Flows deploy as new versions; set them active via `FlowDefinition` or activate manually.
- Picklist values used in Apex/validation rules must be in the target first.
- Deleting a field referenced by code → remove the reference first, then delete via `destructiveChangesPost.xml`.

## 5. After deploying

- [ ] Run manual post-deploy steps (assign permission sets, activate flows, schedule jobs, publish Experience site, update Custom Metadata values per environment).
- [ ] Smoke test the key flows (login as an end user, not only admin).
- [ ] Check Setup → Deployment Status and Apex Jobs for errors.
- [ ] Update the Jira ticket(s) with the deploy job ID and environment (see `jira-to-code-workflow`).
- [ ] Tag the release in git.

## 6. When a deploy fails

Read the first error, not the last — later errors are often caused by the first. Map common messages:

| Error | Usual cause | Fix |
|---|---|---|
| `No such column 'X__c'` / `Invalid type` | Field/class not in target | Add dependency to manifest |
| `Code coverage ... 75%` | Missing or failing tests in target | Run tests in target, add tests |
| Test failure only in prod | Validation rule / data / required field differs | Use TestDataFactory, don't rely on org data |
| `Cannot change type of field` | Field type changed | Manual change or new field |
| `Entity is locked` / flow version errors | Active flow / running job | Deactivate or wait |
