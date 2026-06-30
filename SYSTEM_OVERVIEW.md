# EduPay Verify System Overview

EduPay Verify is a web-based payment verification and exam permit system. It helps students submit payment receipts, lets cashiers approve or reject those payments, records exam eligibility, generates QR-based exam permits, and lets teachers/proctors scan and approve or reject students during exams.

The project is split into two main applications:

- `client/` - React + Vite frontend used by students, cashiers, teachers, and super admins.
- `server/` - Express + MongoDB backend that handles authentication, payments, exam permits, notifications, reports, and exam schedules.

## High-Level Architecture

```text
React Client
  |
  | Axios requests with JWT token
  v
Express API Server
  |
  | Mongoose models
  v
MongoDB Database

External services:
- Cloudinary stores uploaded receipt files.
- Tesseract.js reads receipt text through OCR.
- QRCode generates exam permit QR images.
```

The frontend stores the logged-in user's JWT token and role in `localStorage`. Every API request made through `client/src/api/client.js` attaches the token as a Bearer token. The backend validates that token through `server/middleware/protect.js`, then role-specific middleware limits access to cashier, teacher, or super admin features.

## Main User Roles

### Student

Students can register, log in, upload receipts, view payment history, read notifications, check eligibility, and generate exam permit QR codes after their payment is approved.

Main frontend pages:

- `StudentDashboard.jsx`
- `UploadReceipt.jsx`
- `PaymentHistory.jsx`
- `Notifications.jsx`
- `ExamPermit.jsx`

### Cashier

Cashiers verify uploaded receipts, approve or reject payments, create direct payments, receive receipt notifications, and view payment reports.

Main frontend pages:

- `CashierDashboard.jsx`
- `VerifyPayments.jsx`
- `Reports.jsx`
- `Notifications.jsx`

### Teacher

Teachers act as exam proctors. They can view assigned exams, scan student permit QR codes, and decide whether a permit is approved or rejected at exam time.

Main frontend pages:

- `TeacherProctor.jsx`
- `AssignedExams.jsx`

### Super Admin

Super admins manage users, create and manage exam schedules, assign teachers as proctors, view reports, and access admin dashboards.

Main frontend pages:

- `SuperAdminDashboard.jsx`
- `UserManagement.jsx`
- `ExamSchedule.jsx`
- `ExamScheduleReport.jsx`
- `Reports.jsx`

## Frontend Structure

The frontend starts at `client/src/main.jsx`, which renders `client/src/App.jsx`.

`App.jsx` defines the routes for the whole frontend. Public access goes to the login page at `/`. All other pages are wrapped in `ProtectedRoute`, which checks whether a token exists and whether the stored role is allowed to access that page.

Important frontend folders:

- `client/src/pages/` - full screens for each role and feature.
- `client/src/api/` - API wrapper modules that call backend endpoints.
- `client/src/components/layout/` - shared shell layout, header, and sidebar.
- `client/src/components/ui/` - reusable UI elements such as modals, cards, badges, skeletons, and empty states.
- `client/src/config/navigation.js` - role-based sidebar navigation.
- `client/src/hooks/useAuth.js` - authentication helpers such as default route selection.

The shared Axios instance is in `client/src/api/client.js`:

- Base URL: `http://localhost:5000/api`
- Adds `Authorization: Bearer <token>` when a token exists in `localStorage`

## Backend Structure

The backend starts at `server/server.js`.

It loads environment variables, creates an Express app, enables CORS and JSON parsing, connects to MongoDB, and mounts route groups under `/api`.

Important backend folders:

- `server/routes/` - maps HTTP endpoints to controllers.
- `server/controllers/` - contains business logic for each feature.
- `server/Models/` - Mongoose schemas for MongoDB collections.
- `server/middleware/` - authentication, role checks, and file upload handling.
- `server/config/` - database and Cloudinary configuration.
- `server/services/` - helper services such as OCR.

## Backend API Groups

The server mounts these route groups:

```text
/api/auth           Authentication
/api/payments       Payment upload, approval, rejection, direct payment
/api/reports        Payment and ledger reports
/api/notifications  Student and cashier notifications
/api/admin          Eligibility lists by exam type
/api/verify         Simple permit validity check
/api/qr             Exam permit QR generation and scanning
/api/eligibility    Student eligibility lookup
/api/users          Super admin user management and cashier student search
/api/exams          Exam schedule and proctor assignment
```

## Database Models

### User

Defined in `server/Models/User.js`.

Stores account and profile information:

- `studentId`
- `name`
- `email`
- `password`
- `role`
- `course`
- `yearLevel`
- `semester`
- `schoolYear`
- `isActive`

Supported roles are `student`, `cashier`, `admin`, `teacher`, and `super_admin`.

### Payment

Defined in `server/Models/Payments.js`.

Stores uploaded receipt payments and cashier-created direct payments:

- `studentId`
- `studentName`
- `invoiceNumber`
- `amount`
- `paymentDescription`
- `receiptDate`
- `receiptImage`
- `examCoverage`
- `status`
- `remarks`
- `rejectionReason`
- `paymentMethod`
- `approvedBy`
- `approvedAt`

Payment statuses include `Pending`, `Approved`, `Rejected`, `Need Review`, and `Direct Payment`.

### Ledger

Defined in `server/Models/Ledger.js`.

Tracks each student's payment balance and exam eligibility:

- `studentId`
- `totalTuition`
- `paidAmount`
- `remainingBalance`
- `fullyPaid`
- `prelim`
- `midterm`
- `preFinal`
- `final`

The ledger is the main source for eligibility checks.

### ExamPermit

Defined in `server/Models/ExamPermit.js`.

Represents a student's valid exam permit for a specific exam type:

- `studentId`
- `studentName`
- `paymentId`
- `examType`
- `qrToken`
- `permitStatus`
- `proctorDecision`
- `proctorRemarks`
- `proctorTeacherId`
- `proctorTeacherName`
- `proctorDecidedAt`
- `scans`

Each student can only have one permit per exam type because of the unique index on `studentId` and `examType`.

### Notification

Defined in `server/Models/Notification.js`.

Stores messages for students, cashiers, and teachers:

- `studentId`
- `studentName`
- `recipientRole`
- `title`
- `message`
- `read`

### Exam

Defined in `server/Models/Exam.js`.

Stores scheduled exams:

- `examDate`
- `examType`
- `subject`
- `subjectCode`
- `schedule`
- `startTime`
- `endTime`
- `room`
- `capacity`
- `courseYear`
- `courseSection`
- `proctorId`
- `proctorName`
- `proctorEmail`
- `status`
- `createdBy`

## Core System Logic

### 1. Authentication and Access Control

Students can register through `/api/auth/register`. Public registration always creates a `student` account. Other roles are created by a super admin through the user management module.

On login, `/api/auth/login` checks the email, verifies the bcrypt password hash, rejects inactive users, and returns:

- JWT token
- user role
- basic user details

The frontend stores the token and role, then redirects the user to the proper dashboard. Protected routes in React prevent users from opening pages that do not match their role.

The backend also protects sensitive routes with middleware:

- `protect` validates the JWT and attaches decoded user data to `req.user`.
- `cashierOnly` allows only cashiers.
- `teacherOnly` allows only teachers.
- `superAdminOnly` allows only super admins.

### 2. Receipt Upload and OCR

Students upload receipt files through `/api/payments`.

The flow is:

1. The route checks that the user is authenticated.
2. `upload.single("receipt")` sends the uploaded file to Cloudinary.
3. `paymentController.createPayment` checks that the account is a student.
4. `ocrService.extractText` runs Tesseract OCR on the uploaded receipt.
5. The backend tries to extract invoice number, student ID, amount, and date from the OCR text.
6. If the receipt student ID does not match the logged-in student's ID, the upload is rejected.
7. A `Payment` record is created with status `Pending`.
8. A cashier notification is created.

This means uploaded receipts do not immediately make a student eligible. A cashier still needs to approve the payment.

### 3. Cashier Payment Approval

Cashiers view payments through `/api/payments` and approve a payment through `/api/payments/approve/:id`.

When a payment is approved:

1. The payment status becomes `Approved`.
2. The student receives a payment approved notification.
3. A `Ledger` record is found or created for the student.
4. The paid amount and remaining balance are updated.
5. If the student is fully paid, all exam eligibility flags are set to true.
6. If the payment has an `examCoverage`, the matching ledger flag is set:
   - `Prelim` -> `prelim`
   - `Midterm` -> `midterm`
   - `PreFinal` -> `preFinal`
   - `Final` -> `final`
7. An `ExamPermit` is created or updated for that student and exam type.
8. The permit receives a secure random `qrToken` when it is first created.

This is the most important chain in the system: approved payment creates eligibility and a valid exam permit.

### 4. Cashier Payment Rejection

Cashiers reject a payment through `/api/payments/reject/:id`.

When rejected:

1. The payment status becomes `Rejected`.
2. Remarks and rejection reason are saved.
3. The student receives a notification explaining the rejection.

Rejected payments do not update the ledger and do not generate permits.

### 5. Direct Payment

Cashiers can record direct payments through `/api/payments/direct-payment`.

This is used when payment is handled directly by the cashier instead of receipt upload.

The flow is similar to approval:

1. Cashier searches or selects a student.
2. Cashier enters amount and optional exam coverage.
3. A `Payment` is created immediately with status `Approved` and method `direct`.
4. The student receives a direct payment notification.
5. If an exam coverage is provided, the ledger and exam permit are updated.

### 6. Eligibility Checks

Eligibility is based on the `Ledger` model.

`/api/eligibility/:studentId` returns the student's eligibility flags:

- `prelim`
- `midterm`
- `preFinal`
- `final`

`/api/verify/:studentId/:examType` checks a single exam type and returns `VALID` or `INVALID`.

The admin route group also provides lists of eligible students per exam type:

- `/api/admin/prelim`
- `/api/admin/midterm`
- `/api/admin/prefinal`
- `/api/admin/final`

### 7. Exam Permit and QR Logic

Exam permits are stored in `ExamPermit`.

Students request a QR code through `/api/qr/generate`. The backend checks:

1. The requester is a student.
2. The requested student ID belongs to the logged-in account.
3. A valid exam permit exists for the requested exam type.

If valid, the server encodes this JSON into a QR image:

```json
{
  "permitId": "permit database id",
  "token": "secure permit token"
}
```

Teachers scan permits through `/api/qr/scan`. The backend finds a valid permit by `qrToken`, records the scan in the permit's `scans` array, and returns the permit data.

Teachers then approve or reject the scanned permit through `/api/qr/:id/proctor-decision`. The decision is saved in the permit along with remarks, teacher information, and timestamp.

### 8. Exam Scheduling

Super admins manage exam schedules through `/api/exams`.

They can:

- Create exams.
- View all exams.
- View exams by date or month.
- Update exams.
- Delete exams.
- Assign teachers as proctors.
- Remove proctors.
- Generate schedule reports.

When a teacher is assigned as a proctor, the system creates a teacher notification.

Teachers can view their assigned exams through `/api/exams/teacher/assigned`.

### 9. Notifications

Notifications are used to keep users informed about important events.

Common notification events:

- A student submits a receipt, notifying cashiers.
- A cashier approves a payment, notifying the student.
- A cashier rejects a payment, notifying the student.
- A cashier records a direct payment, notifying the student.
- A super admin assigns a teacher as proctor, notifying the teacher.
- A proctor assignment is removed, notifying the teacher.

Student notifications are fetched by student ID. Cashier notifications are fetched by recipient role.

## Typical End-to-End Workflow

```text
Student registers or logs in
  |
Student uploads receipt
  |
Receipt is stored in Cloudinary
  |
OCR extracts receipt details
  |
Payment is saved as Pending
  |
Cashier receives notification
  |
Cashier approves payment
  |
Ledger eligibility is updated
  |
ExamPermit is created or updated
  |
Student generates QR permit
  |
Teacher scans QR during exam
  |
Teacher approves or rejects permit
```

## Environment and Runtime Notes

The backend requires environment variables in `server/.env`, especially:

```text
MONGO_URI=...
JWT_SECRET=...
PORT=5000
```

Cloudinary configuration is handled in `server/config/cloudinary.js`, so Cloudinary credentials are also expected when file uploads are used.

To run the backend:

```bash
cd server
npm install
npm run dev
```

To run the frontend:

```bash
cd client
npm install
npm run dev
```

By default, the frontend API client expects the backend at:

```text
http://localhost:5000/api
```

## Summary

EduPay Verify is centered around one core rule: a student becomes eligible for an exam only after a valid payment is approved or recorded by a cashier. Once eligibility is granted, the system creates an exam permit with a QR token. The student presents that QR permit during the exam, and the teacher/proctor scans it and makes the final proctor decision.

The system separates responsibilities by role:

- Students submit payments and use permits.
- Cashiers validate payments and update eligibility.
- Teachers verify permits during exams.
- Super admins manage users, schedules, proctors, and reports.
