# DEVI MOTORS — REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 🔐 1. Authentication

### `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "admin@devimotors.in",
    "password": "admin123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6ae03...",
      "name": "Admin",
      "email": "admin@devimotors.in",
      "role": "super_admin"
    }
  }
  ```

### `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Current user profile.

---

## 👥 2. Customers

### `GET /customers`
- **Query Params**:
  - `search` (optional): search by name, phone, gstin, vehicle number
  - `type` (optional): `all` | `individual` | `company`
  - `page`: default 1
  - `limit`: default 50
- **Response**: List of customers with total count and pagination metadata.

### `POST /customers`
- **Request Body**:
  ```json
  {
    "name": "Net vision Solar power solution",
    "customerType": "individual",
    "phone": "9447123456",
    "email": "contact@example.com",
    "billingAddress": "TC 8/1125(2) nandhanam B49/2, Mythri nagar Thirumala",
    "state": "Kerala",
    "stateCode": "32",
    "gstin": "32AKJPB9235H1ZC",
    "vehicleNumbers": ["KL 01DD 6151"]
  }
  ```

### `GET /customers/:id`
- Returns customer details along with previous invoices, previous quotations, and registered vehicles/POs.

---

## 🧾 3. Invoices

### `GET /invoices`
- **Query Params**: `search`, `type` (`vehicle` | `client`), `status` (`draft` | `issued`), `paymentStatus` (`paid` | `partially_paid` | `unpaid`), `page`, `limit`.

### `POST /invoices/calculate`
- Computes real-time line-item and document totals using rate before GST.

### `POST /invoices`
- Creates draft invoice.

### `POST /invoices/:id/issue`
- Validates order date <= invoice date.
- Atomically reserves official sequential invoice number (e.g. `DM/08/26-27`).
- Recalculates totals and saves immutable snapshot.

### `GET /invoices/:id/preview`
- Returns raw HTML for embedded iframe preview.

### `GET /invoices/:id/pdf`
- Generates and streams print-ready A4 PDF binary buffer rendered via Puppeteer.

---

## 📋 4. Quotations

### `GET /quotations`
- Lists quotations with type and status filtering.

### `POST /quotations`
- Creates new quotation (either Type A: Invoice-Style or Type B: Proposal-Style matching `Artech qo1.pdf`).

### `PATCH /quotations/:id/status`
- Updates quotation status (`pending`, `approved`, `rejected`, `expired`).

### `POST /quotations/:id/convert`
- Converts approved quotation into a brand new official invoice.

### `GET /quotations/:id/pdf`
- Generates and streams A4 quotation PDF matching the reference files.

---

## 💳 5. Payments

### `POST /payments`
- Records payment against an invoice.
- Updates invoice `amountPaid`, `balanceDue`, and `paymentStatus`.
- Updates customer balance.
