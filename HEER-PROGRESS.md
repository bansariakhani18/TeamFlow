# TeamFlow – Module 2: Tasks & Kanban Workflow (Heer Sachdev – 202512117)

## 0. Git & Branch Setup
- [x] Switched to `feature/heer-tasks` branch
- [x] Configured Git user: `heer117` (`202512117@dau.ac.in`)
- [x] Created `HEER-PROGRESS.md` for Module 2 tracking
- [x] Maintained `teamflow-server/.env` and `teamflow-client/.env`

## 1. Active Task List & Implementation

### Backend (`teamflow-server/`)
- [x] **`models/Task.js`**:
  - `title`: String, required, 3–100 chars, trimmed.
  - `description`: String, up to 1000 chars, trimmed.
  - `status`: String enum supporting 4 workflow states (`todo`, `in_progress`, `review`, `done`) and title-case variants.
  - `priority`: String enum (`low`, `medium`, `high`, `urgent`).
  - `dueDate`: Date.
  - `assignedTo` & `assignee`: ObjectId ref User (bidirectionally synchronized via pre-save hook).
  - `project`: ObjectId ref Project (required).
  - `createdBy`: ObjectId ref User.
  - `order`: Number.
  - Compound indexes on `{ project: 1, status: 1 }`, `{ project: 1, assignedTo: 1 }`, `{ project: 1, assignee: 1 }`, `{ project: 1, dueDate: 1 }`, `{ project: 1, order: 1 }`.
- [x] **`controllers/taskController.js`**:
  - `createTask` – POST `/api/projects/:projectId/tasks` (201); validates assignee membership in project; logs `TASK_CREATED` and `TASK_ASSIGNED`.
  - `getProjectTasks` – GET `/api/projects/:projectId/tasks` (200); filters by status, priority, assignee (including 'me' shortcut), date range (`dueFrom`, `dueTo`), `overdue=true`, search, sorting whitelist, and pagination.
  - `getTaskById` – GET `/api/tasks/:id` (200); populates assignee, creator, and project.
  - `updateTask` – PUT `/api/tasks/:id` (200); updates editable fields (title, description, priority, dueDate, assignee), verifies membership, logs `TASK_UPDATED`.
  - `updateTaskStatus` – PATCH `/api/tasks/:id/status` (200); enforces strict status column transitions (`To Do` → `In Progress` → `In Review` → `Done`, with reopen), rejects same-status transition with 400, logs `STATUS_CHANGED`.
  - `updateTaskAssignee` – PATCH `/api/tasks/:id/assignee` (200); assigns or unassigns member, validates membership, logs `TASK_ASSIGNED`.
  - `deleteTask` – DELETE `/api/tasks/:id` (200); restricted to project Owner or task creator (403 otherwise), logs `TASK_DELETED`.
- [x] **`routes/taskRoutes.js`**:
  - Standalone task routes protected with `protect` middleware.
  - Routes: `GET /api/tasks/:id`, `PUT /api/tasks/:id`, `PATCH /api/tasks/:id/status`, `PATCH /api/tasks/:id/assignee`, `DELETE /api/tasks/:id`.
- [x] **`routes/projectRoutes.js`**:
  - Nested routes: `POST /api/projects/:projectId/tasks`, `GET /api/projects/:projectId/tasks`.
- [x] **`middleware/`**:
  - `protect.js`: verifies JWT Bearer token, populates `req.user`.
  - `projectAccess.js`: `checkProjectMember`, `checkProjectOwner`.
  - `taskAccess.js`: `loadTaskAndProject`.
  - `errorHandler.js`: central error handler returning unified JSON `{ success: false, message, errors }`.
- [x] **`services/activityService.js`**:
  - Reusable `logActivity` service recording actions to Activity model.

### Frontend (`teamflow-client/`)
- [x] **Design Tokens & Aesthetic Compliance**:
  - Warm sand canvas: `#F4F3EF` (`bg-[#F4F3EF]`).
  - Pure white card surfaces: `bg-white border border-stone-200/80 rounded-2xl shadow-sm hover:shadow-md`.
  - Pastel Sage action buttons: `#4E8765` (`hover:bg-[#3B6B50] text-white`).
  - Priority pills: Urgent/High: Soft Coral `#FFE5D9` (`text-[#D97767]`), Medium: Butter Yellow `#FFF3C4` (`text-[#B48209]`), Low: Sky Blue `#E0F2FE` (`text-[#0284C7]`).
- [x] **`src/components/kanban/TaskCard.jsx`**:
  - Displays title, priority pill, due date badge (overdue highlight in red), assigned avatar bubble.
  - Hover status quick-move buttons with permitted transitions.
  - Click opens `TaskDetailModal`.
- [x] **`src/components/kanban/KanbanColumn.jsx`**:
  - 4 Kanban columns: "To Do", "In Progress", "In Review", "Done".
  - Column header with status indicator, task count badge, and "+ Add Task" button.
  - Empty column state.
- [x] **`src/components/kanban/CreateTaskModal.jsx`**:
  - Modal with `useRef` autofocus on title input.
  - Field validations for title (3-100 chars), description (max 1000), priority, status, due date, assignee.
  - Pastel Sage CTA button with loading state.
- [x] **`src/components/kanban/TaskDetailModal.jsx`**:
  - View full task information, inline editing mode, status workflow buttons, and delete with `ConfirmDialog`.
- [x] **`src/pages/KanbanBoardPage.jsx`**:
  - Main Kanban Board page with 4 columns layout.
  - Filter bar: search by title, filter by priority, filter by assignee ("Assigned to Me", "Unassigned"), and "Overdue Only" toggle.
  - Fully handles all states: Loading (`<Spinner />`), Error (`<ErrorMessage />`), and Empty states.
- [x] **Routing (`App.jsx`)**:
  - Route `/board` & `/projects/:projectId/board` configured with `AuthProvider`.

### Testing & Postman
- [x] **`teamflow-server/tests/postman/TeamFlow_Module2_Tasks.postman_collection.json`**:
  - Create task (201)
  - Validation error handling (400)
  - Filtered task listing (200)
  - Get task by ID (200)
  - PUT update task (200)
  - PATCH status transitions (200)
  - PATCH same-status rejection (400)
  - PATCH assignee (200)
  - DELETE task (200)
- [x] **`teamflow-server/tests/postman/TeamFlow_Local.postman_environment.json`**:
  - Variables: `baseUrl`, `token`, `projectId`, `taskId`.

## 2. Verification
- [x] Server modules syntax & import check: **PASSED (100%)**
- [x] Client build verification (`npm run build` in `teamflow-client`): **PASSED (0 errors, built in 373ms)**
- [x] Responsive layout tested for mobile, tablet, and desktop viewports.

## 3. Status
- Module 2: Tasks & Kanban Workflow Management is **COMPLETE**.
