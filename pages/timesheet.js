import { getUser } from '../js/utils/auth.js';
// Timesheet Page
import { TimesheetAPI, ProjectAPI } from '../js/services/api.js';

import { formatDate, paginate, renderPagination, groupBy, currentMonth, showLoading } from '../js/utils/helpers.js';
import { openModal, closeModal } from '../js/utils/modal.js';
import { Toast } from '../js/utils/toast.js';
import { confirmDialog } from '../js/utils/modal.js';

let entries = [];
let projects = [];
let currentPage = 1;
const PER_PAGE = 8;
let editingId = null;

export async function renderTimesheet(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Timesheet</h1>
        <p class="page-subtitle">Track your daily work hours</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary btn-sm" id="export-btn">↓ Export</button>
        <button class="btn btn-primary" id="add-entry-btn">+ Add Entry</button>
      </div>
    </div>
    <div class="filter-bar">
      <select class="form-control" id="month-filter" style="width:auto">
        <option value="">All Months</option>
        <option value="April 2024" selected>April 2024</option>
        <option value="March 2024">March 2024</option>
        <option value="February 2024">February 2024</option>
      </select>
      <div class="stat-card" style="padding:10px 16px;display:inline-flex;align-items:center;gap:12px;border-radius:var(--r-md)">
        <span style="font-size:12px;color:var(--ink-40)">Total Hours:</span>
        <span class="mono fw-600" id="total-hours">—</span>
      </div>
    </div>
    <div class="card" style="padding:0">
      <div id="ts-table-wrap"></div>
      <div class="pagination" id="ts-pagination"></div>
    </div>
  `;

  const stopLoading = showLoading(container.querySelector('.card'));

  try {
    const [tsRes, projRes] = await Promise.all([
      TimesheetAPI.getAll({ employeeId: getUser().id }),
      ProjectAPI.getAll(),
    ]);
    entries = tsRes.data;
    projects = projRes.data;
    stopLoading();
    renderTable();
  } catch (e) {
    stopLoading();
    Toast.error('Failed to load timesheets');
  }

  container.querySelector('#add-entry-btn').addEventListener('click', () => openEntryModal());
  container.querySelector('#month-filter').addEventListener('change', e => {
    currentPage = 1;
    renderTable(e.target.value);
  });
  container.querySelector('#export-btn').addEventListener('click', exportCSV);
}

function renderTable(monthFilter = '') {
  let filtered = monthFilter ? entries.filter(e => e.month === monthFilter) : entries;
  const total = filtered.reduce((s, e) => s + e.hours, 0);
  document.querySelector('#total-hours').textContent = `${total}h`;

  const pg = paginate(filtered, currentPage, PER_PAGE);
  const tableWrap = document.querySelector('#ts-table-wrap');

  if (filtered.length === 0) {
    tableWrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏱</div><h3>No entries</h3><p>Add your first timesheet entry</p></div>';
    document.querySelector('#ts-pagination').innerHTML = '';
    return;
  }

  tableWrap.innerHTML = `
    <div class="table-wrap" style="border:none;border-radius:0">
      <table>
        <thead><tr>
          <th>Date</th><th>Project</th><th>Task Description</th>
          <th>Hours</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${pg.items.map(entry => `
            <tr>
              <td style="color:var(--ink-60);font-size:12px;white-space:nowrap">${formatDate(entry.date)}</td>
              <td><span class="badge badge-blue">${entry.project}</span></td>
              <td style="max-width:260px">
                <span title="${entry.task}" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${entry.task}</span>
              </td>
              <td><span class="mono fw-600" style="color:var(--accent)">${entry.hours}h</span></td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-ghost btn-icon btn-sm edit-btn" data-id="${entry.id}" title="Edit">✎</button>
                  <button class="btn btn-ghost btn-icon btn-sm del-btn" data-id="${entry.id}" title="Delete" style="color:var(--red)">✕</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  tableWrap.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const entry = entries.find(e => e.id === parseInt(btn.dataset.id));
      if (entry) openEntryModal(entry);
    })
  );

  tableWrap.querySelectorAll('.del-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteEntry(parseInt(btn.dataset.id)))
  );

  renderPagination(document.querySelector('#ts-pagination'), pg, page => {
    currentPage = page;
    renderTable(monthFilter);
  });
}

function openEntryModal(entry = null) {
  editingId = entry ? entry.id : null;
  const projectOptions = [
    '<option value="General">General</option>',
    ...projects.map(p => `<option value="${p.name}" ${entry?.project === p.name ? 'selected' : ''}>${p.name}</option>`)
  ].join('');

  const body = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input type="date" class="form-control" id="ts-date" value="${entry?.date || new Date().toISOString().split('T')[0]}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Hours *</label>
          <input type="number" class="form-control" id="ts-hours" min="0.5" max="24" step="0.5" value="${entry?.hours || ''}" placeholder="e.g. 6" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Project *</label>
        <select class="form-control" id="ts-project">${projectOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Task Description *</label>
        <textarea class="form-control" id="ts-task" rows="3" placeholder="Describe what you worked on…" style="resize:vertical">${entry?.task || ''}</textarea>
      </div>
    </div>
  `;

  openModal({
    title: entry ? 'Edit Timesheet Entry' : 'Add Timesheet Entry',
    body,
    confirmText: entry ? 'Update' : 'Add Entry',
    onConfirm: saveEntry,
  });
}

async function saveEntry() {
  const date = document.querySelector('#ts-date').value;
  const hours = parseFloat(document.querySelector('#ts-hours').value);
  const project = document.querySelector('#ts-project').value;
  const task = document.querySelector('#ts-task').value.trim();

  if (!date || !hours || !task) { Toast.warning('Please fill all required fields'); return; }
  if (hours <= 0 || hours > 24) { Toast.warning('Hours must be between 0.5 and 24'); return; }

  const payload = {
    date, hours, project, task,
    employeeId: getUser().id,
    projectId: 0,
    month: new Date(date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  };

  try {
    if (editingId) {
      const { data } = await TimesheetAPI.update(editingId, payload);
      entries = entries.map(e => e.id === editingId ? data : e);
      Toast.success('Entry updated successfully');
    } else {
      const { data } = await TimesheetAPI.create(payload);
      entries.unshift(data);
      Toast.success('Entry added successfully');
    }
    closeModal();
    renderTable();
  } catch (e) {
    Toast.error('Failed to save entry. Please try again.');
  }
}

async function deleteEntry(id) {
  const confirmed = await confirmDialog({
    title: 'Delete Entry',
    message: 'Are you sure you want to delete this timesheet entry?',
    confirmText: 'Delete',
    icon: '🗑',
  });
  if (!confirmed) return;
  try {
    await TimesheetAPI.delete(id);
    entries = entries.filter(e => e.id !== id);
    Toast.success('Entry deleted');
    renderTable();
  } catch (e) {
    Toast.error('Failed to delete entry');
  }
}

function exportCSV() {
  const headers = ['Date', 'Project', 'Task', 'Hours'];
  const rows = entries.map(e => [e.date, e.project, `"${e.task}"`, e.hours]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `timesheet-${currentMonth().replace(' ', '-')}.csv`;
  a.click();
  Toast.success('Timesheet exported');
}
