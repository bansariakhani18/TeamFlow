# AGENTS.md – TeamFlow (IT645 Course Project)

> **How to use this file:** You are an AI coding agent building the **TeamFlow** MERN project. Read this entire file before writing any code and re-check it before finishing each task. Where this file and a user prompt conflict, **ask the user** instead of guessing. The full specification is in `TeamFlow_SRS.pdf`; this file is the working summary. Do not invent features outside this file.

---

## 1. Project Summary

**TeamFlow** is a collaborative project and task management platform for small student teams. Users register, create projects, add registered users as members, create/assign tasks with priority and due date, move tasks through a Kanban workflow, comment on tasks, see an automatic activity history, and monitor progress on dashboards. Emails (task assignment, manual reminder) are sent through the third-party **Resend** Web API.

- Course: IT645 Web and Mobile Development, DA-IICT. Evaluated per student through demo + viva.
- Team of 4, each owns one module (see §3). **Every member must do frontend + backend + testing for their own module.**

## 2. Hard Rules (never violate)

1. **MERN only**: MongoDB + Mongoose, Express, React (functional components + hooks), Node.js.
2. **ES6+ everywhere**: `const`/`let` (never `var`), arrow functions, async/await, template literals, destructuring, ES modules (`import`/`export`, `"type": "module"` in both `package.json` files; include `.js` extension in server relative imports).
3. **Naming**: `camelCase` variables/functions/files for non-components; `PascalCase` React components and component filenames (`TaskCard.jsx`); `UPPER_SNAKE_CASE` env vars and constants.
4. **Secrets only in `.env`** (never hardcoded, never committed). `.env` is in `.gitignore`. Always maintain `.env.example` with variable names only.
5. **Resend API key stays on the server.** Never call Resend from React.
6. **Modular backend**: `routes/`, `controllers/`, `models/` (all schemas here), `middleware/`, `services/`, `utils/`. No business logic in route files; no DB queries in route files.
7. **All five HTTP methods must be genuinely used** (GET, POST, PUT, PATCH, DELETE) as listed in §7.
8. Must use `express.json()`, `express.static()` (serving `public/` at `/public`), CORS, a **custom** request logger, JWT auth middleware, custom project-access middleware, custom validation middleware, `notFound` and a central `errorHandler`, chained on routes.
9. **Proper status codes** (§6.3) and one consistent JSON response shape (§6.2).
10. **Frontend**: semantic HTML, Tailwind CSS, responsive (360px / 768px / 1280px), React Router, `useState`, `useEffect`, `useContext` (AuthContext), `useRef` (real use), `axios` for HTTP. **Every** data-loading view handles **loading, success and error** (and empty) states.
11. **Reuse over duplication**: shared middleware, services, hooks and components. No copy-pasted fetch/loading logic – use the `useApi` hook.
12. **Authorisation is enforced on the server.** Hiding a button in the UI is never enough.
13. Do not add libraries or features beyond this file without asking (no Redux, no Socket.io, no file uploads, no cron jobs, no TypeScript).
14. Never put real secrets, tokens or passwords in code, README, Postman exports or screenshots.

## 3. Module Ownership

Generate code **module by module**. When the user says which module/member they are working on, build only that module (plus the shared core it depends on). Each module = React UI + Express API + Mongoose model(s) + Postman tests.

| Module | Owner | Responsibility |
|---|---|---|
| **Shared Core** | All | Auth (register/login/me), JWT middleware, error handling, response helpers, AuthContext, ProtectedRoute, shared UI components, deployment, README |
| **M1 Projects & Workspace** | Bansari Akhani (202512032) | Projects, membership, user search, `checkProjectMember`/`checkProjectOwner` middleware |
| **M2 Tasks & Workflow** | Heer Sachdev (202512117) | Tasks, assignment, priority, due date, status workflow, filtering, Kanban board |
| **M3 Collaboration & Activity** | Ishpreet Kaur (202512104) | Comments, `logActivity` service, activity timelines/feeds |
| **M4 Dashboard & Notifications** | Kriti Patel (202512018) | Summary/workload/overdue aggregation, personal dashboard, Resend email service, reminders, notification log |

**Cross-module contracts (keep stable):**
- M1 exports middleware `checkProjectMember`, `checkProjectOwner` (attach `req.project`).
- M3 exports `logActivity({ project, task, taskTitle, actor, action, details })` – called by M1, M2, M3.
- M4 exports `sendTaskAssignedEmail(task, assignee, triggeredBy)` and `sendTaskReminderEmail(...)` – M2 calls the assignment one.
- If a dependency does not exist yet, create a minimal stub with the same signature and mark it `// TODO(Mx): replace stub` rather than inventing a different API.

## 4. Technology Stack and Setup

| Area | Choice |
|---|---|
| Runtime | Node.js LTS (v18+), uses built-in `fetch` for Resend |
| Server | express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv, zod (validation) |
| Dev server | nodemon |
| Client | React 18+ with **Vite**, react-router-dom, axios, Tailwind CSS (v4 via `@tailwindcss/vite`), Recharts (charts) |
| DB | MongoDB Atlas (local MongoDB acceptable in dev) |
| Email | Resend REST API `POST https://api.resend.com/emails` |
| Deploy | Frontend: Vercel · Backend: Render · DB: MongoDB Atlas |

**Scripts:** server `npm run dev` (nodemon server.js), `npm start` (node server.js). Client `npm run dev`, `npm run build`.

### Environment variables

Server `.env` (and `.env.example` with empty values):
```
PORT=5000
NODE_ENV=development
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
SERVER_PUBLIC_URL=http://localhost:5000
RESEND_API_KEY=
EMAIL_FROM=
```
Client `.env` / `.env.example`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 5. Folder Structure (create exactly this)

```
teamflow/
├── README.md
├── .gitignore                 # node_modules, .env, dist, build
├── server/
│   ├── server.js              # connect DB, start listening
│   ├── app.js                 # express app + middleware chain
│   ├── package.json
│   ├── .env.example
│   ├── config/db.js
│   ├── models/                # User, Project, Task, Comment, Activity, Notification (.js)
│   ├── routes/                # authRoutes, userRoutes, projectRoutes, taskRoutes,
│   │                          # commentRoutes, activityRoutes, dashboardRoutes
│   ├── controllers/           # authController, userController, projectController,
│   │                          # taskController, commentController, activityController,
│   │                          # dashboardController, notificationController
│   ├── middleware/            # protect, projectAccess, validate, requestLogger,
│   │                          # notFound, errorHandler
│   ├── services/              # activityService, emailService
│   ├── utils/                 # ApiError, asyncHandler, pagination, buildTaskQuery, validators (zod schemas)
│   ├── public/                # logo.png, favicon – served by express.static
│   └── tests/postman/         # TeamFlow.postman_collection.json, environment
└── client/
    ├── index.html
    ├── vercel.json            # SPA rewrite to /index.html
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── api/axiosClient.js          # baseURL, Authorization interceptor, 401 handling
        ├── context/AuthContext.jsx, ToastContext.jsx
        ├── hooks/useApi.js, useDebounce.js
        ├── components/        # Navbar, ProtectedRoute, Spinner, ErrorMessage, Modal,
        │                      # ConfirmDialog, Pagination, EmptyState, StatusBadge, PriorityBadge
        ├── pages/             # Login, Register, MyDashboard, Projects, ProjectDetails, Board,
        │                      # TaskDetails, ActivityFeed, ProjectDashboard, NotFound
        └── features/          # projects/, tasks/, collab/, dashboard/ (module-specific components)
```

## 6. Backend Conventions

### 6.1 `app.js` middleware order (exact)
```js
app.use(cors({ origin: [process.env.CLIENT_URL, 'http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(requestLogger);                       // custom
app.use('/public', express.static('public')); // required by guidelines
app.get('/api/health', (req, res) => res.json({ success: true, message: 'OK' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/dashboard', dashboardRoutes);   // GET /api/dashboard/me
app.use(notFound);
app.use(errorHandler);
```
Nested routes (`/api/projects/:projectId/tasks`, `/activity`, `/dashboard/*`, `/notifications`, `/members`) are mounted inside `projectRoutes` by delegating to the relevant controllers.

**Chaining example:** `router.patch('/:taskId/status', protect, loadTaskAndProject, validate(statusSchema), updateTaskStatus);`

### 6.2 Response shape
```json
{ "success": true, "data": {}, "message": "optional", "pagination": { "page": 1, "limit": 10, "total": 37, "pages": 4 } }
{ "success": false, "message": "Validation failed", "errors": [{ "field": "title", "message": "Title must be 3-100 characters" }] }
```
Never return `password`. Never return stack traces when `NODE_ENV=production`.

### 6.3 Status codes
200 ok · 201 created · 400 invalid input / malformed ObjectId / invalid transition / assignee not a member / bad reminder target · 401 missing/invalid/expired token or wrong login · 403 not a member / not owner / not author · 404 missing resource or route · 409 duplicate email / already a member · 500 unexpected · 502 Resend failed during manual reminder.

### 6.4 Utilities and middleware (implement once, reuse everywhere)
- `ApiError(statusCode, message, errors?)` – thrown from controllers/middleware.
- `asyncHandler(fn)` – wraps controllers so rejected promises go to `next`.
- `protect` – reads `Authorization: Bearer <token>`, verifies JWT, loads user (without password) into `req.user`, else 401.
- `checkProjectMember` / `checkProjectOwner` – validate `:projectId` ObjectId (400), load project (404), verify membership (403) / ownership (403), set `req.project`.
- `loadTaskAndProject` – validate `:taskId`, load task (404), load its project, verify membership (403), set `req.task`, `req.project`.
- `validate(zodSchema, source = 'body')` – returns 400 with `errors[]` of `{field, message}`.
- `requestLogger` – custom: logs `METHOD URL STATUS Xms` on response finish.
- `errorHandler` – maps: `ApiError` → its code; Mongoose `ValidationError` → 400; `CastError` → 400; Mongo duplicate key `11000` → 409; `JsonWebTokenError`/`TokenExpiredError` → 401; else 500.
- `paginate` helper: `page` (default 1), `limit` (default 10, max 50) → `{ skip, limit, page }`; responses include `pagination`.
- Sorting: `sort=createdAt` ascending, `sort=-createdAt` descending; **whitelist** allowed fields per endpoint.

### 6.5 Auth
- Register: validate (name 2–60, valid email, password ≥ 8), lowercase email, hash with bcrypt (cost 10), duplicate → 409. Return 201 with user (no password) and, optionally, token.
- Login: find by email with `.select('+password')`, compare, return `{ token, user }`; any failure → 401 `Invalid email or password`.
- Token: `jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })`.

## 7. API Specification (implement exactly; do not rename)

Base `/api`. Auth required on everything except register/login. “Member” = member of that project; “Owner” = project owner.

**Auth (Shared)**
| Method | Endpoint | Access | OK | Errors |
|---|---|---|---|---|
| POST | `/auth/register` | Public | 201 | 400, 409 |
| POST | `/auth/login` | Public | 200 | 400, 401 |
| GET | `/auth/me` | Auth | 200 | 401 |

**M1 Projects & Members**
| Method | Endpoint | Access | Notes | Errors |
|---|---|---|---|---|
| POST | `/projects` | Auth | create; caller = owner + first member | 400 |
| GET | `/projects?search&sort&page&limit` | Auth | only my projects | 400 |
| GET | `/projects/:projectId` | Member | populated members | 400,403,404 |
| PUT | `/projects/:projectId` | Owner | replace name, description, startDate, endDate | 400,403,404 |
| DELETE | `/projects/:projectId` | Owner | cascade tasks, comments, activities, notifications | 403,404 |
| POST | `/projects/:projectId/members` | Owner | body `{ email }`; 404 unregistered, 409 already member | 400,403,404,409 |
| DELETE | `/projects/:projectId/members/:userId` | Owner or self | cannot remove owner (400); unassign removed user's tasks; log MEMBER_REMOVED | 400,403,404 |
| GET | `/users?search=` | Auth | min 2 chars, max 10, returns `_id,name,email` only | 400 |

**M2 Tasks**
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| POST | `/projects/:projectId/tasks` | Member | create (status = To Do); optional assignee must be member; triggers assignment email if assignee set |
| GET | `/projects/:projectId/tasks?status&priority&assignee&dueFrom&dueTo&overdue&search&sort&page&limit` | Member | `assignee=me` allowed; `overdue=true` = dueDate < now and status ≠ Done; sort whitelist: dueDate, priority, createdAt |
| GET | `/tasks/:taskId` | Member | populated assignee/createdBy |
| PUT | `/tasks/:taskId` | Member | replace title, description, priority, dueDate (all required in body except description/dueDate may be empty) |
| PATCH | `/tasks/:taskId/status` | Member | body `{ status }`, transition rules below |
| PATCH | `/tasks/:taskId/assignee` | Member | body `{ assignee: userId | null }`; new assignee ≠ old → assignment email |
| DELETE | `/tasks/:taskId` | Owner or creator | delete its comments; keep activities (taskTitle snapshot) |

**Status transitions (only these):** `To Do → In Progress`, `In Progress → Done`, `In Progress → To Do`, `Done → In Progress`. Anything else, same status, or unknown value → **400** with a clear message. Priority priority-sort order: High > Medium > Low (use a numeric rank when sorting).

**M3 Collaboration**
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| POST | `/tasks/:taskId/comments` | Member | text trimmed 1–1000; logs COMMENT_ADDED |
| GET | `/tasks/:taskId/comments?order=asc|desc&page&limit` | Member | default oldest first |
| PUT | `/comments/:commentId` | Author | sets `editedAt` |
| DELETE | `/comments/:commentId` | Author or Owner | logs COMMENT_DELETED |
| GET | `/tasks/:taskId/activity?action&page&limit` | Member | newest first |
| GET | `/projects/:projectId/activity?action&page&limit` | Member | newest first |

No update/delete endpoints for activity (immutable).

**M4 Dashboard & Notifications**
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/projects/:projectId/dashboard/summary?dueSoonDays&dateFrom&dateTo` | Member | total, byStatus, byPriority, completed, overdue, dueSoon (default 3 days), completionRate % (0 if no tasks) |
| GET | `/projects/:projectId/dashboard/workload?dateFrom&dateTo` | Member | per member: assigned, toDo, inProgress, done, overdue + “Unassigned” bucket; **MongoDB aggregation** (`$match`, `$group`, `$lookup`) |
| GET | `/projects/:projectId/dashboard/overdue` | Member | sorted by dueDate asc, with `daysOverdue` |
| GET | `/dashboard/me` | Auth | across my projects: assigned to me, overdue, due within 7 days |
| POST | `/tasks/:taskId/remind` | Owner | requires assignee and status ≠ Done else 400; Resend failure → 502; logs Notification |
| GET | `/projects/:projectId/notifications?page&limit` | Owner | notification log |

Invalid `dateFrom`/`dateTo` or `dateFrom > dateTo` → 400.

## 8. Data Models (`server/models/`, all with `timestamps: true`)

```
User         name(String,req,2-60) email(String,req,unique,lowercase) password(String,req,select:false)
Project      name(req,3-80) description(max500) owner(ObjectId User,req)
             members[{ user:ObjectId User, joinedAt:Date }] startDate endDate  (endDate >= startDate validator)
             indexes: members.user, owner
Task         project(ObjectId,req) title(req,3-100) description(max1000)
             status(enum 'To Do'|'In Progress'|'Done', default 'To Do')
             priority(enum 'Low'|'Medium'|'High', default 'Medium')
             dueDate(Date) assignee(ObjectId User|null) createdBy(ObjectId User,req)
             indexes: {project,status} {project,assignee} {project,dueDate}
Comment      task(req) project(req) author(req) text(req,trim,1-1000) editedAt(Date)   index {task,createdAt}
Activity     project(req) task(ObjectId|null) taskTitle(String) actor(req)
             action(enum TASK_CREATED|TASK_UPDATED|TASK_ASSIGNED|STATUS_CHANGED|TASK_DELETED|
                         COMMENT_ADDED|COMMENT_DELETED|MEMBER_ADDED|MEMBER_REMOVED)
             details(Object: { field, from, to })   indexes {project,createdAt:-1} {task,createdAt:-1}
Notification project(req) task(req) recipient(req) triggeredBy(req)
             type('TASK_ASSIGNED'|'TASK_REMINDER') status('sent'|'failed')
             providerMessageId(String) error(String)
```
Cascade rules: delete project → delete its tasks, comments, activities, notifications. Delete task → delete its comments only.

## 9. Email Service (M4, `services/emailService.js`)

- Use `fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: \`Bearer ${RESEND_API_KEY}\`, 'Content-Type': 'application/json' }, body })` with `{ from: EMAIL_FROM, to: [email], subject, html }`.
- HTML email: task title, project name, priority, due date, a link `${CLIENT_URL}/projects/:projectId/tasks/:taskId`, logo `${SERVER_PUBLIC_URL}/public/logo.png`.
- **Always** write a `Notification` record (`sent` + `providerMessageId`, or `failed` + `error`).
- Assignment email failure **must not fail** the task request: catch, record `failed`, and include `notification: { status }` in the response.
- Manual reminder failure → throw `ApiError(502, 'Email service failed')`.
- Note: Resend's test sender (`onboarding@resend.dev`) may only deliver to the account owner’s address until a domain is verified. Do not hardcode recipients.

## 10. Frontend Conventions

### 10.1 Routes (React Router v6+)
| Path | Page | Access |
|---|---|---|
| `/login`, `/register` | Login, Register | Public |
| `/` | redirect → `/projects` (or `/login`) | – |
| `/dashboard` | MyDashboard | Auth |
| `/projects` | Projects | Auth |
| `/projects/:projectId` | ProjectDetails | Member |
| `/projects/:projectId/board` | Board (Kanban) | Member |
| `/projects/:projectId/tasks/:taskId` | TaskDetails (comments + activity) | Member |
| `/projects/:projectId/activity` | ActivityFeed | Member |
| `/projects/:projectId/dashboard` | ProjectDashboard | Member |
| `*` | NotFound | Public |

All private routes are wrapped by `ProtectedRoute` (redirect to `/login` when no token).

### 10.2 Required hook usage
- `useState`: forms, filters, modal state, pagination.
- `useEffect`: fetch on mount / when filters change; restore session in AuthContext.
- `useContext`: `AuthContext` (`user`, `token`, `login`, `logout`), `ToastContext`.
- `useRef`: autofocus task title input in the modal and the comment textarea.
- Custom hooks: `useApi` (returns `{ data, loading, error, execute }`), `useDebounce` (search inputs).

### 10.3 State handling rules
- Show `<Spinner />` while loading, `<ErrorMessage message onRetry />` on error, `<EmptyState />` when empty.
- Disable submit buttons while a request is pending; show toast on success/failure; show field errors from `errors[]` under inputs.
- Confirm destructive actions with `<ConfirmDialog />`.
- Token stored in `localStorage` (key `teamflow_token`); axios interceptor adds the Bearer header; on 401 clear auth and redirect to `/login`.

### 10.4 UI / styling rules
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<form>`, `<label htmlFor>`, `<footer>`.
- Tailwind utilities only (no inline styles, no extra CSS frameworks). Mobile-first: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`; Kanban columns stack on mobile.
- Status badge colours: To Do = gray, In Progress = blue, Done = green. Priority: Low = slate, Medium = amber, High = red.
- Accessible: labelled inputs, focus rings, button elements for actions, `aria-live` for toasts, adequate contrast.
- Kanban moves must call `PATCH /tasks/:taskId/status`; show the server’s message when a transition is rejected (400).

## 11. Business Rules Checklist

- Roles are **per project only**: Owner and Member. No global admin.
- Owner: edit/delete project, add/remove members, delete any task/comment, send reminders, view notification log. Members: create/edit tasks, change status/assignee, comment, view activity and dashboards, leave the project, delete own comments, delete tasks they created.
- Owner cannot be removed or leave; the owner’s project must be deleted instead.
- Assignee must be a project member. Removing a member unassigns their tasks.
- Overdue = `dueDate < now` **and** `status !== 'Done'`. Past due dates are allowed when creating/editing.
- Every task create/update/assign/status/delete, comment add/delete, and member add/remove writes an Activity record via `logActivity`.
- 403 (not a member) vs 404 (does not exist) vs 400 (bad id) must be distinguished.

## 12. Testing (Postman) – required deliverable

- One collection, one folder per module (Auth, M1, M2, M3, M4). Variables `{{baseUrl}}`, `{{token}}`, `{{projectId}}`, `{{taskId}}`; store tokens from login via a test script. Keep two test users (A = owner, B = member) and a third non-member user C.
- Each request has `pm.test` assertions for status code and body shape.
- Cover **successful and unsuccessful** cases: no token, invalid/expired token, invalid input, malformed/unknown ids, non-member (403), non-owner/non-author (403), duplicates (409), invalid status transition (400), assigning a non-member (400), reminder on Done/unassigned task (400), Resend failure (502 with a bad key).
- Export the collection and environment to `server/tests/postman/` (environment with **no real secrets**).
- Provide a seed script `server/utils/seed.js` (optional but recommended) to create users, a project and tasks with known counts (including overdue ones) so dashboard numbers can be verified.

## 13. Deployment and Documentation

- **Vercel (client):** set `VITE_API_BASE_URL`; `vercel.json` rewrites all paths to `/index.html`.
- **Render (server):** build `npm install`, start `npm start`; set every server env var in the dashboard; `CLIENT_URL` = Vercel URL.
- **MongoDB Atlas:** database user + network access allowing Render; URI only in `MONGO_URI`.
- Free-tier cold starts: note in README that the first request may be slow.
- **README.md must contain:** project description and features; installation and run instructions (server + client); project structure; API endpoint table; environment-variable requirements; deployed URL; Postman instructions; team members and module ownership.

## 14. Workflow for the Agent

When asked to build something, follow this order and state which step you are on:

1. **Shared core** (once): repo skeleton, `.gitignore`, server `app.js`/`server.js`/`db.js`, `ApiError`, `asyncHandler`, `requestLogger`, `notFound`, `errorHandler`, `validate`, `protect`, User model, auth routes; client Vite + Tailwind, router, `axiosClient`, `AuthContext`, `ToastContext`, `useApi`, shared components, Login/Register pages.
2. **M1** → models and middleware first (`Project`, `checkProjectMember/Owner`), then controllers/routes, then pages.
3. **M3 `logActivity` service** (early, small) so M1/M2 can call it.
4. **M2** → `Task` model, controllers/routes, Kanban UI, filters.
5. **M3 rest** → comments, activity endpoints, UI.
6. **M4** → aggregation endpoints, email service, reminder, dashboard UI.
7. **Testing + docs** → Postman collection, seed script, README, `.env.example`.

For each module, output in this order: model → middleware → controller → route → frontend page/components → Postman requests. After each module, run the **Definition of Done** checklist below and report any unmet item.

### Code style for generated code
- Short, readable functions; controllers thin; shared logic in `services/` and `utils/`.
- Comment only non-obvious logic (JSDoc one-liners on services are fine). Each module’s files should be easy for its owner to explain in a viva.
- Use `try/catch` only where you handle the error; otherwise rely on `asyncHandler`.
- Validate **all** inputs with zod schemas in `utils/validators/`; never trust `req.body` shape.
- Use `.lean()` for read-only queries, `populate` only needed fields (`name email`).
- Avoid N+1 queries; use aggregation for dashboards.
- Whitelist updatable fields; never spread `req.body` directly into a model update.

## 15. Definition of Done (check before finishing any task)

**Backend**
- [ ] Route → controller → model separation respected; schemas only in `/models`
- [ ] Auth + membership/ownership checks present; correct 401/403/404/400
- [ ] Input validated; consistent response envelope; central error handling used
- [ ] Query params implemented as specified (filter/search/sort/pagination) with whitelisting
- [ ] Activity logging called where required
- [ ] No secrets in code; `.env.example` updated

**Frontend**
- [ ] Functional components, PascalCase names, reusable components used
- [ ] Loading / success / error / empty states all handled
- [ ] Responsive at 360 / 768 / 1280 px; semantic HTML; Tailwind only
- [ ] Hooks used correctly (`useEffect` deps correct, `useRef`/`useContext` where specified)
- [ ] Forms show server validation errors; destructive actions confirmed

**Testing & docs**
- [ ] Postman requests added for success and failure cases of the new endpoints
- [ ] README API table and structure updated

## 16. Things to Ask the User About (do not guess)

- Which module/member the current task belongs to, if unclear.
- Any change to the business rules in §11 or the decisions marked as defaults (Vite, 1-day JWT in localStorage, strict status transitions, Recharts, past due dates allowed).
- The deployed URLs, the verified Resend sender domain, and the exact professor/course details for README or report text.
- Anything in the SRS that conflicts with this file.
