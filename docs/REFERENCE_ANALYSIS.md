# DEVI MOTORS — Reference Documents & System Analysis

## 1. Document Inventory & Categorization

| File Name | Category | Document Type | Key Distinctions |
| :--- | :--- | :--- | :--- |
| `INVOICE 07 26-27.pdf` | Invoice | **Type A: Vehicle Customer Invoice** | Uses `Vehicle no` in metadata box, itemized auto repairs & parts |
| `INVOICE 02 26-27.pdf` | Invoice | **Type B: Client/Business Invoice** | Uses `Purchase order no` & `Order Date` in metadata box |
| `Artech qo1.pdf` | Quotation | **Type B: Proposal/Contract Quotation** | Narrative structure, service description, warranty terms, project pricing |
| *Derived from standard* | Quotation | **Type A: Invoice-Style Quotation** | Tabular layout matching Invoice grid, titled `QUOTATION`, quotation sequence `DQ/xx/xx` |
| `stamp.jpg` | Branding | **Official Rubber Stamp** | Circular purple stamp: `DEVI MOTORS / THYCAUD / * TRIVANDRUM 14 *` |
| `signature.jpg` | Branding | **Authorized Signature** | Handwritten authorized signatory in blue ink |
| `logo.png` | Branding | **Official DEVI MOTORS Logo** | Red DEVI (`#F52B2B`), Navy MOTORS (`#06245C`), sporty car outline |
| `dashboard_mockup.jpg` | UI Guide | **Desktop & Mobile Mockup** | Light & Dark theme dashboards, mobile responsive layouts |

---

## 2. Fixed Company Information (Source of Truth)

Extracted directly from the original PDFs without modification:
- **Legal/Trading Name**: DEVI MOTORS
- **Tagline**: Professional Car Painting, Polishing & Detailing
- **Address Line 1**: T.C 17/2456-1, Opp. Rajiv Gandhi Centre for Bio Technology
- **Address Line 2**: Jagathy, Thycaud P.O, Thiruvananthapuram
- **State**: Kerala, India (State Code: `32`)
- **Phone**: `9447138617`
- **GSTIN**: `32BAAPJ2054E1ZG`
- **Default HSN/SAC**: `998714` (Maintenance and repair services of motor vehicles)
- **Bank Details**:
  - **Bank**: IndusInd Bank
  - **Branch**: Poojappura, Trivandrum Branch
  - **Account Number**: `259447138617`
  - **IFSC Code**: `INDB0001480`
  - **GPay / UPI**: `9447138617`

---

## 3. Detailed Layout & Typography Breakdown

### A. Invoice Layout (Both Type A & Type B)
1. **Header**:
   - Centered DEVI MOTORS Logo
   - Company address lines below the logo
   - Contact bar: `Phone : 9447138617` (Left aligned) | `GST No: 32BAAPJ2054E1ZG` (Right aligned)
2. **Metadata Grid (Black Borders)**:
   - **Left Column (`BILL TO`)**:
     - Customer/Company Name (Bold)
     - Address lines
     - Customer GSTIN: `GSTIN <gstin>`
   - **Right Column (Key-Value Rows)**:
     - Row 1: `Bill No` | `DM/xx/26-27`
     - Row 2: `Bill Date` | `DD-MM-YYYY`
     - Row 3:
       - **Type A**: `Vehicle no` | e.g. `KL 01DD 6151`
       - **Type B**: `Purchase order no` | e.g. `MPUR2627-000296`
     - Row 4: `Order Date` | `DD-MM-YYYY`
3. **HSN Banner**:
   - Full-width banner: `HSN CODE` (Right aligned or center) | `998714`
4. **Line Items Table**:
   - Column Headers: `Sl No` | `Description of Goods` | `GST%` | `Rate` | `Qty` | `GST` | `Amount`
   - **Critical Rule**: Rate entered and shown is **BEFORE GST** (taxable base price per item)
   - Calculated GST amount per line: `(Rate * Qty - Discount) * (GST% / 100)`
   - Calculated Line Total Amount: `Taxable Amount + GST Amount`
   - Subtotal Row: `Total` | Sum of Taxable Rates | Sum of GST | Sum of Final Amounts
5. **Amount in Words Banner**:
   - `RUPEES <AMOUNT_IN_WORDS> ONLY` (Capitalized, standard Indian numbering)
6. **Tax Summary Table**:
   - Multi-column table:
     - `Taxable Value`
     - `Central Tax`: `Rate` | `Amount` (e.g. 9% / ₹1,242.00)
     - `State Tax`: `Rate` | `Amount` (e.g. 9% / ₹1,242.00)
     - (Or `Integrated Tax`: `Rate` | `Amount` if Inter-State supply outside Kerala)
     - `Total`: Final payable amount
7. **Footer**:
   - Left side: `Our Bank Details` box with Bank Name, Account No, IFSC, GPay.
   - Right side: `For Devi Motors`, stamp & signature area, `Authorized Signatory`.

---

### B. Proposal/Contract-Style Quotation (`Artech qo1.pdf`)
1. **Header**:
   - Same DEVI MOTORS logo, address, phone, GSTIN.
2. **Title**:
   - `QUOTATION – <Vehicle/Project Name>` (e.g. `QUOTATION – Lamborghini Urus Mirror Polishing`)
   - Quotation reference: `Quotation No: DQ/xx/26-27` | `Date: DD-MM-YYYY`
3. **Client Identification**:
   - `To: <Customer Name>`
4. **Service Scope & Narrative**:
   - `Service` heading
   - Service Title: e.g. `Premium Mirror Polishing for Lamborghini Urus`
   - Narrative scope paragraph
5. **Financial Breakdown**:
   - `Service charges: Rs <Amount>` (Rate before GST)
   - `GST @<Rate>%: Rs <GST_Amount>`
   - `Total Quotation: Rs <Total_Amount>`
6. **Warranty & Terms**:
   - `Warranty: <Warranty details>`
   - `Thank you for choosing us...`
7. **Sign-off**:
   - `Devi Motors`
   - `Professional Car Painting, Polishing & Detailing`
   - Authorized Signature & Stamp

---

## 4. Calculation Specification

To guarantee 100% agreement between frontend, backend, database snapshots, and PDFs:

1. **Taxable Amount**:
   $$\text{Taxable Amount} = (\text{Quantity} \times \text{Rate}) - \text{Discount}$$
2. **GST Split**:
   - **Intra-State (Customer State Code = 32 / Kerala)**:
     $$\text{CGST Rate} = \frac{\text{GST Rate}}{2}, \quad \text{CGST Amount} = \text{Taxable Amount} \times \frac{\text{CGST Rate}}{100}$$
     $$\text{SGST Rate} = \frac{\text{GST Rate}}{2}, \quad \text{SGST Amount} = \text{Taxable Amount} \times \frac{\text{SGST Rate}}{100}$$
   - **Inter-State (Customer State Code} \neq 32)**:
     $$\text{IGST Rate} = \text{GST Rate}, \quad \text{IGST Amount} = \text{Taxable Amount} \times \frac{\text{IGST Rate}}{100}$$
3. **Line Total**:
   $$\text{Line Total} = \text{Taxable Amount} + \text{Total GST Amount}$$
4. **Rounding**:
   - Currency amounts rounded to 2 decimal places using standard commercial rounding (`Math.round((val + Number.EPSILON) * 100) / 100`).
   - Final invoice total rounded to nearest integer if applicable, with round-off adjustment displayed when needed.
5. **Amount in Words**:
   - Indian currency words algorithm (Crore, Lakh, Thousand, Hundred, Rupees, Paise).
