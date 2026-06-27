// Admin Projects Management
import { ProjectAPI, EmployeeAPI } from '../js/services/api.js';
import { formatDate, statusBadge, paginate, renderPagination, showLoading } from '../js/utils/helpers.js';
import { openModal, closeModal, confirmDialog } from '../js/utils/modal.js';
import { Toast } from '../js/utils/toast.js';

let projects = [];
let employees = [];
let currentPage = 1;
const PER_PAGE = 7;

export async function renderAdminProjects(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Projects</h1>
        <p class="page-subtitle">Manage and track all projects</p>
      </div>
      <button class="btn btn-primary" id="add-proj-btn">+ New Project</button>
    </div>
    <div class="filter-bar">
      <select class="form-control" id="proj-status-filter" style="width:auto">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="on-hold">On Hold</option>
        <option value="completed">Completed</option>
      </select>
    </div>
    <div class="card" style="padding:0">
      <div id="proj-table"></div>
      <div class="pagination" id="proj-pagination"></div>
    </div>
  `;

  const stop = showLoading(container.querySelector('.card'));
  try {
    const [projRes, empRes] = await Promise.all([ProjectAPI.getAll(), EmployeeAPI.getAll()]);
    projects = projRes.data;
    employees = empRes.data;
    stop();
    renderTable();
  } catch (e) {
    stop();
    Toast.error('Failed to load projects');
  }

  container.querySelector('#add-proj-btn').addEventListener('click', () => openProjectModal());
  container.querySelector('#proj-status-filter').addEventListener('change', e => {
    currentPage = 1;
    renderTable(e.target.value);
  });
}

function renderTable(statusFilter = '') {
  let filtered = statusFilter ? projects.filter(p => p.status === statusFilter) : projects;
  const pg = paginate(filtered, currentPage, PER_PAGE);
  const wrap = document.querySelector('#proj-table');

  if (filtered.length === 0) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">◈</div><h3>No projects found</h3></div>';
    document.querySelector('#proj-pagination').innerHTML = '';
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap" style="border:none;border-radius:0">
      <table>
        <thead><tr>
          <th>Project</th><th>Manager</th><th>Progress</th>
          <th>Members</th><th>Deadline</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${pg.items.map(p => {
            const statusColor = { active: 'var(--green)', 'on-hold': 'var(--amber)', completed: 'var(--ink-40)' };
            return `
              <tr>
                <td>
                  <div style="font-weight:500">${p.name}</div>
                  <div style="font-size:11px;color:var(--ink-40);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.description}</div>
                </td>
                <td style="color:var(--ink-60)">${p.manager}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px;min-width:100px">
                    <div class="progress-bar" style="flex:1">
                      <div class="progress-fill" style="width:${p.progress}%;background:${statusColor[p.status]}"></div>
                    </div>
                    <span style="font-size:11px;font-weight:600;color:${statusColor[p.status]};font-family:var(--font-mono)">${p.progress}%</span>
                  </div>
                </td>
                <td><span class="badge badge-blue">${p.members.length}</span></td>
                <td style="font-size:12px;color:var(--ink-40)">${formatDate(p.endDate)}</td>
                <td>${statusBadge(p.status)}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-icon btn-sm edit-proj-btn" data-id="${p.id}" title="Edit">✎</button>
                    <button class="btn btn-ghost btn-icon btn-sm assign-members-btn" data-id="${p.id}" title="Assign Members" style="color:var(--accent)">👥</button>
                    <button class="btn btn-ghost btn-icon btn-sm del-proj-btn" data-id="${p.id}" title="Delete" style="color:var(--red)">✕</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  wrap.querySelectorAll('.edit-proj-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const proj = projects.find(p => p.id === parseInt(btn.dataset.id));
      if (proj) openProjectModal(proj);
    })
  );

  wrap.querySelectorAll('.del-proj-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteProject(parseInt(btn.dataset.id)))
  );

  wrap.querySelectorAll('.assign-members-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const proj = projects.find(p => p.id === parseInt(btn.dataset.id));
      if (proj) openAssignMembersModal(proj);
    })
  );

  renderPagination(document.querySelector('#proj-pagination'), pg, page => {
    currentPage = page;
    renderTable(statusFilter);
  });
}

function openProjectModal(proj = null) {
  const body = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">Project Name *</label>
        <input class="form-control" id="proj-name" value="${proj?.name || ''}" placeholder="e.g. Product Redesign 2024">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-control" id="proj-desc" rows="2" style="resize:vertical">${proj?.description || ''}</textarea>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Manager *</label>
          <select class="form-control" id="proj-manager">
            ${employees.map(e => `<option value="${e.name}" ${proj?.manager === e.name ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="proj-status">
            <option value="active" ${proj?.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="on-hold" ${proj?.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
            <option value="completed" ${proj?.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input class="form-control" id="proj-start" type="date" value="${proj?.startDate || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">End Date</label>
          <input class="form-control" id="proj-end" type="date" value="${proj?.endDate || ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Progress (%)</label>
        <input class="form-control" id="proj-progress" type="number" min="0" max="100" value="${proj?.progress || 0}">
      </div>
    </div>
  `;

  openModal({
    title: proj ? 'Edit Project' : 'New Project',
    body,
    confirmText: proj ? 'Update' : 'Create Project',
    onConfirm: () => saveProject(proj?.id),
  });
}

async function saveProject(id = null) {
  const name = document.querySelector('#proj-name').value.trim();
  const description = document.querySelector('#proj-desc').value.trim();
  const manager = document.querySelector('#proj-manager').value;
  const status = document.querySelector('#proj-status').value;
  const startDate = document.querySelector('#proj-start').value;
  const endDate = document.querySelector('#proj-end').value;
  const progress = parseInt(document.querySelector('#proj-progress').value) || 0;

  if (!name) { Toast.warning('Project name is required'); return; }

  const payload = { name, description, manager, status, startDate, endDate, progress };

  try {
    if (id) {
      const { data } = await ProjectAPI.update(id, payload);
      projects = projects.map(p => p.id === id ? { ...p, ...data } : p);
      Toast.success('Project updated');
    } else {
      const { data } = await ProjectAPI.create(payload);
      projects.unshift(data);
      Toast.success('Project created');
    }
    closeModal();
    renderTable();
  } catch (e) {
    Toast.error('Failed to save project');
  }
}

async function deleteProject(id) {
  const confirmed = await confirmDialog({
    title: 'Delete Project',
    message: 'This will permanently remove the project and all associated data.',
    icon: '🗑',
  });
  if (!confirmed) return;
  try {
    await ProjectAPI.delete(id);
    projects = projects.filter(p => p.id !== id);
    renderTable();
    Toast.success('Project deleted');
  } catch (e) {
    Toast.error('Failed to delete project');
  }
}

function openAssignMembersModal(proj) {
  const body = `
    <div>
      <p style="font-size:13px;color:var(--ink-60);margin-bottom:14px">Select team members for <strong>${proj.name}</strong></p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${employees.filter(e => e.status === 'active').map(e => `
          <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--ink-10);border-radius:var(--r-sm);cursor:pointer">
            <input type="checkbox" value="${e.id}" ${proj.members.includes(e.id) ? 'checked' : ''} style="width:15px;height:15px">
            <div class="avatar avatar-sm" style="background:${e.avatarColor}20;color:${e.avatarColor}">${e.avatar}</div>
            <div>
              <div style="font-size:13px;font-weight:500">${e.name}</div>
              <div style="font-size:11px;color:var(--ink-40)">${e.role}</div>
            </div>
          </label>
        `).join('')}
      </div>
    </div>
  `;

  openModal({
    title: 'Assign Team Members',
    body,
    confirmText: 'Save',
    onConfirm: async () => {
      const checked = [...document.querySelectorAll('#modal-body-content input[type=checkbox]:checked')].map(cb => parseInt(cb.value));
      try {
        await ProjectAPI.update(proj.id, { ...proj, members: checked });
        projects = projects.map(p => p.id === proj.id ? { ...p, members: checked } : p);
        closeModal();
        renderTable();
        Toast.success('Team updated');
      } catch (e) {
        Toast.error('Failed to update team');
      }
    },
  });
}
