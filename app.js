/* ==========================================================================
   TeamDesk — front-end logic (framework-free, vanilla JS)

   This file is written so it is easy to hand off to a Java back end:
   every place that currently reads/writes the in-memory MOCK_EMPLOYEES
   array is marked "INTEGRATION POINT" with the servlet / Spring endpoint
   it should call instead. Swap the body of that one function and the
   rest of the UI keeps working unchanged.
   ========================================================================== */

// ---------------------------------------------------------------------------
// Mock data (stands in for a DB-backed response while the back end is wired up)
// ---------------------------------------------------------------------------
const MOCK_EMPLOYEES = [
  { id: "EMP-1042", name: "Aditi Sharma",  dept: "Engineering", role: "Backend Developer",  status: "active", joined: "2023-02-14" },
  { id: "EMP-1043", name: "Rohan Mehta",   dept: "Engineering", role: "QA Engineer",        status: "active", joined: "2022-11-03" },
  { id: "EMP-1044", name: "Kavya Iyer",    dept: "Design",      role: "Product Designer",   status: "leave",  joined: "2021-07-22" },
  { id: "EMP-1045", name: "Sameer Khan",   dept: "Sales",       role: "Account Executive",  status: "active", joined: "2024-01-09" },
  { id: "EMP-1046", name: "Priya Nair",    dept: "HR",          role: "HR Generalist",      status: "active", joined: "2020-05-18" },
  { id: "EMP-1047", name: "Arjun Verma",   dept: "Engineering", role: "Java Developer",     status: "active", joined: "2023-09-01" },
  { id: "EMP-1048", name: "Neha Kapoor",   dept: "Marketing",   role: "Content Strategist", status: "exited", joined: "2019-03-11" },
  { id: "EMP-1049", name: "Vikram Rao",    dept: "Engineering", role: "DevOps Engineer",    status: "active", joined: "2022-06-27" },
  { id: "EMP-1050", name: "Ishita Gupta",  dept: "Design",      role: "UI Designer",        status: "active", joined: "2023-12-05" },
  { id: "EMP-1051", name: "Manish Yadav",  dept: "Sales",       role: "Sales Manager",      status: "leave",  joined: "2021-10-30" },
];

const STATUS_LABEL = { active: "Active", leave: "On leave", exited: "Exited" };

function initials(name) {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

// ---------------------------------------------------------------------------
// Sidebar / mobile nav
// ---------------------------------------------------------------------------
function initShell() {
  const menuBtn = document.querySelector(".topbar__menu-btn");
  const sidebar = document.querySelector(".sidebar");
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("is-open"));
    document.addEventListener("click", (e) => {
      if (window.innerWidth > 768) return;
      if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("is-open");
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------
function renderDashboard() {
  const grid = document.getElementById("statGrid");
  if (!grid) return; // not on this page

  // INTEGRATION POINT: replace with GET /api/dashboard/summary
  // (Java: DashboardServlet.java, or Spring: DashboardController#getSummary)
  const total = MOCK_EMPLOYEES.length;
  const onLeave = MOCK_EMPLOYEES.filter(e => e.status === "leave").length;
  const openRoles = 6;
  const pendingApprovals = 3;

  grid.innerHTML = `
    <div class="card stat-card">
      <div class="stat-card__label">Total employees</div>
      <div class="stat-card__value">${total}</div>
      <div class="stat-card__delta is-up">+2 this month</div>
    </div>
    <div class="card stat-card">
      <div class="stat-card__label">On leave today</div>
      <div class="stat-card__value">${onLeave}</div>
      <div class="stat-card__delta is-warn">Review coverage</div>
    </div>
    <div class="card stat-card">
      <div class="stat-card__label">Open positions</div>
      <div class="stat-card__value">${openRoles}</div>
      <div class="stat-card__delta">3 in Engineering</div>
    </div>
    <div class="card stat-card">
      <div class="stat-card__label">Pending approvals</div>
      <div class="stat-card__value">${pendingApprovals}</div>
      <div class="stat-card__delta is-warn">Needs your sign-off</div>
    </div>
  `;

  // Department breakdown bars
  const deptCounts = MOCK_EMPLOYEES.reduce((acc, e) => {
    acc[e.dept] = (acc[e.dept] || 0) + 1;
    return acc;
  }, {});
  const maxCount = Math.max(...Object.values(deptCounts));
  const deptWrap = document.getElementById("deptBreakdown");
  if (deptWrap) {
    deptWrap.innerHTML = Object.entries(deptCounts).map(([dept, count]) => `
      <div class="dept-row">
        <div class="dept-row__label">${dept}</div>
        <div class="dept-row__track">
          <div class="dept-row__fill" style="width:${(count / maxCount) * 100}%"></div>
        </div>
        <div class="dept-row__count">${count}</div>
      </div>
    `).join("");
  }

  // Recent activity — INTEGRATION POINT: GET /api/activity/recent
  const activity = [
    { text: "<strong>Arjun Verma</strong> was added to Engineering", time: "2 hours ago" },
    { text: "<strong>Kavya Iyer</strong> requested leave, Sep 15–18", time: "5 hours ago" },
    { text: "<strong>Priya Nair</strong> approved onboarding for 1 new hire", time: "Yesterday" },
    { text: "<strong>Neha Kapoor</strong>'s exit was processed", time: "2 days ago" },
  ];
  const activityWrap = document.getElementById("activityList");
  if (activityWrap) {
    activityWrap.innerHTML = activity.map(a => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div>
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${a.time}</div>
        </div>
      </div>
    `).join("");
  }
}

// ---------------------------------------------------------------------------
// Employees page: search, filter, add, edit, delete
// ---------------------------------------------------------------------------
let employeeState = [...MOCK_EMPLOYEES];
let activeFilters = { search: "", dept: "all" };

function renderEmployeeTable() {
  const tbody = document.getElementById("employeeRows");
  const emptyState = document.getElementById("employeeEmpty");
  if (!tbody) return; // not on this page

  const filtered = employeeState.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(activeFilters.search) ||
                           e.id.toLowerCase().includes(activeFilters.search);
    const matchesDept = activeFilters.dept === "all" || e.dept === activeFilters.dept;
    return matchesSearch && matchesDept;
  });

  document.getElementById("employeeCount").textContent = `${filtered.length} of ${employeeState.length}`;

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  tbody.innerHTML = filtered.map(e => `
    <tr>
      <td>
        <div class="emp-cell">
          <div class="avatar">${initials(e.name)}</div>
          <div>
            <div class="emp-name">${e.name}</div>
            <div class="emp-id">${e.id}</div>
          </div>
        </div>
      </td>
      <td>${e.dept}</td>
      <td>${e.role}</td>
      <td>${new Date(e.joined).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
      <td><span class="badge badge--${e.status === "active" ? "active" : e.status === "leave" ? "leave" : "exit"}">${STATUS_LABEL[e.status]}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Edit" data-edit="${e.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn" title="Remove" data-remove="${e.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function addEmployee(data) {
  // INTEGRATION POINT: POST /api/employees
  // (Java: EmployeeServlet.doPost, or Spring: EmployeeController#create)
  const nextId = `EMP-${1042 + employeeState.length + Math.floor(Math.random() * 90)}`;
  employeeState.unshift({ id: nextId, status: "active", joined: new Date().toISOString().slice(0, 10), ...data });
  renderEmployeeTable();
}

function removeEmployee(id) {
  // INTEGRATION POINT: DELETE /api/employees/{id}
  employeeState = employeeState.filter(e => e.id !== id);
  renderEmployeeTable();
}

function initEmployeesPage() {
  const searchInput = document.getElementById("employeeSearch");
  const deptSelect = document.getElementById("deptFilter");
  const addBtn = document.getElementById("openAddModal");
  const modal = document.getElementById("addModal");
  const closeBtn = document.getElementById("closeAddModal");
  const cancelBtn = document.getElementById("cancelAddModal");
  const form = document.getElementById("addEmployeeForm");
  const tbody = document.getElementById("employeeRows");

  if (!tbody) return; // not on this page

  renderEmployeeTable();

  searchInput.addEventListener("input", (e) => {
    activeFilters.search = e.target.value.trim().toLowerCase();
    renderEmployeeTable();
  });

  deptSelect.addEventListener("change", (e) => {
    activeFilters.dept = e.target.value;
    renderEmployeeTable();
  });

  const openModal = () => modal.classList.add("is-open");
  const closeModal = () => { modal.classList.remove("is-open"); form.reset(); };

  addBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    addEmployee({
      name: fd.get("name"),
      dept: fd.get("dept"),
      role: fd.get("role"),
    });
    closeModal();
  });

  tbody.addEventListener("click", (e) => {
    const removeId = e.target.closest("[data-remove]")?.dataset.remove;
    if (removeId) removeEmployee(removeId);
    // Edit wired to open the same modal pre-filled would be the next increment —
    // left as a clear extension point rather than faked.
  });
}

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------
function initLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  const errorBox = document.getElementById("loginError");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    // INTEGRATION POINT: POST /api/auth/login
    // (Java: LoginServlet.doPost validating against the users table, or
    // Spring Security's UsernamePasswordAuthenticationFilter). On success the
    // servlet would issue a session/JWT and this redirect would follow that.
    if (email && password.length >= 4) {
      errorBox.classList.remove("is-visible");
      window.location.href = "dashboard.html";
    } else {
      errorBox.textContent = "Enter a valid email and a password of at least 4 characters.";
      errorBox.classList.add("is-visible");
    }
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initShell();
  initLoginPage();
  renderDashboard();
  initEmployeesPage();
});
