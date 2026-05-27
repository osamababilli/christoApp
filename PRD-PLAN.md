# 📋 PRD — Motor Workshop Management System

> **Core Philosophy:** Speed + Clarity + Easy Search — not feature overload.

---

## 1. Project Overview

| Field | Value |
|---|---|
| **Project Name** | Motor Workshop Management System |
| **Target Users** | Workshop owners (including elderly users) |
| **App Language** | Arabic — RTL first |
| **Product Type** | Web Application — Single Page Application |
| **Initial Release** | MVP |

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Laravel 11 | with `nwidart/laravel-modules` |
| **SPA Bridge** | Inertia.js v2 + React 19 | No separate Next.js |
| **UI Components** | shadcn/ui + Tailwind CSS v4 | RTL via logical properties |
| **Database** | MySQL / PostgreSQL | — |
| **Authentication** | Laravel Breeze | Single user — no roles needed |
| **Starter Kit** | [laravel-shadcn-admin](https://github.com/AliAkrem/laravel-shadcn-admin) | Project foundation |
| **Printing** | mPDF or print CSS | Invoices & receipts |
| **Storage** | Laravel Storage (local disk) | Motor images — local only |

---

## 3. User Scope

> The system is designed for a **single user only** (the workshop owner). No multi-tenancy, no roles.

- Simple login with email and password
- No permission system or roles required
- All data and files stored locally on the same server

---

## 4. Functional Modules

### 4.1 — Motor Management `MotorModule`

**Goal:** Register a new motor in under one minute.

**Core Fields:**

| Field | Type | Notes |
|---|---|---|
| `reference_number` | string | Auto-generated (e.g. `MTR-2025-0001`) |
| `customer_name` | string | required |
| `customer_phone` | string | required — used for quick search |
| `brand` | string | optional |
| `model` | string | optional |
| `status` | enum | In Workshop / In Progress / Ready / Delivered |
| `condition_rating` | enum | Excellent / Good / Fair / Poor |
| `notes` | text | private notes |
| `received_at` | datetime | — |
| `delivered_at` | datetime | nullable |

**Features:**
- Auto-generated reference number on save
- Color-coded status badges
- Before/after photo uploads — local storage
- Archive old motors (Soft delete)
- Duplicate a previous motor to avoid re-entry
- Print intake receipt + delivery receipt

---

### 4.2 — Maintenance Management `MaintenanceModule`

**Goal:** Full tracking of maintenance work with multi-stage support.

**Core Fields:**

| Field | Type | Notes |
|---|---|---|
| `motor_id` | FK | — |
| `stage` | integer | Stage number (1, 2, 3…) |
| `description` | text | Details of work performed |
| `started_at` | datetime | — |
| `completed_at` | datetime | nullable |
| `labor_cost` | decimal | Labor charge |
| `status` | enum | In Progress / Completed / On Hold |
| `stop_reason` | string | Reason for hold (missing parts, etc.) |

> Note: `technician_id` removed — single-user system.

**Features:**
- Split a job into multiple stages
- View pending / incomplete work
- Track motors on hold due to missing parts
- "Most Delayed" list

---

### 4.3 — Parts & Supplies `PartsModule`

**Goal:** Track part costs and link them to suppliers.

**Core Fields:**

| Field | Type | Notes |
|---|---|---|
| `maintenance_id` | FK | — |
| `part_name` | string | — |
| `supplier_id` | FK | nullable |
| `quantity` | decimal | — |
| `unit_cost` | decimal | — |
| `total_cost` | decimal | Auto-calculated |
| `is_paid` | boolean | paid / unpaid |
| `type` | enum | Part / Oil / Transport / Cleaning / Other |

**Features:**
- Auto-calculated total
- View unpaid parts
- Save historical prices for comparison
- Add extra expenses (oils, transport, cleaning)
- Attach invoice photos — local storage

---

### 4.4 — Accounting & Statements `AccountingModule`

**Goal:** A clear financial picture for every customer and every motor.

**Core Fields:**

| Field | Type | Notes |
|---|---|---|
| `motor_id` | FK | — |
| `customer_id` | FK | — |
| `type` | enum | Invoice / Payment / Discount |
| `amount` | decimal | — |
| `paid_amount` | decimal | — |
| `remaining_amount` | decimal | Auto-calculated |
| `transaction_date` | datetime | — |
| `notes` | string | — |

**Features:**
- Full customer statement with clear debit/credit layout
- Record partial payments, see remaining balance instantly
- Print invoice or payment receipt
- Filter by date or motor reference number
- View net profit per motor

---

### 4.5 — Daily Dashboard `DashboardModule`

**Goal:** A quick snapshot of the workshop's status in seconds.

| Card | Content |
|---|---|
| 🔧 In Workshop | Current motor count |
| ✅ Ready for Delivery | Motors ready to hand over |
| ⏰ Overdue Work | Count of delayed jobs |
| 💰 Unpaid Invoices | Total outstanding balance |
| 📋 Recent Activity | Last 5–10 transactions |

---

### 4.6 — Reports `ReportsModule`

| Report | Details |
|---|---|
| Daily Report | Summary of workshop activity for the day |
| Monthly Report | Total revenue and profit |
| Net Profit | Per motor breakdown |
| Loyal Customers | Most frequent clients |
| Most Delayed | Motors stuck the longest |
| Fault Log | Recurring faults by motor type |

---

### 4.7 — Customers & Suppliers `ContactsModule`

**Customers:**
- Quick search by name / phone / motor reference
- Full history of visits and past motors
- Periodic maintenance reminders

**Suppliers:**
- Link suppliers to spare parts
- Track payments per supplier

---

## 5. UX Requirements — Elderly-Friendly Interface

| Requirement | Implementation |
|---|---|
| Large, clear buttons | `min-height: 48px`, font size ≥ `16px` |
| Clear status colors | Color-coded badge per status with obvious meaning |
| Fast input screen | Minimum fields in core forms |
| Dark / Light mode | via shadcn/ui theme toggle |
| Zoom support | Browser `font-size` scaling supported |
| Full RTL | Tailwind logical properties + `dir="rtl"` |
| Clear error messages | In Arabic with distinct colors |

---

## 6. Professional Features

| Feature | Priority | Notes |
|---|---|---|
| WhatsApp notification on job completion | P1 | WhatsApp Business API or Twilio |
| Global quick search | P1 | Name / phone / reference number |
| Print intake sheet | P1 | PDF or Print CSS |
| Print delivery sheet | P1 | PDF or Print CSS |
| Attach invoice photos | P1 | Local storage |
| Duplicate previous motor | P2 | Skip re-entry |
| Archive old motors | P2 | Soft delete |
| Maintenance warranty | P2 | Warranty expiry date |
| Favorite / repeat operations | P3 | — |
| In-app notifications | P3 | — |

---

## 7. Database Entity Overview

```
customers
  └── motors (motor_id, customer_id, status, reference_number...)
        └── maintenance_orders (motor_id, stage, status...)
              └── parts_used (maintenance_id, part_name, unit_cost, is_paid...)
        └── transactions (motor_id, customer_id, type, amount, paid_amount...)
              └── attachments (invoice images — local disk)

suppliers
  └── parts_used.supplier_id → FK

users (single record — owner only)
```

---

## 8. Module Structure — nwidart/laravel-modules

```
Modules/
├── Motor/
├── Maintenance/
├── Parts/
├── Accounting/
├── Dashboard/
├── Reports/
└── Contacts/
```

---

## 9. Roadmap

### Phase 1 — MVP (Weeks 1–4)
- [ ] Project setup (Starter Kit + Inertia + shadcn)
- [ ] Motor module (registration + statuses + search)
- [ ] Maintenance module (work orders + stages)
- [ ] Parts module
- [ ] Basic daily dashboard
- [ ] Print intake sheet

### Phase 2 — Core Finance (Weeks 5–7)
- [ ] Full accounting module
- [ ] Customer statement
- [ ] Invoice & payment receipt printing
- [ ] Net profit per motor

### Phase 3 — Pro Features (Weeks 8–10)
- [ ] WhatsApp notification
- [ ] Daily & monthly reports
- [ ] Customer & supplier management
- [ ] Maintenance warranty
- [ ] Motor archiving

### Phase 4 — Polish (Weeks 11–12)
- [ ] Dark / Light mode
- [ ] Elderly UX improvements
- [ ] Testing and performance cleanup
- [ ] Documentation

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Performance** | Page load < 2 seconds |
| **Responsiveness** | Works on mobile, tablet, and desktop |
| **Security** | Laravel Sanctum + CSRF + XSS protection |
| **Backup** | Daily automated backup of DB and local files |
| **Archiving** | Soft delete across all entities |

---

*Last updated: May 2025 — Version 0.2*
