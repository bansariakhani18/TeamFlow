# TeamFlow — Collaborative Task & Workspace Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19%20%2F%2018-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Mongoose_8%2B-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT_%26_Bcrypt-FFB300?style=for-the-badge&logo=json-web-tokens&logoColor=black)](https://jwt.io/)

> **TeamFlow** is a modern, enterprise-grade collaborative task and workspace management platform designed for cross-functional product, design, and engineering teams. Built on a decoupled MERN architecture with an executive pastel design system, TeamFlow provides fluid workspace partitioning, role-based access control, real-time audit logging, and team velocity tracking.

---

## Academic Context & Module Ownership

Developed as part of **IT645 — Web and Mobile Development (MERN Stack)** at **Dhirubhai Ambani University (DA-IICT)**.

| Contributor | Student ID | Module Responsibility | Status |
| :--- | :--- | :--- | :---: |
| **Bansari Akhani** | `202512032` | **Module 1:** Project & Workspace Management, Core Auth, Design System | **Completed** |
| **Heer Sachdev** | `202512117` | **Module 2:** Task & Workflow Management | *In Progress* |
| **Ishpreet Kaur** | `202512104` | **Module 3:** Collaboration & Activity Tracking | *In Progress* |
| **Kriti Patel** | `202512018` | **Module 4:** Dashboard, Analytics & Notifications | *In Progress* |

---

## System Architecture

TeamFlow uses a decoupled client-server architecture engineered for scalability, high availability, and type-safe API communication:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TEAMFLOW CLIENT (React SPA)                     │
│    Vite • Tailwind CSS • Axios Client • Context Auth Provider • Lucide  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JSON)
                                    │ Bearer JWT Authentication
┌───────────────────────────────────▼────────────────────────────────────┐
│                       TEAMFLOW SERVER (Express API)                    │
│    Node.js (ESM) • Express 5 • Zod Request Validator • Async Handlers  │
│    JWT Protect Middleware • Role Authorization • Audit Request Logger  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐       ┌────────────────────────┐
       │   MongoDB Atlas Cloud  │       │  Resend Transactional  │
       │  Mongoose 8+ ODM       │       │  Email Provider (SMTP) │
       │  (Users, Projects,     │       └────────────────────────┘
       │   Activities, Tasks)   │
       └────────────────────────┘
```

---

## Core Features & Module Architecture

### Module 1: Project & Workspace Management *(Completed)*
- **Project Lifecycle Operations:** Full CRUD capabilities for enterprise workspaces, including name, description, priority levels (`Low`, `Medium`, `High`, `Urgent`), and status management (`Active`, `Archived`, `Completed`).
- **Dynamic Member Invitations & Lookup:** Real-time member search with debounced user discovery, email-based lookup, and duplicate assignment prevention.
- **Role-Based Access Control (RBAC):** Strict permission hierarchies distinguishing **Owners**, **Admins**, **Members**, and **Viewers**, enforced at both controller and database middleware layers.
- **Audit & Activity Logging:** Granular, immutable audit trail (`Activity` collection) capturing timestamps, actor IDs, action categories (`PROJECT_CREATED`, `MEMBER_ADDED`, `PROJECT_UPDATED`, `MEMBER_REMOVED`), and target entity metadata.
- **Workspace State Persistence:** Seamless context preservation ensuring project selection and user context persist across client page refreshes.

### Core Authentication & Security *(Completed)*
- **Stateless JWT Authorization:** Cryptographically signed tokens with configurable expiration (`JWT_EXPIRES_IN`), verified on protected API routes via `protect` middleware.
- **Bcrypt Password Hashing:** Salted key derivation (10 salt rounds) using modern async pre-save hooks compatible with Mongoose 8+.
- **Zod Schema Validation:** Strict runtime payload validation for registration, login, project creation, and member modification with human-readable error messages.
- **Executive Split-Hero UI:** Seamless single-container authentication card featuring high-resolution collaborative imagery, clean typographic hierarchy, and zero clutter.

### Module 2: Task & Workflow Management *(Team Placeholder)*
- Interactive Kanban boards with drag-and-drop workflow columns (`Backlog`, `In Progress`, `Review`, `Done`).
- Task assignment, deadline tracking, checklist items, and priority indicators.
- Subtask dependencies and milestone scheduling.

### Module 3: Collaboration & Activity Tracking *(Team Placeholder)*
- Contextual task comment threads with rich text support.
- User mentions (`@username`) and live collaboration notifications.
- Granular team event stream and unified activity timeline.

### Module 4: Dashboard, Analytics & Notifications *(Team Placeholder)*
- Executive analytics dashboard displaying project velocity, completion rates, and team bandwidth.
- Visual charts and capacity planning meters.
- Multi-channel notification center (in-app toasts, unread activity badges, and transactional email alerts).

---

## Tech Stack & Design System

### Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Node.js (ES Modules), Express.js 5.x, Zod 4.x, Bcrypt.js, JSON Web Tokens (`jsonwebtoken`), CORS, Resend SDK |
| **Database & ODM** | MongoDB Atlas, Mongoose 8+ (with dual IPv4 DNS resolvers for reliable SRV lookups) |
| **Frontend Client** | React 19 / 18, Vite 6.x, React Router v7, Tailwind CSS v4, Axios, Lucide React Icons |
| **Code Quality** | Oxlint, Nodemon, ESLint / Prettier conventions |

### Design System & Visual Tokens

TeamFlow adheres to the **Executive Pastel Sage** design system (documented in [`design.md`](./design.md)), balancing mature minimalism with calm, high-contrast usability:

- **Global Canvas:** Warm Natural Linen `#F4F3EF` (`bg-[#F4F3EF]`) — removes harsh blue screen glare and provides a tactile, executive aesthetic.
- **Surfaces & Cards:** Crisp Pure White `#FFFFFF` with refined borders (`border-stone-200/80`) and soft ambient shadows (`shadow-sm` / `shadow-md`).
- **Primary Brand Color:** Soft Pastel Sage `#4E8765`
  - Hover: `#3B6B50`
  - Active / Focus: `#2F5640`
  - Soft Tint / Badges: `#E8F2EC`
- **Typography & Neutrals:** Deep Slate `#1F2937` for primary titles, Muted Slate `#6B7280` for secondary metadata, Stone `#E7E5E4` for subtle dividers.
- **Supporting Pastels:** Butter Yellow (`#FFF3C4` / `#B48209`), Sky Blue (`#E0F2FE` / `#0284C7`), Coral (`#FFE5D9` / `#D97767`), Lavender (`#F3E8FF` / `#7E22CE`).
- **3D Isometric Brand Mark ("Logo B"):** Custom SVG isometric badge representing overlapping, multi-tiered workspace boards (`BrandLogo.jsx`).

---

## API Reference Overview

All API endpoints are prefixed with `/api`. Protected routes require a valid header: `Authorization: Bearer <token>`.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account (name, email, password) |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and return signed JWT |
| `GET` | `/api/auth/me` | Protected | Fetch authenticated user profile |

### Project & Workspace Endpoints (`/api/projects`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Protected | List all workspaces where user is owner or member |
| `POST` | `/api/projects` | Protected | Create a new project workspace |
| `GET` | `/api/projects/:projectId` | Member | Retrieve single workspace details and member list |
| `PUT` | `/api/projects/:projectId` | Owner | Update workspace title, description, or status |
| `DELETE` | `/api/projects/:projectId` | Owner | Delete workspace and associated activity log |
| `POST` | `/api/projects/:projectId/members` | Owner | Add / invite a team member with a specified role |
| `DELETE` | `/api/projects/:projectId/members/:userId` | Member/Owner | Remove team member or leave workspace |

### User Lookup Endpoints (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users?search=<query>` | Protected | Search registered users by name or email for invitations |

### Analytics & Dashboard Endpoints (Module 4)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/:projectId/analytics` | Member | Task completion %, workload distribution, overdue count, velocity |
| `GET` | `/api/projects/:projectId/export/csv` | Member | Export & download project tasks summary CSV report |
| `GET` | `/api/projects/:projectId/dashboard/workload` | Member | MongoDB aggregation of task distribution per member |
| `GET` | `/api/projects/:projectId/dashboard/overdue` | Member | Overdue task list with calculated days overdue |
| `POST` | `/api/tasks/:taskId/remind` | Owner | Dispatch manual reminder email via Resend API |
| `GET` | `/api/projects/:projectId/notifications` | Owner | Notification audit log of dispatched emails |
| `GET` | `/api/dashboard/me` | Protected | Personal cross-project dashboard summary |

### Health Check Endpoint
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Server uptime and connection status |

---

## Local Development & Setup Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **MongoDB Atlas Account:** An active cluster connection URI

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/bansariakhani18/TeamFlow.git
cd TeamFlow
```

---

### Step 2: Backend Setup (`teamflow-server`)

1. Open a terminal and navigate to `teamflow-server`:
   ```bash
   cd teamflow-server
   npm install
   ```

2. Create a `.env` file in the `teamflow-server/` directory:
   ```env
   # Server Port & Environment
   PORT=5000
   NODE_ENV=development

   # MongoDB Atlas Connection
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/teamflow?retryWrites=true&w=majority

   # JWT Secret Key and Expiration
   JWT_SECRET=super_secret_jwt_encryption_key_change_in_production
   JWT_EXPIRES_IN=7d

   # Client Application URL (for CORS)
   CLIENT_URL=http://localhost:5173

   # Optional: Resend API for Email Invitations
   RESEND_API_KEY=re_your_resend_api_key
   EMAIL_FROM=TeamFlow <notifications@yourdomain.com>
   ```

3. Launch the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start at `http://localhost:5000` with hot-reloading enabled via `nodemon`.*

---

### Step 3: Frontend Setup (`teamflow-client`)

1. Open a second terminal and navigate to `teamflow-client`:
   ```bash
   cd teamflow-client
   npm install
   ```

2. Create a `.env` file in the `teamflow-client/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Launch the Vite client:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`.*

---

## Project Directory Structure

```text
teamflow/
├── README.md                      # Comprehensive Project Documentation
├── design.md                      # UI/UX Design System Specification
│
├── teamflow-server/               # Express.js REST API
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas connection with DNS fallback
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, GetMe controllers
│   │   ├── projectController.js   # Project CRUD & Member management
│   │   └── userController.js      # User directory search
│   ├── middleware/
│   │   ├── errorHandler.js        # Global error and 404 handlers
│   │   ├── projectAccess.js       # Project Owner/Member authorization gates
│   │   ├── protect.js             # JWT bearer verification middleware
│   │   ├── requestLogger.js       # Detailed HTTP request logger
│   │   └── validate.js            # Zod request validation middleware
│   ├── models/
│   │   ├── Activity.js            # Real-time workspace audit activity model
│   │   ├── Project.js             # Project schema with members and status
│   │   └── User.js                # User schema with Bcrypt password hashing
│   ├── routes/
│   │   ├── authRoutes.js          # Authentication routing table
│   │   ├── projectRoutes.js       # Workspaces routing table
│   │   └── userRoutes.js          # Users lookup routing table
│   ├── utils/
│   │   ├── asyncHandler.js        # Async error wrapper
│   │   └── validators.js          # Zod schema definitions
│   ├── app.js                     # Express app setup, CORS, static routes
│   ├── server.js                  # Server entry point & DNS initialization
│   └── package.json
│
└── teamflow-client/               # React 19 + Vite SPA
    ├── public/                    # Favicons and static assets
    ├── src/
    │   ├── api/
    │   │   └── client.js          # Axios instance with auth interceptors
    │   ├── components/
    │   │   ├── AuthHeroIllustration.jsx # Clean photography split-hero component
    │   │   ├── BrandLogo.jsx      # 3D Isometric Logo B SVG
    │   │   ├── Logo.jsx           # Unified brand mark export
    │   │   ├── Modal.jsx          # Accessible dialog modal
    │   │   └── Navbar.jsx         # Executive top navigation with profile menu
    │   ├── context/
    │   │   └── AuthContext.jsx    # React Auth Provider & token management
    │   ├── pages/
    │   │   ├── LoginPage.jsx      # Executive split-hero login screen
    │   │   ├── RegisterPage.jsx   # Executive split-hero register screen
    │   │   ├── ProjectsPage.jsx   # Workspace directory & creation dialog
    │   │   └── ProjectDetailsPage.jsx # Project overview, members & activity
    │   ├── App.jsx                # Router configuration & protected routes
    │   ├── index.css              # Tailwind CSS v4 design tokens
    │   └── main.jsx               # React DOM entry point
    ├── vite.config.js
    └── package.json
```

---

## Git Workflow & Branching Conventions

- **Main Branch:** `main` (Production-ready releases)
- **Feature Branches:** `feature/<contributor>-<module-name>`
  - Example: `feature/bansari-projects`
- **Commit Message Convention:** Follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: <description>` — New feature introduction
  - `fix: <description>` — Bug fix
  - `style: <description>` — UI/UX design token adjustments
  - `docs: <description>` — Documentation additions or edits
  - `refactor: <description>` — Code reorganization without functional changes

---

## License

This project is licensed under the [MIT License](LICENSE) — free for educational and collaborative development.