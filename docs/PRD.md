# Product Requirements Document
# Ahadu Fresh Meat Reservation — Web Application

**Version:** 1.0  
**Date:** June 26, 2026  
**Client:** Ahadu Market (Ethiopian Meat Shop)  
**Prepared for:** Project Supervisor / Client Review

---

## 1. Project Overview

Ahadu Market is an Ethiopian meat shop that currently takes orders over the phone or in person. This creates friction for customers (especially those who must call during business hours) and makes it difficult for the shop owner to plan daily meat preparation.

The **Ahadu Fresh Meat Reservation** web application solves this by giving customers a simple online form to place advance meat orders, and giving the shop owner (and their staff) a private admin dashboard to view, manage, and track those orders.

The system is designed as a **web-first application** accessible on any device — phone, tablet, or desktop — without requiring customers to download anything. A mobile app may follow in a later phase; this document covers the web application only.

---

## 2. Goals and Purpose

| Goal | How the App Achieves It |
|------|------------------------|
| Let customers order online anytime | Public order form — no login, no app download |
| Help owner plan daily meat prep | Admin dashboard shows daily totals per meat type |
| Reduce missed or forgotten orders | Email confirmation sent to customer after order |
| Give staff visibility into order status | Status tracking (Pending → Confirmed → Ready → Picked Up) |
| Enable quick order sharing | WhatsApp share button for spreading the order link |

---

## 3. Target Users

### 3.1 Customers

Customers of Ahadu Market who want to reserve meat in advance. They:

- May not be tech-savvy — the form must be simple and obvious
- Access the app primarily on mobile phones
- Do not need an account to place an order
- Need a confirmation that their order was received (email)
- Order one or more of the shop's six meat types, specifying pounds for each

**Key customer need:** Place an order in under two minutes on a phone, and receive confirmation.

### 3.2 Admin / Shop Owner

The shop owner (and any staff they designate) who manages orders. They:

- Log in with a username and password
- View all incoming orders
- Update order status as preparation progresses
- Export or print order lists for the kitchen
- Search orders by customer name or phone number
- Add or remove other admin accounts

**Key admin need:** See all orders at a glance, know today's totals per meat type, and track preparation status.

---

## 4. Meat Types Offered

The application supports exactly six meat types. Customers order each in pounds (lbs):

1. **Tire / Tere** — raw beef
2. **Kitfo** — Ethiopian-style minced raw beef
3. **Tibs** — sauteed beef
4. **Godin** — beef ribs
5. **Gubet** — tripe / offal
6. **Kidney** — beef kidney

Each meat type starts at 0 lbs on the order form and can be incremented or decremented in whole-pound steps.

---

## 5. Features

### 5.1 Customer Order Form (Public — No Login Required)

The main public-facing page of the application. Any customer can access it directly via the shop's URL.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | Text input | Yes | Customer's name |
| Phone Number | Text input | Yes | For the shop to contact the customer |
| Email Address | Text/Email input | Yes | For sending confirmation email |
| Pickup Date | Date picker | Yes | Any date the customer chooses |
| Tire lbs | Number counter (+/-) | No | Defaults to 0 |
| Kitfo lbs | Number counter (+/-) | No | Defaults to 0 |
| Tibs lbs | Number counter (+/-) | No | Defaults to 0 |
| Godin lbs | Number counter (+/-) | No | Defaults to 0 |
| Gubet lbs | Number counter (+/-) | No | Defaults to 0 |
| Kidney lbs | Number counter (+/-) | No | Defaults to 0 |
| Notes | Textarea | No | Special requests, preparation notes |

**Validation Rules:**
- Name, phone, email, and pickup date are required
- At least one meat type must have a quantity greater than 0
- Pounds cannot go below 0
- Email must be in a valid email format

**After Submission:**
- A success message is shown to the customer on the page
- The customer receives an email confirmation listing their full order details
- The form resets, ready for another order

**WhatsApp Share Button:**
- Displayed on the page (likely in the header or footer)
- Opens WhatsApp with a pre-written message containing the order form URL
- Allows existing customers to easily share the link with friends and family

---

### 5.2 Admin Login Page

A private, clean login form at `/admin/login`. Only admins know this URL exists.

- Email and password fields
- Submit button
- On success: redirected to the admin dashboard
- On failure: error message displayed ("Invalid email or password")
- No "Forgot Password" flow in v1 (admin passwords managed directly in Supabase)
- No public registration — all admin accounts are created by existing admins

---

### 5.3 Admin Dashboard

The central management screen for the shop owner and staff. Accessible at `/admin/dashboard`. Protected — redirects to `/admin/login` if not authenticated.

**Order Table:**

Displays all orders in a sortable table with the following columns:

| Column | Description |
|--------|-------------|
| Customer Name | Name entered on the order form |
| Phone | Customer phone number |
| Pickup Date | Date the customer selected |
| Order Details | Each meat type with lbs (only showing types with qty > 0) |
| Notes | Any special requests |
| Status | Current order status with colored badge |
| Actions | Buttons to advance order status |

**Search Bar:**
- Filters the order table in real-time by customer name or phone number
- Client-side filtering — no additional database calls needed

**Today's Totals Panel:**
- Displayed prominently above or beside the order table
- Shows total pounds ordered per meat type for today's pickup date
- Useful for the kitchen to know exactly how much to prepare
- Example: "Tire: 12 lbs | Kitfo: 8 lbs | Tibs: 0 lbs | ..."

**Order Status Flow:**

```
Pending → Confirmed → Ready → Picked Up
```

Admins click an "Advance Status" button (or a dropdown) to move an order forward. Status badges are color-coded:

| Status | Badge Color |
|--------|-------------|
| Pending | Yellow / Amber |
| Confirmed | Blue |
| Ready | Green |
| Picked Up | Gray |

**Print Button:**
- Clicking "Print" triggers the browser print dialog
- Print-optimized CSS hides navigation, buttons, and admin UI elements
- The order table and today's totals print cleanly

**Export to Excel Button:**
- Downloads all currently visible orders (respecting any active search filter) as an `.xlsx` file
- Processed entirely in the browser — no server involvement
- Columns match the order table

**WhatsApp Share Button:**
- Same as the customer-side button — shares the order form URL via WhatsApp
- Useful for admins to quickly send the link to a customer over WhatsApp

---

### 5.4 Admin Management Page

Accessible at `/admin/admins`. Protected — logged-in admins only.

**View Admins:**
- Lists all admin accounts (email address, date added)

**Add Admin:**
- A simple form: enter new admin's email and a temporary password
- On submit: creates a new Supabase Auth user
- The new admin can log in immediately with those credentials

**Remove Admin:**
- A "Remove" button beside each admin
- An admin cannot remove their own account (button disabled or hidden for self)
- Confirmation prompt before deletion

---

## 6. Overall Architecture

```
┌─────────────────────────────────────────────┐
│              Customer / Admin Browser        │
│         (Next.js Frontend on Vercel)         │
└────────────────────┬────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────┐
│                  Supabase                    │
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │  PostgreSQL  │  │    Supabase Auth     │ │
│  │   Database   │  │  (Admin login only)  │ │
│  │              │  └──────────────────────┘ │
│  │  - orders    │                            │
│  │  - admins    │  ┌──────────────────────┐ │
│  └──────────────┘  │   Edge Function      │ │
│                    │  (Email trigger on   │ │
│                    │   new order insert)  │ │
│                    └──────────┬───────────┘ │
└───────────────────────────────┼─────────────┘
                                │ SMTP
                                ▼
                    ┌───────────────────────┐
                    │   Gmail SMTP Server   │
                    │  (Client's account)  │
                    │  + App Password       │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Customer's Email    │
                    │   (Confirmation)      │
                    └───────────────────────┘
```

**How It Works:**

1. A customer fills out the order form on the Next.js frontend (hosted on Vercel)
2. On submit, the frontend calls Supabase directly to insert a new row into the `orders` table
3. Supabase's database trigger fires the Edge Function when a new order is inserted
4. The Edge Function sends a confirmation email to the customer using the client's Gmail account via SMTP
5. Admins log in via Supabase Auth on the `/admin/login` page
6. The admin dashboard reads orders from Supabase in real time
7. Status updates are written directly back to Supabase from the dashboard

---

## 7. Tech Stack

| Technology | Role | Why This Choice |
|------------|------|-----------------|
| **Next.js 14** (App Router) | Frontend framework | Industry-standard React framework; App Router enables server-side rendering for performance; excellent Vercel integration |
| **Tailwind CSS** | Styling | Utility-first CSS; fast to build with; ensures consistent design without writing custom CSS files |
| **Supabase** | Backend (database, auth, functions) | Provides PostgreSQL database, user authentication, and serverless functions in one platform; no need to build a separate API server; has a generous free tier |
| **PostgreSQL** (via Supabase) | Database | Reliable, relational database; handles order data cleanly; Supabase manages hosting and backups |
| **Supabase Auth** | Authentication | Built-in, secure auth system; handles sessions, tokens, and user management; integrates directly with database RLS policies |
| **Supabase Edge Functions** | Email triggering | Serverless functions that run on Deno; triggered by database events; no separate server needed |
| **denomailer** | Email sending | Lightweight Deno SMTP library; works inside Supabase Edge Functions; no third-party email service account needed |
| **Gmail SMTP** | Email delivery | Client already has Gmail; App Password feature allows SMTP access without enabling less secure apps; zero extra cost |
| **SheetJS (xlsx)** | Excel export | Widely used library for generating Excel files client-side; no server involvement needed |
| **Vercel** | Hosting | Seamless deployment for Next.js apps; automatic HTTPS; free tier sufficient for this project |

---

## 8. Authentication Model

- **No public registration.** There is no sign-up page.
- The first admin (the shop owner) is created directly in the Supabase dashboard by the developer during setup.
- Any logged-in admin can create additional admin accounts from within the app.
- Any admin can remove other admin accounts, except their own.
- Admin sessions are managed by Supabase Auth and persisted via secure cookies.
- Protected pages use Next.js middleware to verify the session on every request and redirect unauthenticated users to `/admin/login`.

---

## 9. Email Notifications

When a customer submits an order:

1. Supabase detects the new row in the `orders` table
2. An Edge Function is triggered automatically
3. The function sends an email to the customer's email address
4. The email contains: a greeting, a summary of their order (each meat type and lbs), their pickup date, and a note that the shop will be in touch to confirm

The email is sent from the client's Gmail account using an App Password (a special password generated in Google Account settings that allows SMTP access without compromising the main account password).

---

## 10. Data Retention and Privacy

- Customer data (name, phone, email, order details) is stored in Supabase's PostgreSQL database
- Only logged-in admins can access this data through the dashboard
- The public-facing order form is write-only from the customer's perspective — customers cannot view other orders
- Row-Level Security (RLS) policies in Supabase enforce that unauthenticated users can only insert orders, not read, update, or delete them

---

## 11. Project Timeline

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| **Project Setup** | Day 1 (morning) | Next.js app initialized, Supabase project created, environment variables configured, folder structure established |
| **Customer Order Form Complete** | End of Day 2 | Public order form functional with validation, Supabase integration working, email confirmation sending on order submit |
| **Admin Dashboard Complete** | End of Day 3 | Admin login working, dashboard showing orders, status updates functional, search and today's totals working |
| **Full Web App Done** | End of Day 4 | Admin management page complete, Excel export and print working, full end-to-end testing passed, deployed to Vercel |

---

## 12. Out of Scope (v1)

The following are explicitly NOT included in this version:

- Mobile app (iOS / Android) — planned for a future phase
- Customer accounts or order history for customers
- Online payment or deposit collection
- SMS notifications
- Inventory / stock management
- Multi-location support
- Order scheduling beyond a simple date picker

---

## 13. Success Criteria

The web application is considered complete and successful when:

1. A customer can open the site on their phone, fill in the order form, submit it, and receive a confirmation email — all within two minutes
2. An admin can log in, see all orders, update order statuses, and see today's pound totals without errors
3. The admin can export orders to Excel and print them without layout issues
4. An admin can add and remove other admin accounts
5. Unauthenticated users cannot access any admin pages
6. The application is deployed and accessible via a public URL on Vercel
