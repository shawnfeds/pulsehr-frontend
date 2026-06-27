import { getUser } from '../js/utils/auth.js';
import { LeaveAPI } from '../js/services/api.js';
import { formatDate, statusBadge, paginate, renderPagination, getDaysInRange, showLoading } from '../js/utils/helpers.js';
import { openModal, closeModal, confirmDialog } from '../js/utils/modal.js';
import { Toast } from '../js/utils/toast.js';

let leaves = [];
let leaveBalance = { sick: { total: 12, used: 2, balance: 10 }, casual: { total: 12, used: 0.5, balance: 11.5 } };
let currentPage = 1;
const PER_PAGE = 8;

export async function renderLeaves(container) {
  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Leave Management</h1><p class="page-subtitle">Apply and track your leave requests</p></div>
      <button class="btn btn-primary" id="apply-leave-btn">+ Apply Leave</button>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:24px" id="leave-stats">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--red-dim);color:var(--red)">🤒</div>
        <div class="stat-value" id="sick-bal">—</div>
        <div class="stat-label">Sick Leave Balance</div>
        <div class="stat-sub" id="sick-sub">— used of —</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">✈</div>
        <div class="stat-value" id="casual-bal">—</div>
        <div class="stat-label">Casual Leave Balance</div>
        <div class="stat-sub" id="casual-sub">— used of —</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">📊</div>
        <div class="stat-value" id="total-taken">—</div>
        <div class="stat-label">Total Days Taken</div>
      </div>
    </div>

    <div class="card" style="padding:0">
      <div class="card-header" style="padding:16px 20px;border-bottom:1px solid var(--border)">
        <span class="card-title">Leave History</span>
        <select class="form-control" id="status-filter" style="width:auto">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div id="leaves-table"></div>
      <div class="pagination" id="leaves-pagination"></div>
    </div>
  `;

  const stopLoading = showLoading(container.querySelector('.card'));

  try {
    const [leavesRes, balRes] = await Promise.all([
      LeaveAPI.getMyLeaves(getUser()?.id),
      LeaveAPI.getBalance(getUser()?.id),
    ]);
    leaves = leavesRes.data;
    leaveBalance = balRes.data;
    stopLoading();
    updateStats();
    renderTable();
  } catch (e) {
    stopLoading();
    Toast.error('Failed to load leaves');
  }

  container.querySelector('#apply-leave-btn').addEventListener('click', () => openApplyModal());
  container.querySelector('#status-filter').addEventListener('change', e => { currentPage = 1; renderTable(e.target.value); });
}

function updateStats() {
  const el = (id) => document.querySelector(`#${id}`);
  el('sick-bal').textContent = leaveBalance.sick.balance;
  el('sick-sub').textContent = `${leaveBalance.sick.used} used of ${leaveBalance.sick.total}`;
  el('casual-bal').textContent = leaveBalance.casual.balance;
  el('casual-sub').textContent = `${leaveBalance.casual.used} used of ${leaveBalance.casual.total}`;
  el('total-taken').textContent = leaveBalance.sick.used + leaveBalance.casual.used;
}

function renderTable(statusFilter = '') {
  let filtered = statusFilter ? leaves.filter(l => l.status === statusFilter) : leaves;
  const pg = paginate(filtered, currentPage, PER_PAGE);
  const tableWrap = document.querySelector('#leaves-table');

  if (!filtered.length) {
    tableWrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><h3>No leave requests</h3><p>Apply for leave using the button above</p></div>';
    document.querySelector('#leaves-pagination').innerHTML = '';
    return;
  }

  tableWrap.innerHTML = `
    <div class="table-wrap" style="border:none;border-radius:0">
      <table>
        <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${pg.items.map(l => `<tr>
            <td>
              <span class="badge ${l.type === 'Sick' ? 'badge-red' : 'badge-blue'}">${l.type}</span>
              ${l.halfDay ? '<span class="badge badge-gray" style="margin-left:4px">½ day</span>' : ''}
            </td>
            <td style="font-size:12px;color:var(--text-3)">${formatDate(l.startDate)}</td>
            <td style="font-size:12px;color:var(--text-3)">${formatDate(l.endDate)}</td>
            <td><span class="mono" style="font-weight:600;color:var(--text-1)">${l.days}</span></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-2);font-size:13px">${l.reason}</td>
            <td>${statusBadge(l.status)}</td>
            <td>${l.status === 'pending' ? `<button class="btn btn-danger btn-sm cancel-leave-btn" data-id="${l.id}">Cancel</button>` : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  tableWrap.querySelectorAll('.cancel-leave-btn').forEach(btn =>
    btn.addEventListener('click', () => cancelLeave(parseInt(btn.dataset.id)))
  );
  renderPagination(document.querySelector('#leaves-pagination'), pg, page => { currentPage = page; renderTable(statusFilter); });
}

function openApplyModal() {
  const today = new Date().toISOString().split('T')[0];

  openModal({
    title: 'Apply for Leave',
    body: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Leave Type *</label>
            <select class="form-control" id="leave-type">
              <option value="Sick">Sick Leave</option>
              <option value="Casual">Casual Leave</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Duration</label>
            <select class="form-control" id="leave-duration">
              <option value="full">Full Day</option>
              <option value="half">Half Day</option>
            </select>
          </div>
        </div>
        <div class="form-grid" id="date-range-wrap">
          <div class="form-group">
            <label class="form-label">From Date *</label>
            <input type="date" class="form-control" id="leave-start" value="${today}">
          </div>
          <div class="form-group" id="end-date-wrap">
            <label class="form-label">To Date *</label>
            <input type="date" class="form-control" id="leave-end" value="${today}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Number of Days</label>
          <input type="text" class="form-control" id="leave-days" value="1" readonly
            style="background:var(--surface-3);color:var(--accent);font-weight:600;font-family:var(--font-mono);cursor:default">
        </div>
        <div class="form-group">
          <label class="form-label">Reason *</label>
          <textarea class="form-control" id="leave-reason" rows="3" placeholder="Brief reason for leave request…" style="resize:vertical"></textarea>
        </div>
        <div style="padding:10px 12px;background:var(--surface-2);border-radius:var(--r-md);font-size:12px;color:var(--text-3);border:1px solid var(--border)">
          📋 Balance — Sick: <strong style="color:var(--text-1)">${leaveBalance.sick.balance}</strong> days &nbsp;·&nbsp; Casual: <strong style="color:var(--text-1)">${leaveBalance.casual.balance}</strong> days
        </div>
      </div>`,
    confirmText: 'Submit Request',
    onConfirm: submitLeave,
  });

  // Wire up dynamic days calculation
  setTimeout(() => {
    const startEl    = document.querySelector('#leave-start');
    const endEl      = document.querySelector('#leave-end');
    const daysEl     = document.querySelector('#leave-days');
    const durationEl = document.querySelector('#leave-duration');
    const endWrap    = document.querySelector('#end-date-wrap');

    const recalc = () => {
      const dur = durationEl.value;
      if (dur === 'half') {
        daysEl.value = '0.5';
        endWrap.style.display = 'none';
      } else {
        endWrap.style.display = '';
        const s = startEl.value, e = endEl.value;
        if (s && e && e >= s) daysEl.value = getDaysInRange(s, e);
        else if (s) daysEl.value = 1;
      }
    };

    durationEl.addEventListener('change', recalc);
    startEl.addEventListener('change', recalc);
    endEl.addEventListener('change', recalc);
  }, 50);
}

async function submitLeave() {
  const type      = document.querySelector('#leave-type').value;
  const duration  = document.querySelector('#leave-duration').value;
  const startDate = document.querySelector('#leave-start').value;
  const endDate   = duration === 'half' ? startDate : document.querySelector('#leave-end').value;
  const reason    = document.querySelector('#leave-reason').value.trim();
  const days      = parseFloat(document.querySelector('#leave-days').value);

  if (!startDate || !reason) { Toast.warning('Please fill all required fields'); return; }
  if (endDate < startDate)   { Toast.warning('End date must be after start date'); return; }

  const balance = type === 'Sick' ? leaveBalance.sick.balance : leaveBalance.casual.balance;
  if (days > balance) { Toast.error(`Insufficient ${type} leave balance (${balance} days remaining)`); return; }

  try {
    const { data } = await LeaveAPI.apply({
      employeeId:   getUser()?.id,
      employeeName: getUser()?.name,
      type, startDate, endDate, days, reason,
      halfDay: duration === 'half',
    });
    leaves.unshift(data);
    closeModal();
    renderTable();
    Toast.success('Leave request submitted successfully');
  } catch (e) {
    Toast.error('Failed to submit leave request');
  }
}

async function cancelLeave(id) {
  const ok = await confirmDialog({ title: 'Cancel Leave', message: 'Are you sure you want to cancel this leave request?', confirmText: 'Yes, Cancel', icon: '⚠️' });
  if (!ok) return;
  try {
    await LeaveAPI.cancel(id);
    leaves = leaves.filter(l => l.id !== id);
    renderTable();
    Toast.success('Leave cancelled');
  } catch { Toast.error('Failed to cancel leave'); }
}
