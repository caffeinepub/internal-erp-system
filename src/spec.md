# Specification

## Summary
**Goal:** Rebuild the ERP Billing estimates flow so estimates reliably support product-linked line items, customer “Bill To” selection with previous pending balance alerts, inventory stock enforcement/adjustments, purchase-price autofill, and payment-based pending calculations—persisted end-to-end.

**Planned changes:**
- Fix the Estimate Editor product selection/add flow so selecting a product immediately populates the draft line item (productId, description, rate) and “Add Item” reliably adds it, then resets the draft inputs without stale selection.
- Ensure estimates can be created and edited with full persistence: saved to backend, shown in the Billing list immediately, editable later, and totals computed from line item amounts (no tax).
- Add/ensure “Bill To” customer selection from existing contacts; on selection, auto-fill customer details and display “Previous Pending Balance” (excluding the current estimate) with a clear red-flag visual when > 0.
- Enforce and update inventory stock for product-linked line items: block add/save when qty exceeds available stock; decrement stock on new estimate save; and correctly adjust stock on estimate edit (restore prior qty then apply updated qty) using productId linkage.
- Auto-fill the line item rate from the most recent Purchase-module purchase price for the selected product, falling back to the product default price; allow manual override.
- Add payment recording against estimates and ensure paid/pending amounts and status are persisted and reflected consistently in the Billing list and in customer pending-balance calculations, with pending > 0 emphasized visually.
- If backend estimate/billing models or APIs must change to support the above, apply minimal changes and add a conditional migration to preserve existing persisted estimates across upgrades.

**User-visible outcome:** Users can create and edit estimates with product-linked items that auto-fill pricing, validate stock, and update inventory; select a Bill To customer and see a red-flagged previous pending balance; record payments that update pending/paid amounts; and see all changes persisted and reflected in the Billing list without refresh.
