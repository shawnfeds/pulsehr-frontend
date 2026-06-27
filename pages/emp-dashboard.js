import { getUser } from '../js/utils/auth.js';
import { DashboardAPI, TimesheetAPI } from '../js/services/api.js';
import { formatDate, showLoading } from '../js/utils/helpers.js';
import { Toast } from '../js/utils/toast.js';

export async function renderEmployeeDashboard(container, navigate) {
  const user = getUser();
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Good ${getGreeting()}, ${user?.name?.split(' ')[0]} 👋</h1>
        <p class="page-subtitle">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
    <div class="stats-grid" id="emp-stats" style="grid-template-columns:repeat(4,1fr)"></div>
    <div class="content-grid">
      <div class="card" id="recent-timesheet">
        <div class="card-header">
          <span class="card-title">Recent Timesheets</span>
          <button class="btn btn-ghost btn-sm" id="go-timesheet">View All →</button>
        </div>
        <div id="timesheet-list"></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Recent Activity</span></div>
        <div class="activity-feed" id="activity-list"></div>
      </div>
    </div>
  `;

  const stopLoading = showLoading(container);

  try {
    const [statsRes, tsRes] = await Promise.all([
      DashboardAPI.getEmployeeStats(user?.id),
      TimesheetAPI.getMyTimesheets(user?.id),
    ]);
    stopLoading();

    const { hoursThisMonth, leavesTaken, activeProjects, attendanceRate } = statsRes.data;

    document.querySelector('#emp-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">⏱</div>
        <div class="stat-value">${hoursThisMonth}h</div>
        <div class="stat-label">Hours This Month</div>
        <div class="stat-sub up">↑ On track</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--amber-dim);color:var(--amber)">📅</div>
        <div class="stat-value">${leavesTaken}</div>
        <div class="stat-label">Leaves Taken</div>
        <div class="stat-sub">10 days remaining</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">◈</div>
        <div class="stat-value">${activeProjects}</div>
        <div class="stat-label">Active Projects</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">✓</div>
        <div class="stat-value">${attendanceRate}%</div>
        <div class="stat-label">Attendance Rate</div>
        <div class="stat-sub up">↑ Excellent</div>
      </div>
    `;

    const timesheets = tsRes.data.slice(0, 5);
    const tsContainer = document.querySelector('#timesheet-list');
    if (!timesheets.length) {
      tsContainer.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-state-icon">⏱</div><h3>No entries yet</h3></div>';
    } else {
      tsContainer.innerHTML = `
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>Date</th><th>Project</th><th>Task</th><th>Hrs</th></tr></thead>
            <tbody>
              ${timesheets.map(t => `<tr>
                <td style="font-size:12px;color:var(--text-3)">${formatDate(t.date)}</td>
                <td><span class="badge badge-blue" style="font-size:10px">${t.project}</span></td>
                <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-2)">${t.task}</td>
                <td><span class="mono" style="color:var(--accent);font-weight:600">${t.hours}h</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    document.querySelector('#activity-list').innerHTML = [
      { color: 'var(--accent)',  text: 'Logged <strong>6 hours</strong> on Nexus Platform v2.0', time: '2 hours ago' },
      { color: 'var(--green)',   text: 'Leave request <strong>approved</strong> for Apr 10–11',  time: 'Yesterday' },
      { color: 'var(--amber)',   text: 'Assigned to <strong>Mobile App Launch</strong> project',  time: '3 days ago' },
      { color: 'var(--purple)',  text: 'Profile updated successfully',                             time: '1 week ago' },
    ].map(a => `
      <div class="activity-item">
        <div class="activity-pip" style="background:${a.color}"></div>
        <div class="activity-body"><p>${a.text}</p><span>${a.time}</span></div>
      </div>`).join('');

  } catch (e) {
    stopLoading();
    Toast.error('Failed to load dashboard data');
  }

  // "View All" navigates to timesheet — dispatch custom event app.js listens to
  document.querySelector('#go-timesheet')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('app:navigate', { detail: 'timesheet' }));
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
