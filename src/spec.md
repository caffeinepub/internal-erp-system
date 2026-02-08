# Specification

## Summary
**Goal:** Improve UI layering clarity so modals/dialogs and navigation overlays are clearly separated from the background content (no confusing visual blending).

**Planned changes:**
- Standardize dialog/modal presentation so the modal surface is fully opaque with clear border/shadow and the page behind is uniformly dimmed via a consistent overlay.
- Apply the improved modal layering/contrast consistently across modules, including the Contacts “Add New Contact” and edit dialogs.
- Review and adjust app shell layering (z-index and backgrounds) for header/top navigation, main content container, and mobile drawer so overlays/drawers don’t “double show” or visually merge with underlying content.

**User-visible outcome:** When opening any modal/dialog or the mobile navigation drawer, the foreground surface is clearly readable and distinct, while the underlying page is uniformly dimmed and does not visually blend or overlap with the overlay.
