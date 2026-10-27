# DEVI MOTORS — Invoice, Quotation & Customer Management System

Production-ready Invoice, Quotation, and Customer Management web application built for **DEVI MOTORS**, Thiruvananthapuram, Kerala, India.

---

## 🚗 Project Overview

This system replaces the manual invoice and quotation preparation workflow with an automated, concurrency-safe, multi-tier software application featuring:

1. **Document Templates (Exact Match to Supplied References)**:
   - **Type A: Vehicle Customer Invoice** (`INVOICE 07 26-27.pdf` match) with vehicle registration number, HSN 998714, itemized rates **before GST**, GST breakdown, amount in words, and bank/signatory block.
   - **Type B: Client/Business Invoice** (`INVOICE 02 26-27.pdf` match) with Purchase Order (PO) number, order date, and itemized billing.
   - **Type B: Proposal/Contract Quotation** (`Artech qo1.pdf` match) with project scope, service charge before GST, warranty terms, and authorized sign-off.
   - **Type A: Invoice-Style Quotation** with tabular layout, valid until dates, and quotation numbering.
2. **Official Branding**:
   - Official DEVI MOTORS logo (Red `#F52B2B` & Navy `#06245C` with sports car outline).
   - High-fidelity circular rubber stamp (`THYCAUD, TRIVANDRUM 14`) and authorized signature in PDF generation.
3. **Automated Financial Engine**:
   - Rates entered & billed **BEFORE GST** (Unit Rate = Taxable base).
   - Intra-state (Kerala, State Code 32): 50% CGST + 50% SGST.
   - Inter-state: 100% IGST.
   - Indian currency words algorithm (Crore, Lakh, Thousand, Hundred, Rupees, Paise).
4. **Concurrency-Safe Document Numbering**:
   - Atomic `$inc` MongoDB sequences: `DM/{sequence}/{FY}` (e.g., `DM/08/26-27`) and `DQ/{sequence}/{FY}` (e.g., `DQ/05/26-27`).
5. **Dashboard & Financial Reports**:
   - Real-time database metrics: Total Invoiced, Total Paid, Outstanding Balance, Quotations Pending.
   - Monthly sales overview bar chart (Invoiced vs. Paid).
   - Recent documents table and customer list.
6. **Themes & Mobile Responsiveness**:
   - Complete Light and Dark themes with zero flash and persistence.
   - Mobile-first UX with compact bottom navigation, responsive cards, and live PDF preview.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide icons, Recharts.
- **Backend**: Express.js, TypeScript, Mongoose (MongoDB), JWT, BcryptJS, Puppeteer.
- **Shared Package**: `@devi-motors/shared` containing core DTOs, calculations, and validators.
- **Database**: MongoDB running on `mongodb://127.0.0.1:27017/devi_motors`.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally or accessible via URI
- Google Chrome or Microsoft Edge installed (for Puppeteer PDF engine)

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd devi-motors

# Install all workspace dependencies
npm install
```

### 3. Database Seeding & Admin Setup
```bash
# Seed initial admin (admin@devimotors.in / admin123), company settings, customers, and reference invoices
npm run seed
```

### 4. Running the Development Environment
```bash
# Run both Frontend (port 3000) and Backend API (port 5000) concurrently
npm run dev
```

Visit **`http://localhost:3000`** in your browser:
- **Email:** `admin@devimotors.in`
- **Password:** `admin123`

---

## 📂 Project Structure

```
devi-motors/
├── apps/
│   ├── api/                 # Express REST API (port 5000)
│   │   ├── src/controllers/ # Auth, Customers, Invoices, Quotations, Payments, Dashboard, Settings
│   │   ├── src/models/      # Mongoose schemas (User, Customer, Invoice, Quotation, Counter, etc.)
│   │   ├── src/services/    # Concurrency-safe counter, Puppeteer PDF renderer
│   │   └── src/seed/        # Database seed script
│   └── web/                 # Next.js 14 App Router Frontend (port 3000)
│       ├── src/app/         # Dashboard, Customers, Invoices, Quotations, Vehicles, Reports, Settings
│       ├── src/components/  # Layout, Sidebar, Header, MobileDrawer, BottomNav
│       └── src/context/     # AuthContext, ThemeContext
├── packages/
│   └── shared/              # Shared types, tax & GST calculation engine, Indian words utility
├── assets/                  # Logos, stamp image, signature image, reference PDFs
└── docs/                    # Reference analysis, API documentation, Backup guides
```

---

## 🧪 Testing

```bash
# Run unit tests for the core calculation, date validation, and numbering engine
npm run test --workspace=@devi-motors/shared
```
