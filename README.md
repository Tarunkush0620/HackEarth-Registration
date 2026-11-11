# WIE HackEarth 2.0 · Team Registration, Razorpay, Stay & RSVP QR

Production-ready offline hackathon registration platform with server-side payment verification, dynamic All-Women team discounts, outstation stay & university shuttle bookings, cryptographically signed RSVP passes, vector PDF tax invoices, and statutory compliance.

Flow: **Team Form → Server validates members & gender → Razorpay → Server verifies payment → Themed QR pass + Stay & Shuttle voucher → Itemized College Receipt & PDF Invoice emailed to all members → Entry desk check-in scanner**.

```
public/              Static assets, form page, desk scanner & legal policy pages
  index.html         Main registration form with dynamic price breakdown & policy modals
  style.css          Theme & styling (cream, magenta, indigo, lavender palette)
  app.js             Dynamic team gender detection, price recalculation & Razorpay checkout
  scanner.html       Volunteer entry desk QR scanner & live attendance dashboard
  terms.html         Terms & Conditions (/terms)
  privacy.html       DPDP Act 2023 compliant Privacy Policy (/privacy)
  refunds.html       Non-refundable & duplicate payment policy (/refunds)
  contact.html       Organizers contact & grievance redressal (/contact)
api/                 Vercel serverless routes & API handlers
  create-order.js    Validates form, checks shortlist/duplicates, applies discount/stay, creates Razorpay order
  verify-payment.js  Checks Razorpay signature + amount, marks "paid", builds QR & PDF, sends confirmation email
  check-in.js        Desk check-in route: validates HMAC QR signature, verifies ID, records check-in
  razorpay-webhook.js Backup confirmation webhook if user closes browser during checkout
  admin-resend.js    Admin route to re-send confirmation emails
lib/                 qr.js, mailer.js, invoice.js, gender-verify.js, validate.js, config.js
supabase/schema.sql  PostgreSQL tables: registrations, shortlist with RLS policies
scripts/             preview-qr.js, generate-sample-emails.js, import-shortlist.js
```

## Key Capabilities

1. **Pricing & Automatic Concessions**:
   - Standard Team Registration: **₹400 per team** (2–4 members).
   - **All-Women Team Discount**: Teams where all members (including leader) are female pay only **₹200 per team** (₹200 concession). Server validates names and emails to prevent fraud.
   - **Stay & University Shuttle**: Outstation teams can add university-arranged accommodation for **₹1,500 per person**, which includes free shuttle pick-up from the accommodation venue to Galgotias University campus and evening drop-back.
2. **Cryptographically Signed RSVP QR Pass**:
   - Themed canvas card generator (`1000x1530px`) rendered with `@napi-rs/canvas`.
   - Displays team name, registration ID, track, and a prominent badge `🏨 ACCOMMODATION & SHUTTLE CONFIRMED (N GUESTS)` for staying teams.
   - Anti-tamper QR payload: `HE26.<regCode>.<HMAC-SHA256>` verified using `QR_SECRET`.
3. **Official Vector PDF Tax Invoices**:
   - Vector A4 PDF invoice generator in `lib/invoice.js` powered by `pdfkit` and clean TrueType `Poppins` fonts.
   - Includes itemized billing, Razorpay transaction ID, official "PAID / SETTLED" stamp, and college reimbursement audit disclaimer.
   - Embedded Accommodation & Shuttle Pass Voucher box with mandatory Govt ID & College ID notices.
4. **Official Confirmation Emails**:
   - Automatically attaches both `HackEarth-RSVP-${regCode}.png` and `HackEarth-Invoice-${regCode}.pdf`.
   - Features inline responsive cards for the QR Pass, Stay Voucher, and itemized billing breakdown.
5. **Sequential Team ID Auto-Assignment (`001`, `002`, `003`...)**:
   - Every successfully registered team is automatically allocated a unique 3-digit zero-padded sequential Team ID starting from `001`.
   - Embedded seamlessly on the registration success screen, downloadable RSVP QR pass (`TEAM #001 · HE26-XXXXXX`), PDF tax invoice, confirmation email, organiser check-in badge, and as **Column #1** in the Master CSV export.
6. **Organiser Entry Desk & Master Database (`/scanner`)**:
   - Protected with private 4-digit PINs (no names exposed on the login screen).
   - **Role-Based Access Control**:
     - **Tarun Kushwaha (Super Admin, PIN `2601`)**: Full edit and management privileges. Can edit any participant field (idea title, roll numbers, stay status, emergency contacts), undo check-ins, admit teams, and download the full Master CSV roster.
     - **Kritika Jha (`2602`), Ansh Vashisth (`2603`), Atharv Singh (`2604`), Md Rahil (`2605`) (View Only)**: Can scan passes and search the database to inspect all team details, roll numbers, and emergency contacts, but cannot edit or alter records.
   - **Individual Member Attendance Checklist**:
     - Interactive `✓ PRESENT` / `✗ ABSENT` toggle switches for each member including the Team Leader.
     - Real-time present counter (`👥 Members Present: X / Y`), `[✓ All Present]` and `[✗ All Absent]` one-click buttons, with instant background autosave.
   - **Full Inspection Details**: Live camera scanning (offline `jsQR`), photo upload fallback, real-time database search across any token (Team ID `001`, name, roll number, college, phone, code), parent emergency contact click-to-call link, stay voucher details, and accountability audit stamp (`Admitted by [Organiser Name] at [Time]`).
   - One-click **"📥 Export Master CSV"** (`/api/export`) for full participant roster download with individual member attendance status.
7. **Full Statutory Compliance & Policies**:
   - Standalone pages and in-app modal viewers for `/terms`, `/privacy`, `/refunds`, and `/contact` required by Razorpay Merchant Onboarding and DPDP Act 2023.

## Running Locally

1. **Install dependencies**: `npm install`
2. **Start local dev server**: `npm start` (or `npm run dev`)
3. Open **`http://localhost:3000`** in your browser.

> [!NOTE]
> The app runs in local test/demo mode automatically if Razorpay and Supabase credentials are not yet configured in `.env`. You can test the form, submit a registration, and view/download the generated themed RSVP QR card and PDF invoice immediately!

## Helpful Scripts

- `npm run preview-qr` — Generates sample RSVP pass cards in `sample-rsvp-pass-with-accommodation.png` and `out/`.
- `npm run generate-emails` — Generates standalone HTML sample confirmation emails in `sample-email-registration-only.html` and `sample-email-with-accommodation.html`.
- `npm run import-shortlist -- shortlist.csv` — Imports Round 1 qualified teams into Supabase.

## Setup for Production (about 20 minutes)

1. **Supabase**: Create a project, open *SQL Editor*, run `supabase/schema.sql`. Copy project URL and `service_role` key.
2. **Razorpay**: Dashboard → API Keys. Start in **Test mode** (`rzp_test_...`). Turn on auto-capture for payments (Settings → Payment capture).
3. **Email**: Gmail/Workspace SMTP with an *App password* (`smtp.gmail.com`, port 465), or Brevo/Resend SMTP.
4. **Environment variables**: Copy `.env.example`, fill it, and add every variable in *Vercel → Project → Settings → Environment Variables*.
5. **Deploy**: Push to GitHub and deploy to Vercel (or use `vercel --prod`).
6. **Webhook**: Razorpay → Settings → Webhooks → add `https://<your-domain>/api/razorpay-webhook`, events `payment.captured` and `order.paid`, secret = `RAZORPAY_WEBHOOK_SECRET`.
