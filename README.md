# Society Maintenance Tracker

A premium, modern web application built on the **MERN (MongoDB, Express.js, React, Node.js)** stack. It offers residents a sleek interface to raise and monitor support tickets with photo uploads, while providing administrators a robust dashboard with overdue ticket auto-surfacing, priority controls, notice board managers, and automated status change email notifications.

---

## Architecture & Tech Stack

- **Backend**: Node.js & Express.js server supplying a RESTful API.
- **Frontend**: Vite + React single-page application utilizing premium Vanilla CSS styling, responsive CSS custom variables, and clean glassmorphism styling.
- **Database**: MongoDB (via Mongoose ODM) with schemas for Users, Complaints, Notice Board messages, and global Configurations.
- **Authentication**: JWT (JSON Web Token) authorization stored locally on client, with role-based access gates (`resident` / `admin`).
- **File Storage**: Local uploads of complaint photos handled via Multer middleware.
- **Notifications**: Nodemailer email alerts sent when tickets undergo status shifts or when important notices are pinned.

---

## Directory Structure

```text
├── backend/
│   ├── config/             # DB configuration
│   ├── middleware/         # Auth verification and file filter helpers
│   ├── models/             # Mongoose database schemas
│   ├── routes/             # Express API endpoints
│   ├── uploads/            # Local directory for user attached images
│   ├── utils/              # Email transporter module
│   ├── .env                # Server local env vars (ignored in git)
│   ├── package.json        # Backend dependencies
│   ├── server.js           # Express main server entry
│   └── test-api.js         # API integration verification script
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable layout guards (ProtectedRoute)
│   │   ├── context/        # Session AuthContext state provider
│   │   ├── pages/          # Login, Register, Dashboards view screens
│   │   ├── utils/          # API fetch utility client
│   │   ├── App.jsx         # App router routing paths
│   │   ├── index.css       # Core styling, animations, themes stylesheet
│   │   └── main.jsx        # SPA mount point
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite compilation settings
│
├── .gitignore              # Project Git ignore list
├── .env.example            # Environment variables template
├── README.md               # User manual and setup guidelines (This file)
└── system_design.md        # 800-word design methodology write-up
```

---

## Setup & Running Guide

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- MongoDB installed locally (running on `mongodb://localhost:27017`) or a remote MongoDB Atlas URI.

### Step 1: Clone and Configure Environment

1. Rename the `.env.example` at the root to `.env` or create a `.env` in the `backend/` folder:
   ```bash
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/society_maintenance_tracker
   JWT_SECRET=developer_security_signing_key_secret
   JWT_EXPIRES_IN=30d
   ```
2. *(Optional)* Configure SMTP settings in the `.env` to receive emails. If these are left blank, emails will still print mock logs directly to the Node terminal console.

### Step 2: Start the Backend Server

1. Open your terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install server-side packages:
   ```bash
   npm install
   ```
3. Boot up the server in development mode (using Nodemon):
   ```bash
   npm run dev
   ```
   The backend should log that it connected to MongoDB and is listening on **Port 5000**.

### Step 3: Verify Backend API (Integration Test)

1. Keeping the backend running, open a new terminal and navigate to the `backend/` folder.
2. Run the programmatic check script:
   ```bash
   node test-api.js
   ```
   This will execute automated sign-up, sign-in, tickets creation, notice boards updates, and cleanups to verify that all routes work perfectly.

### Step 4: Run the React Frontend

1. Navigate to the `frontend/` directory in a new terminal window:
   ```bash
   cd frontend
   ```
2. Install frontend packages:
   ```bash
   npm install
   ```
3. Spin up Vite's local dev server:
   ```bash
   npm run dev
   ```
4. Click the output URL in your terminal (usually `http://localhost:5173`) to launch the application.

---

## Database Schemas

### 1. User Collection
- `name` (String, required)
- `email` (String, required, unique, validated)
- `password` (String, required, hashed with Bcrypt)
- `role` (String, enum: `['resident', 'admin']`, default: `'resident'`)

### 2. Complaint Collection
- `title` (String, required, max 100 chars)
- `description` (String, required)
- `category` (String, required, enum: Plumbing, Electrical, Security, Cleanliness, Common Area, Others)
- `photoUrl` (String, relative path from static server)
- `status` (String, enum: Open, In Progress, Resolved)
- `priority` (String, enum: Low, Medium, High)
- `residentId` (ObjectId, ref User)
- `statusHistory` (Array of status change logs):
  - `status` (String)
  - `actor` (ObjectId, ref User)
  - `actorName` (String)
  - `note` (String)
  - `timestamp` (Date)

### 3. Notice Collection
- `title` (String, required)
- `content` (String, required)
- `isImportant` (Boolean, default: false) - pins announcement and sends emails
- `authorId` (ObjectId, ref User)

### 4. Settings Collection
- `key` (String, unique) - e.g. `'overdue_threshold_days'`
- `value` (Mixed) - e.g. `3`

---

## API Endpoints Documentation

### Authentication (`/api/auth`)
- `POST /register`: Register a user. Body: `{ name, email, password, role }`.
- `POST /login`: Log in. Body: `{ email, password }`. Returns JWT token and User info.
- `GET /me`: Returns current user details (JWT validation required).

### Settings (`/api/settings`)
- `GET /`: Get settings. Returns overdue threshold configuration.
- `PUT /`: Update settings. Body: `{ overdueThresholdDays }`. (Admin only).

### Notice Board (`/api/notices`)
- `GET /`: Fetch all notice posts. Important (pinned) notices appear first.
- `POST /`: Create notice. Body: `{ title, content, isImportant }`. (Admin only).
- `DELETE /:id`: Delete notice. (Admin only).

### Complaints Tracker (`/api/complaints`)
- `POST /`: Submit new complaint (Supports Multipart FormData for uploads). (Resident only).
- `GET /`: Retrieve all complaints. Filters: `?category=...&status=...&date=...&overdue=true`. (Admin only).
- `GET /my`: Get logged-in resident's own complaints.
- `PUT /:id/status`: Edit ticket status. Body: `{ status, note }`. (Admin only).
- `PUT /:id/priority`: Edit priority. Body: `{ priority }`. (Admin only).

### Admin Dashboard Stats (`/api/dashboard/stats`)
- `GET /stats`: Retrieve counts by status, by category, total, and overdue count. (Admin only).
