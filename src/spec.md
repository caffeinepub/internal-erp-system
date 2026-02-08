# Specification

## Summary
**Goal:** Remove login/authentication requirements so the ERP app is openly accessible, including role-gated areas, without unauthorized errors for anonymous users.

**Planned changes:**
- Update the frontend root flow to always render the main Dashboard (AppShell + modules) and never route/block on the LoginPage.
- Disable first-time profile setup gating so ProfileSetupModal does not appear for anonymous/open access usage.
- Adjust frontend role fetching/handling so role/admin-gated UI can resolve a role even when no Internet Identity is present.
- Add a backend “open access” behavior to bypass authorization/approval checks for anonymous callers across all domain operations.
- In open access mode, make backend role/approval APIs return permissive values (approved + admin-equivalent) so existing frontend role gating works without login.

**User-visible outcome:** Opening the app in a fresh session goes straight to the Dashboard with core modules usable without logging in, and admin-gated areas (e.g., Backup) can be accessed without an access denied or unauthorized error.
