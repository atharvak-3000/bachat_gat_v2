# BachatBook (बचत बुक) — Complete User Manual & Feature Guide

Welcome to **BachatBook**, the comprehensive digital platform designed for Self-Help Groups (SHGs) and Bachat Gats (बचत गट). This user guide provides step-by-step instructions for every action in the application — from initial group registration to monthly meetings, loans, EMI processing, KYC verification, and passbook tracking.

---

## Table of Contents
1. [Overview & Key Features](#1-overview--key-features)
2. [Module 1: Creating & Registering a New Bachat Gat](#module-1-creating--registering-a-new-bachat-gat)
3. [Module 2: Member Management & Group Code Joining](#module-2-member-management--group-code-joining)
4. [Module 3: Member KYC Document Submission & Verification](#module-3-member-kyc-document-submission--verification)
5. [Module 4: Setting Up & Applying for a Loan](#module-4-setting-up--applying-for-a-loan)
6. [Module 5: Loan Approval, Disbursement & EMI Tracking](#module-5-loan-approval-disbursement--emi-tracking)
7. [Module 6: Monthly Meetings, Attendance & Savings Ledger](#module-6-monthly-meetings-attendance--savings-ledger)
8. [Module 7: Digital Member Passbook & Transparency](#module-7-digital-member-passbook--transparency)
9. [Module 8: Admin Reports & Multi-Gat Platform Management](#module-8-admin-reports--multi-gat-platform-management)

---

## 1. Overview & Key Features

BachatBook eliminates paper registers, manual accounting errors, and lack of financial transparency in Bachat Gats. It supports both **Marathi (मराठी)** and **English**, enabling seamless management on desktop and mobile browsers.

### Core Capabilities
- **Multi-Role Access**: Superadmin (Platform Oversight), Admin / President (Group Management), and Member (Individual Passbook & Loan Requests).
- **Unique Group Code**: Every Bachat Gat gets an automatic 5-character code (e.g. `SG001`) for quick member registration.
- **Dynamic EMI & Loan Calculator**: Real-time monthly interest and principal split computation based on customizable interest rates (e.g. 2% per month).
- **Batch Monthly Meetings**: Conduct regular monthly meetings with one-click attendance, automated savings contribution logging, interest collection, and expense tracking.
- **100% Transparent Passbook**: Every member can inspect their savings balance, loan obligations, and past contribution records in real-time.

---

## Module 1: Creating & Registering a New Bachat Gat

### Step 1.1: Registration Form Access
1. Visit the home page and click **"Register Group / गटाची नोंदणी करा"** or navigate to `/onboarding`.
2. Enter the official Bachat Gat details:
   - **Organization Name / गटाचे नाव**: e.g., *Shree Ganesh Mahila Bachat Gat*.
   - **Marathi Name / मराठी नाव**: e.g., *श्री गणेश महिला बचत गट*.
   - **District, Taluka, Village / जिल्हा, तालुका, गाव**: Select your regional location.

### Step 1.2: Setting Financial Parameters
- **Monthly Savings Amount / मासिक बचत रक्कम**: Set the fixed monthly deposit per member (e.g., ₹200 or ₹500).
- **Default Interest Rate / डीफॉल्ट व्याज दर**: Annual or monthly interest rate for member loans (e.g., 2% per month).
- **Default Penalty Amount / दंड रक्कम**: Late fine levied on missed contributions.
- **Max Loan Limit / कमाल कर्ज मर्यादा**: Maximum allowable loan ceiling per member.

![Step 1 - Bachat Gat Registration](/docs/screenshots/step1_gat_registration.png)

---

## Module 2: Member Management & Group Code Joining

### Step 2.1: Adding Members by Admin
1. Log in as Gat Admin/President and navigate to **Members / सदस्य** from the sidebar (`/members`).
2. Click **"Add Member / नवीन सदस्य जोडा"**.
3. Fill in member details: Full Name, Phone Number, Role (Member / Admin), and initial Member Number.

### Step 2.2: Joining via Group Code
1. New members open the application and click **"Join Bachat Gat / गटात सामील व्हा"** (`/join`).
2. Enter the unique 5-character **Group Code** (e.g. `SG001`) provided by the Gat President.
3. Enter their phone number and personal details.
4. Once submitted, the status will show as `PENDING` until the Gat Admin approves the member request.

![Step 2 - Member Directory & Join Code](/docs/screenshots/step2_add_members.png)

---

## Module 3: Member KYC Document Submission & Verification

To maintain security and compliance, BachatBook includes built-in Know-Your-Customer (KYC) processing.

### Step 3.1: Member Document Upload
1. Members log in to their account and navigate to **My Profile & KYC / केवायसी** (`/member/kyc`).
2. Upload clear digital photos or documents for:
   - **Aadhaar Card / आधार कार्ड**
   - **PAN Card / पॅन कार्ड**
   - **Bank Passbook Copy / बँक पासबुक प्रत**
3. Submit for verification.

### Step 3.2: Admin KYC Verification Workflow
1. Admins navigate to **Member KYC Reviews / केवायसी पडताळणी** under the Admin Portal.
2. Inspect submitted document images and details.
3. Click **"Approve KYC / केवायसी मंजूर करा"** or **"Reject KYC"** with detailed notes.

![Step 3 - KYC Verification Interface](/docs/screenshots/step3_kyc_verification.png)

---

## Module 4: Setting Up & Applying for a Loan

Members can request loans directly from the digital portal, and administrators can customize interest rates and repayment tenures.

### Step 4.1: Submitting a Loan Request
1. Member navigates to **Apply for Loan / कर्जासाठी अर्ज करा** (`/member/loans`).
2. Specify required parameters:
   - **Loan Amount / कर्जाची रक्कम**: e.g., ₹10,000.
   - **Purpose of Loan / कर्जाचे कारण**: e.g., Agriculture, Business, Medical.
   - **Repayment Tenure / कालावधी (महिने)**: e.g., 10 months.
   - **Guarantor Member / जामीनदार सदस्य**: Select another active member as guarantor.
3. Click **Submit Application**.

![Step 4 - Loan Request Setup](/docs/screenshots/step4_loan_setup.png)

---

## Module 5: Loan Approval, Disbursement & EMI Tracking

### Step 5.1: Admin Loan Review & Approval
1. Gat Admin navigates to **Loans Management / कर्ज व्यवस्थापन** (`/loans`).
2. View pending requests under the **"Pending Approvals"** tab.
3. Review total member savings, guarantor status, and requested tenure.
4. Click **"Approve Loan / कर्ज मंजूर करा"**.

### Step 5.2: Disbursing Loans & EMI Schedule Generation
1. Click **"Disburse Funds / कर्ज वितरण करा"** to release funds to the member.
2. The system automatically computes the monthly **EMI Schedule** (Principal portion + Monthly Interest portion).

### Step 5.3: EMI Repayment Tracking
- View full repayment schedule for each loan (`/loans?tab=emis`).
- Track **Paid**, **Pending**, and **Overdue** EMIs with late penalty highlights.

![Step 5 & 6 - Loan Disbursement & EMI Schedule](/docs/screenshots/step5_loan_disbursement.png)
![Step 6 - EMI Schedule Tracker](/docs/screenshots/step6_emi_tracker.png)

---

## Module 6: Monthly Meetings, Attendance & Savings Ledger

Monthly meetings are the foundation of Bachat Gat financial cycles.

### Step 6.1: Starting a New Meeting
1. Admin navigates to **Meetings / मासिक बैठका** (`/meetings`).
2. Click **"Schedule / Conduct Meeting"** and select the month (e.g. August 2026).
3. The system pulls all active members into the meeting attendance register.

### Step 6.2: Recording Attendance & Contributions
1. Mark **Attendance** (Present / Absent) for each member.
2. Record **Monthly Savings** collected (pre-filled with group default e.g. ₹200).
3. Record **Loan Principal Repayment** and **Interest Collection** for members with active loans.
4. Add **Meeting Expenses** (refreshments, stationery) or **Income** (fines, external interest).
5. Click **"Finalize Meeting & Update Balances"** to lock the monthly ledger.

![Step 7 - Monthly Meeting Ledger](/docs/screenshots/step7_monthly_meeting.png)

---

## Module 7: Digital Member Passbook & Transparency

Members have complete visibility over their personal finances through the digital passbook.

### Step 7.1: Viewing Personal Passbook
1. Member logs in and navigates to **Passbook / डिजिटल पासबुक** (`/member/passbook`).
2. View real-time summary stats:
   - **Total Savings Accumulated / एकूण साचलेली बचत**
   - **Active Loans & Outstanding Balance / चालू कर्ज आणि शिल्लक**
   - **Total Interest Paid / एकूण दिलेले व्याज**
3. Inspect chronological transaction history table with dates, meeting IDs, and payment references.

![Step 8 - Digital Passbook View](/docs/screenshots/step8_member_passbook.png)

---

## Module 8: Admin Reports & Multi-Gat Platform Management

### Step 8.1: Financial Overview & Export
- Access financial metrics on the Admin Dashboard (`/dashboard`): Total Cash in Bank, Total Disbursed Loans, Monthly Savings Growth.
- Export transaction registers to PDF or Excel format for bank submission and audits.

### Step 8.2: Platform Superadmin Portal
- Platform Superadmins access `/platform/dashboard` to review all registered Bachat Gats across villages, verify subscription statuses, and manage system parameters.

---

*Documentation generated for BachatBook V2.*
