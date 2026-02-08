# Specification

## Summary
**Goal:** Redesign the ERP app UI/UX into a Vyapar-like (but legally distinct) workflow, add consistent sorting controls across key lists/reports, and prevent data loss via admin backups plus upgrade-safe backend persistence.

**Planned changes:**
- Redesign frontend information architecture and key screens (dashboard, navigation, list/detail layouts) to a new, legally distinct pattern while keeping all existing ERP modules and flows functional (Inventory, Contacts, Products, Purchase, Billing/Estimates, Finance/Reports, Printing).
- Add a consistent client-side sorting UI (field + ascending/descending) to: Billing Estimates list, Purchase list, Products list, and targeted Finance report tables (Purchase Report, Inventory Report, Sales Report, Product Performance, Transactions), ensuring sorting applies after existing filters/search.
- Add admin-only backup tooling: backend export/import APIs for all persisted domain data and a frontend Admin Backup screen to download an export file and upload an import file (with overwrite warning).
- Implement upgrade-safe stable-memory persistence in the Motoko backend using preupgrade/postupgrade so data survives canister upgrades; add/adjust migration logic only if needed to preserve existing state and API compatibility.

**User-visible outcome:** Users see a refreshed, business-ledger-style UI (English text) with familiar workflows, can sort key tables and reports, admins can export/import backups, and existing data remains intact after canister upgrades.
