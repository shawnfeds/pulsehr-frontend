// Admin Leave Management
import { LeaveAPI } from '../js/services/api.js';
import { formatDate, statusBadge, paginate, renderPagination, showLoading } from '../js/utils/helpers.js';
import { confirmDialog } from '../js/utils/modal.js';
import { Toast } from '../js/utils/toast.js';

let leaves = [];
let currentPage = 1;
const PER_PAGE = 8;

export async function renderLeaveManagement(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Leave Management</h1>
        <p class="page-subtitle">Review and approve leave requests</p>
      </div>
    </div>
    <div class="filter-bar">
      <select class="form-control" id="leave-status-filter" style="width:auto">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <select class="form-control" id="leave-type-filter" style="width:auto">
        <option value="">All Types</option>
        <option value="Sick">Sick</option>
        <option value="Casual">Casual</option>
      </select>
    </div>
    <div class="card" style="padding:0">
      <div id="leave-admin-table"></div>
      <div class="pagination" id="leave-admin-pagination"></div>
    </div>
  `;

  const stop = showLoading(container.querySelector('.card'));
  try {
    const { data } = await LeaveAPI.getAll();
    leaves = data;
    stop();
    renderTable();
  } catch (e) {
    stop();
    Toast.error('Failed to load leave requests');
  }

  container.querySelector('#leave-status-filter').addEventListener('change', () => { currentPage = 1; renderTable(); });
  container.querySelector('#leave-type-filter').addEventListener('change', () => { currentPage = 1; renderTable(); });
}

function renderTable() {
  const statusFilter = document.querySelector('#leave-status-filter').value;
  const typeFilter = document.querySelector('#leave-type-filter').value;

  let filtered = leaves;
  if (statusFilter) filtered = filtered.filter(l => l.status === statusFilter);
  if (typeFilter) filtered = filtered.filter(l => l.type === typeFilter);

  const pg = paginate(filtered, currentPage, PER_PAGE);
  const wrap = document.querySelector('#leave-admin-table');

  if (filtered.length === 0) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><h3>No leave requests</h3></div>';
    document.querySelector('#leave-admin-pagination').innerHTML = '';
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap" style="border:none;border-radius:0">
      <table>
        <thead><tr>
          <th>Employee</th><th>Type</th><th>From</th><th>To</th>
          <th>Days</th><th>Reason</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${pg.items.map(l => `
            <tr>
              <td>
                <div style="font-weight:500">${l.employeeName}</div>
              </td>
              <td>
                <span class="badge ${l.type === 'Sick' ? 'badge-red' : 'badge-blue'}">${l.type}</span>
                ${l.halfDay ? '<span class="badge badge-gray" style="margin-left:4px">½</span>' : ''}
              </td>
              <td style="font-size:12px;color:var(--ink-60)">${formatDate(l.startDate)}</td>
              <td style="font-size:12px;color:var(--ink-60)">${formatDate(l.endDate)}</td>
              <td><span class="mono fw-600">${l.days}</span></td>
              <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink-60);font-size:13px" title="${l.reason}">${l.reason}</td>
              <td>${statusBadge(l.status)}</td>
              <td>
                ${l.status === 'pending' ? `
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-sm approve-btn" data-id="${l.id}" style="background:var(--green-light);color:var(--green)">✓ Approve</button>
                    <button class="btn btn-sm reject-btn" data-id="${l.id}" style="background:var(--red-light);color:var(--red)">✕ Reject</button>
                  </div>
                ` : `<span style="font-size:12px;color:var(--ink-40)">—</span>`}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  wrap.querySelectorAll('.approve-btn').forEach(btn =>
    btn.addEventListener('click', () => updateLeaveStatus(parseInt(btn.dataset.id), 'approved'))
  );

  wrap.querySelectorAll('.reject-btn').forEach(btn =>
    btn.addEventListener('click', () => updateLeaveStatus(parseInt(btn.dataset.id), 'rejected'))
  );

  renderPagination(document.querySelector('#leave-admin-pagination'), pg, page => {
    currentPage = page;
    renderTable();
  });
}

async function updateLeaveStatus(id, status) {
  const action = status === 'approved' ? 'approve' : 'reject';
  const confirmed = await confirmDialog({
    title: `${status === 'approved' ? 'Approve' : 'Reject'} Leave`,
    message: `Are you sure you want to ${action} this leave request?`,
    confirmText: status === 'approved' ? 'Approve' : 'Reject',
    confirmClass: status === 'approved' ? 'btn-primary' : 'btn-danger',
    type: status === 'approved' ? 'warning' : 'danger',
    icon: status === 'approved' ? '✓' : '✕',
  });
  if (!confirmed) return;

  try {
    await LeaveAPI.updateStatus(id, status);
    leaves = leaves.map(l => l.id === id ? { ...l, status } : l);
    renderTable();
    Toast.success(`Leave request ${status}`);
  } catch (e) {
    Toast.error('Failed to update leave status');
  }
}
