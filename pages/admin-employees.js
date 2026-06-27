// Admin Employee Management
import { EmployeeAPI, ProjectAPI } from '../js/services/api.js';
import { formatDate, statusBadge, paginate, renderPagination, debounce, showLoading } from '../js/utils/helpers.js';
import { openModal, closeModal, confirmDialog } from '../js/utils/modal.js';
import { Toast } from '../js/utils/toast.js';

let employees = [];
let projects = [];
let currentPage = 1;
const PER_PAGE = 8;
let searchQuery = '';
let statusFilter = '';

export async function renderEmployees(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Employees</h1>
        <p class="page-subtitle">Manage all employees</p>
      </div>
      <button class="btn btn-primary" id="add-emp-btn">+ Add Employee</button>
    </div>
    <div class="filter-bar">
      <div class="search-wrap" style="width:260px">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input class="form-control" type="text" id="emp-search" placeholder="Search employees…">
      </div>
      <select class="form-control" id="emp-status" style="width:auto">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
    <div class="card" style="padding:0">
      <div id="emp-table"></div>
      <div class="pagination" id="emp-pagination"></div>
    </div>
  `;

  const stopLoading = showLoading(container.querySelector('.card'));

  try {
    const [empRes, projRes] = await Promise.all([EmployeeAPI.getAll(), ProjectAPI.getAll()]);
    employees = empRes.data;
    projects = projRes.data;
    stopLoading();
    renderTable();
  } catch (e) {
    stopLoading();
    Toast.error('Failed to load employees');
  }

  const doSearch = debounce(q => { searchQuery = q; currentPage = 1; renderTable(); }, 300);
  container.querySelector('#emp-search').addEventListener('input', e => doSearch(e.target.value));
  container.querySelector('#emp-status').addEventListener('change', e => { statusFilter = e.target.value; currentPage = 1; renderTable(); });
  container.querySelector('#add-emp-btn').addEventListener('click', () => openEmpModal());
}

function renderTable() {
  let filtered = employees;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(e => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q));
  }
  if (statusFilter) filtered = filtered.filter(e => e.status === statusFilter);

  const pg = paginate(filtered, currentPage, PER_PAGE);
  const tableWrap = document.querySelector('#emp-table');

  if (filtered.length === 0) {
    tableWrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><h3>No employees found</h3></div>';
    document.querySelector('#emp-pagination').innerHTML = '';
    return;
  }

  tableWrap.innerHTML = `
    <div class="table-wrap" style="border:none;border-radius:0">
      <table>
        <thead><tr>
          <th>Employee</th><th>Department</th><th>Role</th>
          <th>Join Date</th><th>Projects</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${pg.items.map(e => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:9px">
                  <div class="avatar avatar-sm" style="background:${e.avatarColor}20;color:${e.avatarColor}">${e.avatar}</div>
                  <div>
                    <div style="font-weight:500">${e.name}</div>
                    <div style="font-size:11px;color:var(--ink-40)">${e.email}</div>
                  </div>
                </div>
              </td>
              <td style="color:var(--ink-60)">${e.dept}</td>
              <td style="color:var(--ink-60)">${e.role}</td>
              <td style="font-size:12px;color:var(--ink-40)">${formatDate(e.joinDate)}</td>
              <td>
                <span class="badge badge-blue">${e.projects.length} project${e.projects.length !== 1 ? 's' : ''}</span>
              </td>
              <td>${statusBadge(e.status)}</td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-ghost btn-icon btn-sm edit-emp-btn" data-id="${e.id}" title="Edit">✎</button>
                  <button class="btn btn-ghost btn-icon btn-sm assign-proj-btn" data-id="${e.id}" title="Assign Project" style="color:var(--accent)">◈</button>
                  <button class="btn btn-ghost btn-icon btn-sm del-emp-btn" data-id="${e.id}" title="Delete" style="color:var(--red)">✕</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  tableWrap.querySelectorAll('.edit-emp-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const emp = employees.find(e => e.id === parseInt(btn.dataset.id));
      if (emp) openEmpModal(emp);
    })
  );

  tableWrap.querySelectorAll('.del-emp-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteEmployee(parseInt(btn.dataset.id)))
  );

  tableWrap.querySelectorAll('.assign-proj-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const emp = employees.find(e => e.id === parseInt(btn.dataset.id));
      if (emp) openAssignModal(emp);
    })
  );

  renderPagination(document.querySelector('#emp-pagination'), pg, page => {
    currentPage = page;
    renderTable();
  });
}

function openEmpModal(emp = null) {
  const avatarColors = ['#7c3aed', '#059669', '#d97706', '#dc2626', '#2563eb', '#0891b2', '#be185d', '#16a34a'];

  const body = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-control" id="emp-name" value="${emp?.name || ''}" placeholder="e.g. Priya Sharma">
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input class="form-control" id="emp-email" type="email" value="${emp?.email || ''}" placeholder="name@nexus.io">
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Role *</label>
          <input class="form-control" id="emp-role" value="${emp?.role || ''}" placeholder="e.g. Software Engineer">
        </div>
        <div class="form-group">
          <label class="form-label">Department *</label>
          <select class="form-control" id="emp-dept">
            ${['Engineering', 'Product', 'Design', 'Analytics', 'HR', 'Marketing', 'Finance', 'IT'].map(d =>
              `<option value="${d}" ${emp?.dept === d ? 'selected' : ''}>${d}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Join Date</label>
          <input class="form-control" id="emp-joindate" type="date" value="${emp?.joinDate || new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Salary (Annual)</label>
          <input class="form-control" id="emp-salary" type="number" value="${emp?.salary || ''}" placeholder="e.g. 90000">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="emp-status-sel">
          <option value="active" ${emp?.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="inactive" ${emp?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
    </div>
  `;

  openModal({
    title: emp ? 'Edit Employee' : 'Add Employee',
    body,
    confirmText: emp ? 'Update' : 'Add Employee',
    onConfirm: () => saveEmployee(emp?.id),
  });
}

async function saveEmployee(id = null) {
  const name = document.querySelector('#emp-name').value.trim();
  const email = document.querySelector('#emp-email').value.trim();
  const role = document.querySelector('#emp-role').value.trim();
  const dept = document.querySelector('#emp-dept').value;
  const joinDate = document.querySelector('#emp-joindate').value;
  const salary = parseInt(document.querySelector('#emp-salary').value) || 0;
  const status = document.querySelector('#emp-status-sel').value;

  if (!name || !email || !role) { Toast.warning('Name, email, and role are required'); return; }

  const colors = ['#7c3aed', '#059669', '#d97706', '#dc2626', '#2563eb', '#0891b2'];
  const payload = {
    name, email, role, dept, joinDate, salary, status,
    avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    avatarColor: colors[Math.floor(Math.random() * colors.length)],
  };

  try {
    if (id) {
      const { data } = await EmployeeAPI.update(id, payload);
      employees = employees.map(e => e.id === id ? data : e);
      Toast.success('Employee updated');
    } else {
      const { data } = await EmployeeAPI.create(payload);
      employees.unshift(data);
      Toast.success('Employee added');
    }
    closeModal();
    renderTable();
  } catch (e) {
    Toast.error('Failed to save employee');
  }
}

async function deleteEmployee(id) {
  const confirmed = await confirmDialog({
    title: 'Delete Employee',
    message: 'This will permanently remove the employee record.',
    icon: '🗑',
  });
  if (!confirmed) return;
  try {
    await EmployeeAPI.delete(id);
    employees = employees.filter(e => e.id !== id);
    renderTable();
    Toast.success('Employee deleted');
  } catch (e) {
    Toast.error('Failed to delete employee');
  }
}

function openAssignModal(emp) {
  const assigned = emp.projects || [];
  const body = `
    <div>
      <p style="font-size:13px;color:var(--ink-60);margin-bottom:14px">Select projects to assign to <strong>${emp.name}</strong></p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${projects.map(p => `
          <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--ink-10);border-radius:var(--r-sm);cursor:pointer;transition:border-color 0.15s">
            <input type="checkbox" value="${p.id}" ${assigned.includes(p.id) ? 'checked' : ''} style="width:15px;height:15px">
            <div>
              <div style="font-size:13px;font-weight:500">${p.name}</div>
              <div style="font-size:11px;color:var(--ink-40)">${p.status} · ${p.members.length} members</div>
            </div>
          </label>
        `).join('')}
      </div>
    </div>
  `;

  openModal({
    title: 'Assign Projects',
    body,
    confirmText: 'Save Assignments',
    onConfirm: async () => {
      const checked = [...document.querySelectorAll('#modal-body-content input[type=checkbox]:checked')].map(cb => parseInt(cb.value));
      try {
        await EmployeeAPI.update(emp.id, { ...emp, projects: checked });
        employees = employees.map(e => e.id === emp.id ? { ...e, projects: checked } : e);
        closeModal();
        renderTable();
        Toast.success('Projects assigned');
      } catch (e) {
        Toast.error('Failed to assign projects');
      }
    },
  });
}
