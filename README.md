# PulseHR — Frontend

> A modern, role-based HR management web application built with Vanilla JavaScript.

![PulseHR](https://img.shields.io/badge/PulseHR-v2.0-3b82f6?style=for-the-badge)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS](https://img.shields.io/badge/CSS-Custom-1572B6?style=for-the-badge&logo=css3)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📌 Overview

PulseHR is a single-page application (SPA) for employee management. It supports two roles — **Admin** and **Employee** — each with their own dashboard and feature set. The frontend is fully built in Vanilla JS with no frameworks or dependencies, making it lightweight and easy to deploy.

It currently runs with a **mock API layer** and is designed to seamlessly connect to a **.NET REST API backend**.

---

## ✨ Features

### 👤 Employee Portal
- Dashboard with monthly hours, leave balance, and active projects
- Timesheet logging and export (CSV)
- Leave application and history
- Project assignments
- Personal profile and info management
- Company directory and policies

### 🛠️ Admin Portal
- Admin dashboard with org-wide stats
- Full employee management (add, edit, deactivate)
- Project creation and team assignment
- Leave request approvals
- Policy document uploads
- Holidays & events calendar management

---

## 🗂️ Project Structure

```
PulseHR-Frontend/
├── index.html                  # App entry point
├── auth/
│   ├── admin-login.html        # Admin login page
│   └── employee-login.html     # Employee login page
├── components/
│   ├── sidebar.js              # Navigation sidebar
│   └── topbar.js               # Top bar with search & notifications
├── js/
│   ├── app.js                  # App bootstrap & shell layout
│   ├── router.js               # Client-side SPA router
│   ├── data.js                 # Mock data store
│   ├── services/
│   │   └── api.js              # API service layer (mock/real toggle)
│   └── utils/
│       ├── auth.js             # Auth helpers (JWT, roles)
│       ├── helpers.js          # Shared utilities
│       ├── modal.js            # Modal manager
│       └── toast.js            # Toast notifications
├── pages/
│   ├── emp-dashboard.js
│   ├── timesheet.js
│   ├── leaves.js
│   ├── projects.js
│   ├── my-info.js
│   ├── profile.js
│   ├── company.js
│   ├── admin-dashboard.js
│   ├── admin-employees.js
│   ├── admin-projects.js
│   ├── admin-leaves.js
│   ├── admin-policies.js
│   └── admin-holidays.js
├── styles/
│   ├── variables.css           # Design tokens (colors, spacing, fonts)
│   ├── base.css                # Reset & global styles
│   └── components.css          # Reusable UI components
├── API_CONTRACT.md             # Full REST API specification
└── DB_SCHEMA.md                # MS SQL Server database schema
```

---

## 🚀 Getting Started

### Prerequisites
- Any static file server (e.g. VS Code **Live Server** extension)
- No build tools or `npm install` required

### Run Locally

1. Clone the repo:
   ```bash
   git clone https://github.com/shawnfeds/pulsehr-frontend.git
   cd pulsehr-frontend
   ```

2. Open with **Live Server** in VS Code, or serve with any HTTP server:
   ```bash
   npx serve .
   ```

3. Open your browser at `http://localhost:5500`

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pulsehr.io | any |
| Employee | priya@nexus.io | any |

> Mock mode accepts any password — authentication is simulated client-side.

---

## 🔌 Connecting to the Real API

The app ships with a mock API that mirrors the full REST contract. Switching to a live backend takes **two changes** in `js/services/api.js`:

```js
// 1. Disable mock mode
window.MOCK_MODE = false;

// 2. Set your deployed API URL
const BASE_URL = 'https://your-api.com/api';
```

---

## 🏗️ Backend

This frontend is designed to pair with a **.NET 8 Web API** backend.

> 🔗 Backend repo: [pulsehr-api](https://github.com/shawnfeds/pulsehr-api) *(coming soon)*

**Tech stack planned for backend:**
- ASP.NET Core 8 Web API
- Entity Framework Core + MS SQL Server
- JWT Authentication
- Role-based authorization (Admin / Employee)

---

## 📦 Deployment

This is a static site — deploy for **free** on any of these platforms:

| Platform | Steps |
|----------|-------|
| **Netlify** | Drag & drop the folder at [netlify.com](https://netlify.com) |
| **GitHub Pages** | Enable in repo Settings → Pages → `main` branch |
| **Cloudflare Pages** | Connect GitHub repo at [pages.cloudflare.com](https://pages.cloudflare.com) |

---

## 📝 License

MIT © [LICENSE](LICENSE)
