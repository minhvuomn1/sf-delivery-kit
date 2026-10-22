---
name: copado-deploy
description: Step-by-step process for promoting Salesforce changes from the Dev org to SIT/UAT/Production through Copado (User Story → Commit Changes → Promote → Validate/Deploy → Back-promote). Use this skill whenever the user mentions Copado, user story, promotion, pipeline, "commit changes", "deploy lên UAT/Prod", "đẩy code từ dev sang uat", release window, or asks what to include in a Copado deployment — even if they don't say "Copado" but are clearly moving metadata between environments in a team that uses it.
---

# Copado Deploy

Copado deploys what was **committed to a User Story**, not what is in the org. If a component was not selected at commit time, it will not reach UAT/Prod — most "works in Dev, missing in UAT" problems come from that one fact. So the job here is: commit the complete set, promote in order, and handle what Copado cannot carry.

> Menu names differ slightly between Copado Essentials and Copado DevOps (Classic/Lightning). Use the names below as concepts; if the user's UI differs, adapt rather than insisting.

## Workflow

### 1. Prepare the User Story (in Dev)
- One User Story per Jira ticket / feature. Put the Jira key in the story title so the release is traceable.
- Make sure Dev is the **source org** of the story and the pipeline's next environment is correct (Dev → SIT/QA → UAT → Prod).
- Run Apex tests in Dev first (`RunLocalTests`); fix failures before committing — Prod will run them again.

### 2. Commit Changes
Select every component the feature touches. Walk through these categories in order and tick what applies:
1. Objects, fields, record types, value sets, validation rules
2. Custom Metadata types **and their records**, custom settings, custom labels
3. Apex classes **with their test classes**, triggers
4. LWC / Aura, static resources, FlexiPages, layouts, quick actions
5. Flows, approval processes, email templates, sharing rules
6. Permission sets / permission set groups (profiles only if unavoidable)
7. Experience Cloud: site bundle, Network, CustomSite

Dependency check before saving the commit: for each LWC, open its Apex controller, labels, and fields it imports — every one must be in the commit or already exist in the target. When unsure, run `org-parity-check` to compare Dev against the target.

Deletions: use Copado's destructive-change option (or a `destructiveChangesPost.xml`) — never assume removing something in Dev removes it in UAT.

### 3. Promote → Validate → Deploy
- Promote to the next environment (SIT/QA → UAT → Prod). Never skip an environment; hotfixes still go through one sandbox.
- For **Prod**: run a **validation-only** deployment days before the window, with test level `RunLocalTests` (or `RunSpecifiedTests` covering the changed classes). During the window, deploy the validated package (quick deploy) — validations expire after 10 days and are void if the org changed in between.
- Read the deployment result's *first* error. See `deploy-troubleshooting` for mappings.

### 4. After the deploy
Copado does not do the manual steps. Follow `post-deploy-steps` (activate flows, assign permission sets, publish the Experience site, per-environment values, smoke test).

### 5. Back-promote
If a fix was made in UAT/Prod or a hotfix branch, back-promote it to lower environments so the next promotion does not overwrite it.

## What Copado metadata deploy does NOT carry
Data records (use Copado Data Deployer / Data Loader), user assignments, flow activation state, scheduled jobs, secrets/credentials, org-level feature toggles, and Experience site publishing. List these as manual steps in the User Story description so they are not forgotten.

## Using Claude alongside Copado
Claude in chat cannot run the deployment, but it can: review the component list for missing dependencies, build/inspect `package.xml`, explain a failed deploy log, and draft the manual-steps list. With Claude Code and an authenticated `sf` CLI it can also retrieve from Dev and diff against UAT/Prod — see `org-parity-check`. Keep Copado as the system of record for the actual promotion to UAT/Prod.

## Output when asked "what do I need to deploy?"
Give the user: (1) the component list grouped as in step 2, (2) deletions, (3) manual post-deploy steps, (4) the test classes to run. Ask for the Jira key or the component list if none is provided — do not invent component names.
