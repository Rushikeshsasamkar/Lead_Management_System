# CRM+ Lead Management System

A full-stack CRM application built with the MERN stack to manage sales leads with role-based access control, real-time notifications, and advanced filtering.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [RBAC — Roles & Permissions](#rbac--roles--permissions)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seed Demo Data](#seed-demo-data)
- [API Reference](#api-reference)
- [How Notifications Work](#how-notifications-work)
- [MongoDB Indexes](#mongodb-indexes)
- [Design Decisions](#design-decisions)

---

## Overview

CRM+ lets a sales team manage leads from creation to closure. An **admin** controls user roles, a **manager** oversees all leads and gets real-time alerts, and **sales** reps manage only the leads assigned to them.

```
User logs in → gets JWT token → all API calls use that token
Every lead action (create/update/delete) → triggers a notification
Notification saved in DB + sent via Socket.IO in real time
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose 6 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Realtime | Socket.IO |
| HTTP Client | Axios |

---

## Project Structure

```
compumatrix/
│
├── backend/
│   ├── config/
│   │   └── rbac.js                  # permission map for each role
│   ├── controllers/
│   │   ├── authController.js        # register, login, logout
│   │   ├── leadController.js        # CRUD + stats aggregation
│   │   ├── notificationController.js
│   │   └── userController.js        # list users, update role
│   ├── middlewares/
│   │   ├── auth.js                  # verify JWT token
│   │   └── rbac.js                  # check permission per route
│   ├── models/
│   │   ├── User.js
│   │   ├── Lead.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── leads.js
│   │   ├── notifications.js
│   │   ├── users.js
│   │   └── dashboard.js
│   ├── services/
│   │   └── notificationService.js   # save to DB + emit via socket
│   ├── scripts/
│   │   └── seed.js                  # create demo users + leads
│   ├── server.js                    # entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── context/
│       │   ├── AuthContext.jsx       # user state, login/logout, hasPermission
│       │   └── SocketContext.jsx     # socket connection, live notifications
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── NotificationBell.jsx  # bell icon + dropdown
│       │   └── ProtectedRoute.jsx    # auth + permission guard
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── LeadsList.jsx         # table with filters + pagination
│       │   ├── LeadForm.jsx          # create / edit lead
│       │   ├── Dashboard.jsx         # stats cards + bar chart
│       │   └── Notifications.jsx     # paginated notification list
│       ├── services/
│       │   └── api.js                # axios with JWT + 401 interceptors
│       ├── App.jsx
│       └── index.css
│
└── README.md
```

---

## Features

### Authentication
- Register and login with email + password
- Passwords hashed with **bcrypt** (10 salt rounds)
- JWT token stored in `localStorage`
- Global **401 interceptor** — auto redirects to login on token expiry
- **Rate limiting** on login endpoint (10 requests / 15 min) to prevent brute force

### Role-Based Access Control (RBAC)
- 3 roles: `admin`, `manager`, `sales`
- Every API route checks a specific **permission** (not just role)
- UI buttons and pages hidden/shown based on role
- Sales role enforced at **DB query level** — not just application logic

### Lead Management
- Full CRUD — create, view, edit, delete leads
- Fields: name, phone, email, source, status, notes, assignedTo
- **Sales** can only access leads they created or are assigned to
- **Manager/Admin** can access all leads

### Advanced List API
- Search across name, email, phone (case-insensitive, debounced)
- Filter by status, source, date range, assignedTo
- Sort by any field ascending or descending
- Pagination with accurate total count
- Uses **MongoDB `$facet`** to get data + total count in one query

### Analytics Dashboard
- Total leads count
- Breakdown by status (new, contacted, qualified, won, lost)
- Breakdown by source (website, referral, cold, social, other)
- Optional date range filter
- Visual bar chart — no external chart library needed

### Real-time Notifications
- Powered by **Socket.IO**
- Every user joins a private room (their userId)
- Notifications saved to MongoDB AND emitted via socket at the same time
- Bell icon with live unread count badge
- Mark as read — one at a time or all at once

---

## RBAC — Roles & Permissions

| Permission | Admin | Manager | Sales |
|------------|:-----:|:-------:|:-----:|
| `lead:read` | All | All | Own only |
| `lead:write` | All | All | Own only |
| `lead:delete` | Yes | No | No |
| `user:read` | Yes | Yes | No |
| `user:write` | Yes | No | No |
| `dashboard:read` | Yes | Yes | No |
| `notification:read` | Yes | Yes | Yes |

> **"Own only"** means leads where `createdBy === userId` OR `assignedTo === userId`

### Notification Triggers

| Action | Who Gets Notified |
|--------|------------------|
| Lead created | All managers + admins (excluding creator) |
| Lead assigned | The newly assigned user |
| Lead status changed | Assigned user + all managers/admins |
| Lead deleted | All managers + admins |

---

## Getting Started

### Prerequisites
- Node.js v16+
- MongoDB running locally on port `27017`

### Step 1 — Install dependencies

```bash
# backend
cd backend
npm install

# frontend (open new terminal)
cd frontend
npm install
```

### Step 2 — Setup environment files

```bash
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env
```

### Step 3 — Start servers

```bash
# terminal 1 — backend (http://localhost:5000)
cd backend && npm run dev

# terminal 2 — frontend (http://localhost:5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

### backend/.env

```env
MONGO_URI=mongodb://localhost:27017/crm-db
JWT_SECRET=your_random_secret_key_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

### frontend/.env

```env
VITE_API_URL=http://localhost:5000
```

---

## Seed Demo Data

Populate the database with 3 users and 25 sample leads:

```bash
cd backend
npm run seed
```

### Demo Accounts

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@test.com | password123 | Admin | Full access |
| manager@test.com | password123 | Manager | All leads + dashboard |
| sales@test.com | password123 | Sales | Own leads only |

---

## API Reference

### Auth Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{ name, email, password }` | Register |
| POST | `/auth/login` | `{ email, password }` | Login → returns JWT |
| POST | `/auth/logout` | — | Logout |

**Login response:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Admin User", "email": "admin@test.com", "role": "admin" }
}
```

---

### Lead Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/leads` | `lead:read` | List leads with filters |
| POST | `/leads` | `lead:write` | Create new lead |
| GET | `/leads/:id` | `lead:read` | Get single lead |
| PATCH | `/leads/:id` | `lead:write` | Update lead |
| DELETE | `/leads/:id` | `lead:delete` | Delete lead |
| GET | `/leads/stats/summary` | `dashboard:read` | Analytics data |

**GET /leads — all query params:**

```
GET /leads?q=john&status=new&source=website&sort=createdAt:desc&page=1&limit=10
```

| Param | Description | Example |
|-------|-------------|---------|
| `q` | Search name, email, phone | `john` |
| `status` | Filter by status | `new` / `contacted` / `qualified` / `won` / `lost` |
| `source` | Filter by source | `website` / `referral` / `cold` / `social` / `other` |
| `assignedTo` | Filter by user ID (manager/admin only) | `<userId>` |
| `createdFrom` | Start date filter (ISO format) | `2024-01-01` |
| `createdTo` | End date filter (ISO format) | `2024-12-31` |
| `sort` | `field:order` | `createdAt:desc` / `name:asc` |
| `page` | Page number (default: 1) | `2` |
| `limit` | Items per page (default: 10, max: 100) | `20` |

**GET /leads response:**
```json
{
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "phone": "+919876543210",
      "email": "john@example.com",
      "source": "website",
      "status": "new",
      "assignedTo": { "_id": "...", "name": "Sales User", "email": "sales@test.com" },
      "createdBy": { "_id": "...", "name": "Admin User" },
      "createdAt": "2024-03-29T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

**POST /leads request body:**
```json
{
  "name": "Jane Smith",
  "phone": "+919876543210",
  "email": "jane@example.com",
  "source": "referral",
  "status": "new",
  "notes": "Interested in premium plan",
  "assignedTo": "<userId>"
}
```

---

### Analytics Endpoint

**GET /leads/stats/summary**

Optional query: `?createdFrom=2024-01-01&createdTo=2024-12-31`

```json
{
  "totalLeads": 150,
  "byStatus": {
    "new": 45,
    "contacted": 30,
    "qualified": 25,
    "won": 35,
    "lost": 15
  },
  "bySource": {
    "website": 80,
    "referral": 45,
    "cold": 25,
    "social": 10,
    "other": 5
  }
}
```

---

### User Endpoints (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| PATCH | `/users/:id/role` | Update user role |

**PATCH /users/:id/role body:**
```json
{ "role": "manager" }
```

---

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications?page=1&limit=10` | Get paginated notifications |
| PATCH | `/notifications/:id/read` | Mark notification as read |

---

## How Notifications Work

```
Lead Action happens (create / update / delete)
            │
            ▼
    notificationService.js
            │
            ├──► 1. Notification.create()  ──► Saved to MongoDB
            │                                   (available via REST API)
            │
            └──► 2. io.to(userId).emit()   ──► Sent via Socket.IO
                                                (received instantly in browser)
```

**Socket.IO connection flow:**

```
Frontend connects to Socket.IO server
    │
    ├── Sends JWT token in handshake: { auth: { token } }
    │
    ▼
Backend verifies token → gets userId from payload
    │
    ▼
socket.join(userId)  →  user is now in their private room
    │
    ▼
io.to(userId).emit('notification', data)  →  only that user receives it
```

**Frontend listens in SocketContext:**
```js
socket.on('notification', (notif) => {
  setLiveNotifications(prev => [notif, ...prev])
  setUnreadCount(prev => prev + 1)        // bell icon updates instantly
})
```

---

## MongoDB Indexes

### Lead collection

```js
{ createdBy: 1 }                        // filter by creator
{ assignedTo: 1 }                       // filter by assigned user
{ status: 1 }                           // filter by status
{ source: 1 }                           // filter by source
{ createdAt: -1 }                       // sort newest first
{ status: 1, source: 1, createdAt: -1 } // compound: combined filter + sort
```

### Notification collection

```js
{ userId: 1, read: 1 }       // fast unread count per user
{ userId: 1, createdAt: -1 } // fast paginated list per user
```

---

## Design Decisions

**Why `$facet` aggregation?**
Instead of two DB queries (one for data, one for total count), `$facet` runs both in a single round-trip. Faster and more consistent — count always matches the filtered data.

**Why Socket.IO rooms per user?**
`io.to(userId).emit()` sends to exactly one user without looping or broadcasting. Scales cleanly — adding more users doesn't affect each other.

**Why save notifications to DB AND emit via socket?**
If user is offline when notification fires, the socket emit does nothing. But the DB record is always there — user sees it when they next open the app via `GET /notifications`.

**Why enforce sales access at the DB level?**
The `$or: [{ createdBy: userId }, { assignedTo: userId }]` filter is added to the MongoDB query itself — not just checked in JS. Even if someone crafts a direct API request, they cannot get data they don't own.

**Why Axios interceptors?**
Attaching the JWT token and handling 401 globally means no individual page needs to worry about auth headers or session expiry. All API calls automatically get the token, and any 401 response triggers a logout.
