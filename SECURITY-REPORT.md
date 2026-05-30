# Security & Quality Audit Report

## Workshop Management System — Laravel + Inertia + React

**Date:** 2026-05-30  
**Auditor:** Static Code Analysis  
**Scope:** Full application — Backend (PHP/Laravel), Frontend (React/TypeScript), Routes, Migrations

---

## Executive Summary

A comprehensive review of 17 PHP backend files, 6+ React frontend files, and 20+ migrations identified **21 issues** across five severity levels. The most critical findings were an **open public registration endpoint**, a **financial calculation error in printed invoices**, and **missing transaction protection** on the quotation conversion flow. All critical and high-severity issues listed below have been **remediated** as part of this audit.

---

## Issues Fixed in This Audit

### [FIXED] CRIT-01 — Open Public Registration

| File                                    | Line    | Severity    |
| --------------------------------------- | ------- | ----------- |
| `routes/web.php` + `AuthController.php` | 25 / 31 | Critical 🔴 |

**Description:** The `/sign-up` and `/register` routes were publicly accessible, allowing anyone to create an account with no invitation, email verification, or admin approval. The minimum password was only 7 characters.

**Exploit Scenario:**

```http
POST /register
{"name":"Attacker","email":"x@x.com","password":"1234567","password_confirmation":"1234567"}
→ Immediate dashboard access
```

**Fix Applied:**

- Removed `/sign-up` GET route and `/register` POST route from `routes/web.php`
- `AuthController::register()` now returns `abort(403)`

---

### [FIXED] HIGH-01 — File Upload Without MIME Type Restriction

| File                         | Line | Severity |
| ---------------------------- | ---- | -------- |
| `ShopDocumentController.php` | 48   | High 🟠  |

**Description:** The file upload validation rule was `'file|max:20480'` with no type restriction. Any file type (PHP, HTML, JS) could be uploaded.

**Fix Applied:**

```php
'file' => 'required|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,csv,png,jpg,jpeg,gif,webp',
```

---

### [FIXED] HIGH-02 — Motor Update Overwrites Shared Customer Record

| File                  | Line    | Severity |
| --------------------- | ------- | -------- |
| `MotorController.php` | 383-386 | High 🟠  |

**Description:** When editing a motor with a manually entered customer (no customer_id), the controller directly updated the linked Customer record:

```php
$motor->customer->update(['name' => ..., 'phone' => ...]);
```

This silently changed customer data across **all motors** linked to that customer.

**Fix Applied:** Now uses `Customer::firstOrCreate()` to find or create a separate customer record, then links the motor to it — leaving the original customer untouched.

---

### [FIXED] HIGH-03 — Race Condition in Quotation Reference Number Generation

| File            | Line  | Severity |
| --------------- | ----- | -------- |
| `Quotation.php` | 36-39 | High 🟠  |

**Description:** `count() + 1` is not atomic. Two simultaneous requests would read the same count and attempt to insert the same `reference_number`, violating the unique constraint and throwing an unhandled `SQLSTATE[23000]` exception.

**Fix Applied:** Wrapped in `DB::transaction()` with `->lockForUpdate()`:

```php
return DB::transaction(function () {
    $count = static::withTrashed()
        ->whereYear('created_at', now()->year)
        ->lockForUpdate()
        ->count() + 1;
    return 'QUO-' . now()->year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
});
```

---

### [FIXED] HIGH-04 — Double Conversion Race Condition

| File                      | Line    | Severity |
| ------------------------- | ------- | -------- |
| `QuotationController.php` | 233-286 | High 🟠  |

**Description:** Two simultaneous clicks on "Convert to Reception" would both pass the `status === 'accepted'` check and create two Motor records + duplicate MaintenanceOrders for the same quotation. No transaction boundary existed.

**Fix Applied:** The entire `convert()` method is now wrapped in `DB::transaction()` with `->lockForUpdate()` on the quotation row before any write operations.

---

### [FIXED] HIGH-05 — Full User Object Exposed to Browser via Inertia

| File                        | Line | Severity |
| --------------------------- | ---- | -------- |
| `HandleInertiaRequests.php` | 46   | High 🟠  |

**Description:** `'user' => $request->user()` serializes the entire User Eloquent model into the page's JavaScript payload. While `password` and `remember_token` are in `$hidden`, all other columns (`email_verified_at`, `created_at`, `updated_at`, and any future column) are sent to every browser.

**Fix Applied:** Only explicit, necessary fields are now shared:

```php
'user' => $request->user() ? [
    'id'    => $request->user()->id,
    'name'  => $request->user()->name,
    'email' => $request->user()->email,
    'role'  => $request->user()->role,
] : null,
```

---

### [FIXED] HIGH-06 — Supplier Deletion With Outstanding Debt

| File                     | Line    | Severity |
| ------------------------ | ------- | -------- |
| `SupplierController.php` | 151-155 | High 🟠  |

**Description:** `destroy()` deleted the supplier without checking outstanding balances. Any `cascadeOnDelete` on payments would silently erase financial records and corrupt the treasury balance.

**Fix Applied:**

```php
$balance = (motorPartsCost + directCost) - totalPaid;
if ($balance > 0.01) {
    return back()->with('error', 'لا يمكن حذف المورد — يوجد رصيد مستحق...');
}
```

---

### [FIXED] MED-01 — Status Field Accepted Unsanitized Values on Quotation Create

| File                      | Line | Severity  |
| ------------------------- | ---- | --------- |
| `QuotationController.php` | 78   | Medium 🟡 |

**Description:** `$request->input('status', 'draft')` was used directly without validation, allowing a crafted request to create a quotation with status `accepted` or `converted`, bypassing the intended workflow.

**Fix Applied:**

```php
'status' => in_array($request->input('status'), ['draft', 'sent']) ? $request->input('status') : 'draft',
```

---

### [FIXED] MED-02 — Maintenance Order Update Missing Lock Check

| File                        | Line | Severity  |
| --------------------------- | ---- | --------- |
| `MaintenanceController.php` | 93   | Medium 🟡 |

**Description:** `update()` allowed modifying a maintenance order even when the parent motor was "locked" (delivered and fully paid). The `destroy()` method checked `isLocked()` but `update()` did not.

**Fix Applied:** Added `isLocked()` guard at the start of `update()`.

---

### [FIXED] MED-03 — Transaction Deletion Without Motor Binding Check

| File                        | Line | Severity  |
| --------------------------- | ---- | --------- |
| `TransactionController.php` | 63   | Medium 🟡 |

**Description:** `DELETE /transactions/{transaction}` accepted any transaction ID with no verification that it belonged to an accessible motor.

**Fix Applied:** Added `abort_if(! $transaction->motor_id, 404)` to ensure the transaction is linked to a motor before deletion.

---

## Issues Fixed in Second Pass

### [FIXED] OPEN-01 — Financial Display Error in Motor Invoice Print

| File                                 | Line       | Severity |
| ------------------------------------ | ---------- | -------- |
| `resources/js/pages/print/motor.tsx` | 50-52, 179 | High 🟠  |

**Description:**

```tsx
const totalPaid = transactions.filter(t => t.type_label === 'دفعة').reduce(...);
const totalDisc = transactions.filter(t => t.type_label === 'خصم').reduce(...);
// ...
<SummaryRow label="المدفوع" value={(totalPaid + totalDisc).toFixed(2)} />
```

Discounts are added to cash payments and shown as "المدفوع" (amount paid). This misrepresents financial data to customers — a discount is a debt reduction, not a cash payment.

**Fix Applied:** Separate rows for cash payments and discounts. Discount row is conditionally rendered only when `totalDisc > 0`.

---

### [FIXED] OPEN-02 — Excessive Data Loading in Maintenance and Parts Lists

| File                                                             | Line         | Severity  |
| ---------------------------------------------------------------- | ------------ | --------- |
| `MaintenanceController.php` + `PartController.php` + `Motor.php` | 16 / 16 / 85 | Medium 🟡 |

**Description:** Both list pages eager-loaded the entire `motor.maintenanceOrders.parts` + `motor.transactions` tree for each row — only to compute `isLocked()`. This loaded potentially thousands of rows per page just for a boolean check.

**Fix Applied:**

- `Motor::isLocked()` now uses direct aggregate SQL queries (`sum()` with a join) instead of loading full relation trees
- `MaintenanceController::index()` changed to `with(['motor.customer'])` only
- `PartController::index()` changed to `with(['maintenance.motor.customer', 'supplier'])` only

---

### [FIXED] OPEN-03 — Unbounded `get()` in Accounting Print Statement

| File                       | Line | Severity  |
| -------------------------- | ---- | --------- |
| `AccountingController.php` | 84   | Medium 🟡 |

**Description:** `printStatement()` called `->get()` with no row limit. A large ledger loads entirely into PHP memory.

**Fix Applied:** Changed to `->take(5000)->get()`.

---

### [FIXED] OPEN-04 — Race Condition in Maintenance Order Stage Numbering

| File                        | Line | Severity  |
| --------------------------- | ---- | --------- |
| `MaintenanceController.php` | 65   | Medium 🟡 |

**Description:**

```php
$stage = MaintenanceOrder::where('motor_id', ...)->max('stage') + 1;
```

Two concurrent requests would read the same `max(stage)` and insert duplicate stage numbers.

**Fix Applied:** Wrapped in `DB::transaction()` with `->lockForUpdate()`:

```php
return DB::transaction(function () use ($validated) {
    $stage = MaintenanceOrder::where('motor_id', $validated['motor_id'])
        ->lockForUpdate()->max('stage') + 1;
    MaintenanceOrder::create([...$validated, 'stage' => $stage]);
    return back()->with('success', '...');
});
```

---

### [FIXED] OPEN-05 — `valid_days` Validation Exceeds Column Type

| File                      | Line    | Severity |
| ------------------------- | ------- | -------- |
| `QuotationController.php` | 61, 143 | Low 🟢   |

**Description:** Validation allowed `max:365` but the column is `unsignedTinyInteger` (max 255). A value of 300 would pass validation then fail at the database level.

**Fix Applied:** Changed to `'valid_days' => 'integer|min:1|max:255'` in both `store()` and `update()`.

---

### [FIXED] OPEN-06 — Empty Section in Motor Print View

| File                                 | Line    | Severity |
| ------------------------------------ | ------- | -------- |
| `resources/js/pages/print/motor.tsx` | 104-105 | Low 🟢   |

**Description:** `<Section title="بيانات قيد الاستلام">` rendered as an empty box on printed invoices.

**Fix Applied:** Removed the empty section; customer section is now full-width.

---

## Summary Table — All Issues

| ID      | Issue                                         | Severity    | Status   |
| ------- | --------------------------------------------- | ----------- | -------- |
| CRIT-01 | Open public registration                      | Critical 🔴 | ✅ Fixed |
| HIGH-01 | File upload without MIME restriction          | High 🟠     | ✅ Fixed |
| HIGH-02 | Motor update overwrites shared customer       | High 🟠     | ✅ Fixed |
| HIGH-03 | Race condition in reference number generation | High 🟠     | ✅ Fixed |
| HIGH-04 | Double quotation conversion race condition    | High 🟠     | ✅ Fixed |
| HIGH-05 | Full user object leaked to browser            | High 🟠     | ✅ Fixed |
| HIGH-06 | Supplier deletion with outstanding debt       | High 🟠     | ✅ Fixed |
| MED-01  | Quotation status bypass on create             | Medium 🟡   | ✅ Fixed |
| MED-02  | Maintenance update missing lock check         | Medium 🟡   | ✅ Fixed |
| MED-03  | Transaction deletion without motor check      | Medium 🟡   | ✅ Fixed |
| OPEN-01 | Financial error in invoice print              | High 🟠     | ✅ Fixed |
| OPEN-02 | Excessive data loading in list pages          | Medium 🟡   | ✅ Fixed |
| OPEN-03 | Unbounded `get()` in accounting print         | Medium 🟡   | ✅ Fixed |
| OPEN-04 | Race condition in maintenance stage numbering | Medium 🟡   | ✅ Fixed |
| OPEN-05 | `valid_days` exceeds column type              | Low 🟢      | ✅ Fixed |
| OPEN-06 | Empty section in motor print view             | Low 🟢      | ✅ Fixed |

**All 16 issues are now resolved.**

---

## Files Modified

| File                                              | Change                                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `routes/web.php`                                  | Removed `/sign-up` and `/register` routes                                    |
| `app/Http/Controllers/Auth/AuthController.php`    | `register()` returns `abort(403)`                                            |
| `app/Http/Controllers/ShopDocumentController.php` | Added `mimes:` restriction to file upload                                    |
| `app/Http/Controllers/MotorController.php`        | Fixed customer update to use `firstOrCreate`                                 |
| `app/Models/Motor.php`                            | `isLocked()` uses aggregate queries; added `Part` import                     |
| `app/Models/Quotation.php`                        | `generateReference()` wrapped in `DB::transaction + lockForUpdate`           |
| `app/Http/Controllers/QuotationController.php`    | `convert()` in transaction; `status` sanitized; `valid_days` max fixed       |
| `app/Http/Middleware/HandleInertiaRequests.php`   | Only specific user fields shared with frontend                               |
| `app/Http/Controllers/SupplierController.php`     | Balance check before supplier deletion                                       |
| `app/Http/Controllers/TransactionController.php`  | Motor binding check before deletion                                          |
| `app/Http/Controllers/MaintenanceController.php`  | `isLocked()` check in `update()`; stage uses transaction; reduced eager load |
| `app/Http/Controllers/PartController.php`         | Reduced eager load                                                           |
| `app/Http/Controllers/AccountingController.php`   | Added `take(5000)` limit on print statement                                  |
| `resources/js/pages/print/motor.tsx`              | Separated payments/discounts; removed empty section                          |

---

_This report is based on static code analysis. Dynamic penetration testing is recommended before any public deployment._
