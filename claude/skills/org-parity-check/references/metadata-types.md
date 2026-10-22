# Metadata types to compare

Tick the ones in scope. Names are Metadata API type names (for `package.xml`).

## Data model
CustomObject, CustomField, RecordType, GlobalValueSet, StandardValueSet, ValidationRule, CustomObjectTranslation (if used)

## Configuration
CustomMetadata (types and records), CustomLabels, CustomSetting (as CustomObject), NamedCredential, ExternalCredential, RemoteSiteSetting, CspTrustedSite, CustomPermission

## Code
ApexClass, ApexTrigger, ApexComponent, ApexPage

## UI
LightningComponentBundle, AuraDefinitionBundle, StaticResource, FlexiPage, Layout, QuickAction, CustomTab, CustomApplication, ListView

## Automation
Flow, FlowDefinition, ApprovalProcess, EmailTemplate, SharingRules, AssignmentRules, AutoResponseRules, EscalationRules

## Access
PermissionSet, PermissionSetGroup, Profile, Role, Group, Queue

## Experience Cloud
DigitalExperienceBundle (or ExperienceBundle in older sites), Network, CustomSite, SiteDotCom, NavigationMenu, ManagedContentType

## Integration
ConnectedApp, AuthProvider, PlatformEventChannel, PlatformEventChannelMember, ExternalDataSource

## Usually exclude from sync
User, scheduled jobs (CronTrigger), Reports/Dashboards in personal folders, org-level settings that differ by edition, anything holding secrets.

## Gotchas
- `*` for CustomObject does not return standard objects; list `Account`, `Contact`, `Opportunity`, etc. explicitly.
- Profiles retrieve only what the manifest references; include the objects/fields/classes you need them to describe, or prefer PermissionSets.
- Managed-package components are not deployable — install the package version in the target instead.
