# TeamDesk — Employee Management (Front-End)

A responsive, framework-free front-end for a Java-based employee management
web app: login screen, dashboard, and an employee directory with search,
filtering, and add/remove. Built to sit in front of a Java Servlet or Spring
Boot back end — see **Backend integration points** below.

## Tech stack
- HTML5, semantic markup
- CSS3 (custom properties / design tokens, no framework)
- Vanilla JavaScript (no build step, no dependencies)
- Fully responsive: sidebar collapses to a slide-out drawer under 768px

## Pages
| File | Purpose |
|---|---|
| `index.html` | Login screen |
| `dashboard.html` | Overview: headline stats, department breakdown, recent activity |
| `employees.html` | Employee directory: search, department filter, add/remove, pagination shell |

## Project structure
```
teamdesk/
├── index.html
├── dashboard.html
├── employees.html
├── css/
│   └── style.css        # design tokens + all component styles
├── js/
│   └── app.js            # mock data + UI logic, integration points marked
└── README.md
```

## Running it
No build step needed — open `index.html` directly, or serve the folder with
any static server (e.g. VS Code Live Server) so relative paths resolve
cleanly.

## Backend integration points
`js/app.js` currently reads from an in-memory `MOCK_EMPLOYEES` array so the
UI is fully demoable with no server. Each place that touches that array is
commented `INTEGRATION POINT` with the endpoint it's meant to call once the
Java side is ready:

| Action | Suggested endpoint | Java side |
|---|---|---|
| Load employee list | `GET /api/employees` | `EmployeeServlet.doGet` / `EmployeeController#list` |
| Add employee | `POST /api/employees` | `EmployeeServlet.doPost` / `EmployeeController#create` |
| Remove employee | `DELETE /api/employees/{id}` | `EmployeeController#delete` |
| Dashboard stats | `GET /api/dashboard/summary` | `DashboardServlet` / `DashboardController` |
| Recent activity | `GET /api/activity/recent` | `ActivityServlet` / `ActivityController` |
| Login | `POST /api/auth/login` | `LoginServlet.doPost` / Spring Security filter |

Swapping the mock array for a `fetch()` call at each of these points is the
only change needed to wire this UI to a real Java back end — the render
functions themselves don't need to change.

## Notes
- Status badges (Active / On leave / Exited) map to a `status` field on each
  employee record — ready to bind to whatever enum the back end uses.
- The "Edit" action in the table is scaffolded (icon + click target) but not
  wired up yet, left as a clear next increment rather than faked.
