---
name: sf-mcp-deploy
description: How to deploy Salesforce metadata from Dev to UAT using the Salesforce DX MCP server in Claude Code (retrieve_metadata, deploy_metadata, Apex test tool) safely — scope check, diff review, confirmation gates, never touching Production, and syncing back with Copado. Use this skill whenever the user asks Claude Code to retrieve, deploy, validate, or test metadata through the MCP connection, says "deploy dev sang uat bằng mcp", "đẩy lên uat", "retrieve từ dev", or asks Claude to move components between their orgs directly.
---

# Salesforce MCP Deploy (Dev → UAT)

The MCP server gives Claude direct write access to a real org. That is powerful and easy to get wrong, so this skill is mostly about guardrails: know exactly what is being deployed, where, and get the user's confirmation before anything changes an org.

## 0. Preconditions — check before the first action
1. Confirm the Salesforce MCP tools are actually available (the retrieve and deploy tools and an Apex test tool). If not, tell the user to check `/mcp` and stop; do not fall back to guessing.
2. Read each tool's parameter schema before calling it — do not assume parameter names.
3. Confirm the working directory is an sfdx project (`sfdx-project.json`) on a clean or known git state: run `git status`. Uncommitted work is easy to mix into a deploy.
4. Confirm the org aliases (e.g. `dev`, `uat`) and which one is the source and which the target. If the user names Production, refuse to deploy through MCP and point to `copado-deploy`.

## 1. Define the scope
Build or ask for a manifest (`manifest/package.xml`) or an explicit component list. Never deploy "everything" by default. Run the `org-parity-check` approach if the user wants UAT to match Dev: retrieve from both, diff, then deploy only the delta. Check dependencies (fields, labels, Apex controllers behind each LWC, permission sets).

## 2. Retrieve from the source (Dev)
Use the retrieve tool with the manifest. Then show the user `git status` / `git diff --stat` and summarize what changed per type. Ask the user to confirm the set is right. This is the review gate — a deploy of wrong files cannot be undone cleanly.

## 3. Test before deploying
Run the Apex tests relevant to the changed classes against the **target** org using the testing tool (or `sf apex run test --test-level RunLocalTests -o uat` if the tool lacks options). Report failures with the first error, not the last; use `deploy-troubleshooting` to interpret them.

## 4. Deploy to the target (UAT)
- State plainly: "I am about to deploy N components (<list>) to org `uat`." Wait for an explicit yes.
- Call the deploy tool once with the confirmed scope and the target alias explicitly.
- If the tool cannot do validate-only or set a test level and the user needs that, use `sf project deploy validate` / `sf project deploy start --test-level ... -o uat` in the terminal instead.
- Report the result: succeeded/failed, component errors, test results, job ID if available.

## 5. After the deploy
- Walk the user through `post-deploy-steps` (activate flows, permission sets, publish Experience site, per-environment values). You cannot see the org's UI — mark those steps "to verify", never "done".
- Tell the user the deployment happened outside Copado, so UAT now differs from the Copado pipeline. Suggest committing the same components to a Copado User Story (see `copado-deploy`) so the next promotion does not conflict or overwrite.
- Suggest a short Jira/PR note: components, target org, date, test result.

## Hard rules
- Never deploy to Production via MCP, and never add a Production alias to the allowed orgs.
- Never deploy without showing the component list and getting a yes in this conversation turn.
- Never use destructive changes without listing what will be deleted and getting a separate confirmation.
- Never run data-changing tools (DML, user changes) as part of a metadata deploy unless the user asked for that specifically.
- If anything about the target is unclear (alias, scope, test failures), stop and ask — one question.
