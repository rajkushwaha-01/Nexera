# Web-Based Integrated Project-Monitoring Platform (Backend API)

Production-grade Node.js + Express + MongoDB REST API combining **Project Monitoring**, **Task Management**, **Team Collaboration**, **Project Timeline Updates**, **Centralized Dashboard Analytics**, and an **Intelligent Student Study Planner with Prioritization Engine**.

---

## Architecture & Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Stateless JSON Web Tokens (JWT) + bcryptjs password hashing (salt 10)
- **Security**: Helmet HTTP protection headers, express-rate-limit brute force defense, strict CORS
- **Robustness**: Centralized error middleware, operational error classes, automated zero-config in-memory MongoDB fallback for testing & demo environments

---

## Getting Started

### 1. Prerequisites
- Node.js installed (v18 or higher)
- (Optional) Local MongoDB or MongoDB Atlas instance. If MongoDB is not running locally, the server automatically starts an in-memory MongoDB instance for development & testing.

### 2. Installation
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the `server` directory (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/project_monitor
JWT_SECRET=supersecret_jwt_hackathon_key_2026_x98z
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port for Express server | `5000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/project_monitor` |
| `JWT_SECRET` | Secret key used for signing JWTs | Required |
| `JWT_EXPIRE` | Token validity duration | `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |

### 4. Running the Server

#### Development Mode (with hot-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

Once running:
- **API Base**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`
- **Interactive API Docs**: `http://localhost:5000/api/docs`

---

## API Overview & Endpoints

All protected endpoints require the HTTP header:
`Authorization: Bearer <your_jwt_token>`

### 1. Authentication (`/api/auth`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account (`admin`, `member`, `student`) |
| `POST` | `/api/auth/login` | Public | Login with email/password & get JWT |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated user profile |
| `PUT` | `/api/auth/me` | Private | Update user profile & weekly study schedule |
| `PUT` | `/api/auth/change-password` | Private | Rotate user password securely |

### 2. Project Management (`/api/projects`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/projects` | Private | Create new project |
| `GET` | `/api/projects` | Private | List projects (supports `status`, `priority`, `member`, `deadline`, `search`, `page`, `limit`) |
| `GET` | `/api/projects/:id` | Private | Detailed view with owner, members, and task list |
| `PUT` | `/api/projects/:id` | Private (Owner/Admin) | Update project attributes |
| `DELETE` | `/api/projects/:id` | Private (Owner/Admin) | Cascade delete project, its tasks, and updates |

### 3. Task Management (`/api/projects/:projectId/tasks` & `/api/tasks`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/projects/:projectId/tasks` | Private | Add task (auto-syncs project progress %) |
| `GET` | `/api/projects/:projectId/tasks` | Private | List project tasks (`status`, `priority`, `assignedTo`) |
| `GET` | `/api/tasks/:id` | Private | Get single task details |
| `PUT` | `/api/tasks/:id` | Private | Update task status, effort, progress |
| `DELETE` | `/api/tasks/:id` | Private | Delete task and recalculate project progress |

### 4. Team & Workload Management (`/api/projects/:id/members` & `/api/team`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/projects/:projectId/members` | Private (Owner/Admin) | Add member by `userId` or `email` |
| `DELETE` | `/api/projects/:projectId/members/:userId` | Private (Owner/Admin) | Remove member and unassign active tasks |
| `GET` | `/api/projects/:projectId/members` | Private | Project members with individual effort workload |
| `GET` | `/api/team/members` | Private | Workspace-wide team directory with aggregated workload |

### 5. Project Status Updates & Activity Timeline (`/api/projects/:id/updates`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/projects/:projectId/updates` | Private | Post timeline update (optionally syncs project status) |
| `GET` | `/api/projects/:projectId/updates` | Private | Retrieve chronological update feed |

### 6. Centralized Dashboard Analytics (`/api/dashboard`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Private | Aggregated project metrics, task status breakdown, overdue items, upcoming deadlines, and recent activity feed |

### 7. Student Planner & Prioritization Engine (`/api/planner`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/planner/assignments` | Private | Create assignment |
| `GET` | `/api/planner/assignments` | Private | List assignments with filters |
| `GET` | `/api/planner/assignments/:id` | Private | Get assignment details |
| `PUT` | `/api/planner/assignments/:id` | Private | Update assignment |
| `DELETE` | `/api/planner/assignments/:id` | Private | Delete assignment |
| `POST` | `/api/planner/exams` | Private | Create exam |
| `GET` | `/api/planner/exams` | Private | List exams |
| `GET` | `/api/planner/exams/:id` | Private | Get exam details |
| `PUT` | `/api/planner/exams/:id` | Private | Update exam |
| `DELETE` | `/api/planner/exams/:id` | Private | Delete exam |
| `GET` | `/api/planner/availability` | Private | Get student daily available study hours |
| `PUT` | `/api/planner/availability` | Private | Update student daily study hours |
| `GET` | `/api/planner/priorities` | Private | Multi-factor ranked work items with urgency categories |
| `GET` | `/api/planner/recommendation` | Private | Smart "What to work on next?" with explainable rationale |
| `GET` | `/api/planner/schedule` | Private | 7-Day study schedule strictly enforcing non-overbooking |

---

## Intelligent Prioritization Formula

The prioritization engine normalizes every work item (assignment or exam) into an explainable **0–100** score:

$$\text{Priority Score} = \text{Deadline Proximity (0–45)} + \text{Importance (0–20)} + \text{Difficulty (0–15)} + \text{Study Time Deficit (0–20)} + \text{Exam Urgency (0–5)}$$

- **90–100 (Critical)**: Overdue items, items due in <24h, or exams occurring tomorrow.
- **70–89 (High)**: Items due this week or large projects facing study time crunches.
- **40–69 (Medium)**: Steady progression items with sufficient preparation runway.
- **0–39 (Low)**: Long-term assignments with distant deadlines.

---

## Testing & Verification

Run individual suites or the complete automated verification:

```bash
# Run complete test suite (all phases)
npm test

# Run individual test suites
npm run test:auth       # Phase 1: Auth & Health (29 tests)
npm run test:projects   # Phase 2: Projects & Tasks (38 tests)
npm run test:phase3     # Phase 3: Team, Updates & Dashboard (41 tests)
npm run test:phase4     # Phase 4: Student Planner & Prioritization (44 tests)
npm run test:phase5     # Phase 5: Hardening & Security (17 tests)
```

**Test Coverage Status**: 169 automated test cases passing with 100% success rate.
