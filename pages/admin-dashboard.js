import { DashboardAPI, LeaveAPI } from '../js/services/api.js';
import { MOCK_EMPLOYEES, MOCK_PROJECTS } from '../js/data.js';
import { formatDate, statusBadge, showLoading } from '../js/utils/helpers.js';
import { Toast } from '../js/utils/toast.js';

export async function renderAdminDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Admin Overview</h1>
        <p class="page-subtitle">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
    <div class="stats-grid" id="admin-stats" style="grid-template-columns:repeat(4,1fr)"></div>
    <div class="content-grid">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Pending Leave Requests</span>
          <span class="badge badge-amber" id="pending-count">—</span>
        </div>
        <div id="pending-leaves-list"></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Active Projects</span></div>
        <div id="active-projects-list"></div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;padding:0">
      <div class="card-header" style="padding:16px 20px">
        <span class="card-title">Recent Employees</span>
      </div>
      <div id="emp-mini-list"></div>
    </div>
  `;

  const stopLoading = showLoading(container);

  try {
    const [statsRes, leavesRes] = await Promise.all([
      DashboardAPI.getAdminStats(),
      LeaveAPI.getAll({ status: 'pending' }),
    ]);
    stopLoading();

    const { totalEmployees, totalProjects, pendingLeaves, activeProjects } = statsRes.data;

    document.querySelector('#admin-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">👥</div>
        <div class="stat-value">${totalEmployees}</div>
        <div class="stat-label">Active Employees</div>
        <div class="stat-sub up">↑ +2 this month</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">◈</div>
        <div class="stat-value">${totalProjects}</div>
        <div class="stat-label">Total Projects</div>
        <div class="stat-sub">${activeProjects} active</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--amber-dim);color:var(--amber)">📅</div>
        <div class="stat-value">${pendingLeaves}</div>
        <div class="stat-label">Pending Approvals</div>
        <div class="stat-sub ${pendingLeaves > 0 ? 'down' : 'up'}">${pendingLeaves > 0 ? '⚠ Needs attention' : '✓ All clear'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">🏢</div>
        <div class="stat-value">4</div>
        <div class="stat-label">Departments</div>
      </div>
    `;

    const pendingList = document.querySelector('#pending-leaves-list');
    document.querySelector('#pending-count').textContent = leavesRes.data.length;
    if (!leavesRes.data.length) {
      pendingList.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-state-icon" style="font-size:24px">✓</div><p>No pending requests</p></div>';
    } else {
      pendingList.innerHTML = leavesRes.data.slice(0, 4).map(l => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${l.employeeName}</div>
            <div style="font-size:11px;color:var(--text-3)">${l.type} · ${l.days} day(s) · ${formatDate(l.startDate)}</div>
          </div>
          <span class="badge badge-amber">Pending</span>
        </div>`).join('');
    }

    const activeProj = MOCK_PROJECTS.filter(p => p.status === 'active');
    document.querySelector('#active-projects-list').innerHTML = activeProj.map(p => `
      <div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;font-weight:600">${p.name}</span>
          <span style="font-size:12px;font-family:var(--font-mono);color:var(--accent)">${p.progress}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%"></div></div>
        <div style="font-size:11px;color:var(--text-3);margin-top:4px">${p.members.length} members · Due ${formatDate(p.endDate)}</div>
      </div>`).join('');

    document.querySelector('#emp-mini-list').innerHTML = `
      <div class="table-wrap" style="border:none">
        <table>
          <thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            ${MOCK_EMPLOYEES.slice(0, 5).map(e => `<tr>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="avatar avatar-sm" style="background:${e.avatarColor}1a;color:${e.avatarColor};font-family:var(--font-head)">${e.avatar}</div>
                  <div>
                    <div style="font-weight:500">${e.name}</div>
                    <div style="font-size:11px;color:var(--text-3)">${e.email}</div>
                  </div>
                </div>
              </td>
              <td style="color:var(--text-3)">${e.dept}</td>
              <td style="color:var(--text-3)">${e.role}</td>
              <td>${statusBadge(e.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

  } catch (e) {
    stopLoading();
    Toast.error('Failed to load dashboard');
  }
}
