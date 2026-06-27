import { getUser } from '../js/utils/auth.js';
// Employee Projects Page
import { ProjectAPI } from '../js/services/api.js';
import { MOCK_EMPLOYEES } from '../js/data.js';
import { formatDate, statusBadge, showLoading } from '../js/utils/helpers.js';
import { Toast } from '../js/utils/toast.js';

export async function renderProjects(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">My Projects</h1>
        <p class="page-subtitle">Projects you are currently assigned to</p>
      </div>
    </div>
    <div id="projects-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px"></div>
  `;

  const stopLoading = showLoading(container);
  try {
    const { data } = await ProjectAPI.getAll();
    stopLoading();

    const myProjects = data.filter(p => getUser().projects.includes(p.id));

    if (myProjects.length === 0) {
      document.querySelector('#projects-grid').innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">◈</div>
          <h3>No projects assigned</h3>
          <p>You are not assigned to any projects yet</p>
        </div>
      `;
      return;
    }

    document.querySelector('#projects-grid').innerHTML = myProjects.map(p => {
      const members = MOCK_EMPLOYEES.filter(e => p.members.includes(e.id));
      const statusColors = { active: 'var(--green)', 'on-hold': 'var(--amber)', completed: 'var(--ink-40)' };
      return `
        <div class="card" style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between">
            <div>
              <div style="font-size:16px;font-weight:700;margin-bottom:4px">${p.name}</div>
              <div style="font-size:12px;color:var(--ink-40)">${p.description}</div>
            </div>
            ${statusBadge(p.status)}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div>
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink-40);font-weight:600;margin-bottom:3px">Manager</div>
              <div style="font-size:13px;font-weight:500">${p.manager}</div>
            </div>
            <div>
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink-40);font-weight:600;margin-bottom:3px">Deadline</div>
              <div style="font-size:13px;font-weight:500">${formatDate(p.endDate)}</div>
            </div>
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:12px;color:var(--ink-40)">Progress</span>
              <span style="font-size:12px;font-weight:600;color:${statusColors[p.status]}">${p.progress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${p.progress}%;background:${statusColors[p.status]}"></div>
            </div>
          </div>

          <div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink-40);font-weight:600;margin-bottom:8px">Team (${members.length})</div>
            <div style="display:flex;gap:-6px">
              ${members.slice(0, 5).map(m => `
                <div class="avatar avatar-sm" style="background:${m.avatarColor}20;color:${m.avatarColor};border:2px solid var(--canvas);margin-right:-6px" title="${m.name}">${m.avatar}</div>
              `).join('')}
              ${members.length > 5 ? `<div class="avatar avatar-sm" style="background:var(--ink-05);color:var(--ink-40);border:2px solid var(--canvas)">+${members.length - 5}</div>` : ''}
            </div>
          </div>

          <div style="display:flex;gap:8px;padding-top:4px;border-top:1px solid var(--ink-05)">
            <div style="font-size:11px;color:var(--ink-40)">Start: ${formatDate(p.startDate)}</div>
            <div style="font-size:11px;color:var(--ink-40);margin-left:auto">End: ${formatDate(p.endDate)}</div>
          </div>
        </div>
      `;
    }).join('');

  } catch (e) {
    stopLoading();
    Toast.error('Failed to load projects');
  }
}
