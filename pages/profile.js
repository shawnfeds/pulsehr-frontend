// Profile Page
import { getUser } from '../js/utils/auth.js';
import { AuthAPI, EmployeeAPI } from '../js/services/api.js';
import { formatDate, formatCurrency, showLoading } from '../js/utils/helpers.js';
import { openModal, closeModal } from '../js/utils/modal.js';
import { Toast } from '../js/utils/toast.js';
import { EMPLOYEE_HISTORY, SALARY_HISTORY } from '../js/data.js';

export async function renderProfile(container) {
  const user = getUser();
  const color = user?.avatarColor || '#3b82f6';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">My Profile</h1><p class="page-subtitle">Manage your personal information</p></div>
    </div>

    <!-- Hero -->
    <div class="profile-hero" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:24px">
        <div class="profile-avatar-wrap">
          <div class="avatar avatar-xl" style="background:${color}1a;color:${color};font-family:var(--font-head);font-size:28px">${initials}</div>
          <div class="avatar-edit-btn" title="Change photo" onclick="document.getElementById('avatar-file').click()">✎</div>
          <input type="file" id="avatar-file" accept="image/*" style="display:none">
        </div>
        <div>
          <h2 style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:-0.4px">${user?.name}</h2>
          <p style="color:var(--text-3);margin-top:3px;font-size:13px">${user?.role} &middot; ${user?.dept}</p>
          <div style="display:flex;gap:16px;margin-top:12px">
            <span style="font-size:12px;color:var(--text-3)">✉ ${user?.email}</span>
            ${user?.phone ? `<span style="font-size:12px;color:var(--text-3)">📱 ${user.phone}</span>` : ''}
            ${user?.location ? `<span style="font-size:12px;color:var(--text-3)">📍 ${user.location}</span>` : ''}
          </div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button class="btn btn-secondary" id="edit-profile-btn">✎ Edit Profile</button>
          <button class="btn btn-secondary" id="change-pw-btn">🔒 Change Password</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);margin-top:24px;border-radius:var(--r-md);overflow:hidden">
        ${[
          { label: 'Employee ID', value: `EMP-${String(user?.id || 1).padStart(4, '0')}` },
          { label: 'Join Date', value: formatDate(user?.joinDate) },
          { label: 'Department', value: user?.dept },
          { label: 'Location', value: user?.location || 'Bengaluru, KA' },
        ].map(s => `
          <div style="background:var(--surface-2);padding:14px 16px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--text-3);margin-bottom:4px">${s.label}</div>
            <div style="font-size:14px;font-weight:600;font-family:var(--font-mono)">${s.value}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab-btn active" data-tab="overview">Overview</button>
      <button class="tab-btn" data-tab="history">Employment History</button>
      <button class="tab-btn" data-tab="salary">Salary History</button>
    </div>

    <div class="tab-panel active" id="tab-overview">
      <div class="content-grid">
        <div class="card">
          <div class="card-header"><span class="card-title">Personal Info</span></div>
          <div style="display:flex;flex-direction:column;gap:14px">
            ${[
              ['Full Name', user?.name],
              ['Email', user?.email],
              ['Phone', user?.phone || '—'],
              ['Location', user?.location || '—'],
              ['Role', user?.role],
              ['Department', user?.dept],
            ].map(([l, v]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border)">
                <span style="font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.4px;font-weight:600">${l}</span>
                <span style="font-size:13px;font-weight:500">${v}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Leave Summary</span></div>
          <div id="profile-leave-summary">
            <div class="loading-overlay" style="position:relative;height:100px"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="tab-panel" id="tab-history">
      <div class="card" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Event</th><th>Role</th><th>Department</th></tr></thead>
            <tbody>
              ${EMPLOYEE_HISTORY.map(h => `<tr>
                <td style="font-size:12px;color:var(--text-3)">${formatDate(h.date)}</td>
                <td><span class="badge ${h.event === 'Promotion' ? 'badge-green' : h.event === 'Joined' ? 'badge-blue' : 'badge-amber'}">${h.event}</span></td>
                <td style="font-weight:500">${h.role}</td>
                <td style="color:var(--text-3)">${h.dept}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="tab-panel" id="tab-salary">
      <div class="card" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Effective Date</th><th>Annual CTC</th><th>Monthly</th><th>Note</th></tr></thead>
            <tbody>
              ${SALARY_HISTORY.map(s => `<tr>
                <td style="font-size:12px;color:var(--text-3)">${formatDate(s.date)}</td>
                <td><span class="mono" style="color:var(--green)">${formatCurrency(s.amount)}</span></td>
                <td><span class="mono" style="color:var(--text-3)">${formatCurrency(Math.round(s.amount / 12))}</span></td>
                <td style="color:var(--text-3)">${s.note}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      container.querySelector(`#tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Load leave summary
  try {
    const { LeaveAPI } = await import('../js/services/api.js');
    const { data: balance } = await LeaveAPI.getBalance(user?.id);
    document.querySelector('#profile-leave-summary').innerHTML = ['sick', 'casual'].map(type => `
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;font-weight:600;text-transform:capitalize">${type} Leave</span>
          <span style="font-size:12px;color:var(--text-3)">${balance[type].used} / ${balance[type].total} used</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${(balance[type].used / balance[type].total) * 100}%;background:${type === 'sick' ? 'var(--red)' : 'var(--accent)'}"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:4px">
          <span class="badge badge-green">${balance[type].balance} remaining</span>
        </div>
      </div>
    `).join('');
  } catch { /* silent */ }

  // Edit profile modal
  container.querySelector('#edit-profile-btn').addEventListener('click', () => openEditModal(user));
  container.querySelector('#change-pw-btn').addEventListener('click', openChangePasswordModal);

  // Avatar upload
  document.getElementById('avatar-file')?.addEventListener('change', (e) => {
    if (e.target.files[0]) Toast.info('Avatar upload will connect to your .NET API');
  });
}

function openEditModal(user) {
  const body = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Full Name</label>
          <input class="form-control" id="pf-name" value="${user?.name || ''}"></div>
        <div class="form-group"><label class="form-label">Phone</label>
          <input class="form-control" id="pf-phone" value="${user?.phone || ''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Location</label>
        <input class="form-control" id="pf-location" value="${user?.location || ''}"></div>
      <div class="form-group"><label class="form-label">Email</label>
        <input class="form-control" id="pf-email" value="${user?.email || ''}" type="email"></div>
    </div>`;
  openModal({
    title: 'Edit Profile',
    body,
    confirmText: 'Save Changes',
    onConfirm: async () => {
      try {
        await EmployeeAPI.updateProfile(user.id, {
          name: document.querySelector('#pf-name').value,
          phone: document.querySelector('#pf-phone').value,
          location: document.querySelector('#pf-location').value,
          email: document.querySelector('#pf-email').value,
        });
        closeModal();
        Toast.success('Profile updated');
      } catch { Toast.error('Failed to update profile'); }
    },
  });
}

function openChangePasswordModal() {
  const body = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label class="form-label">Current Password</label>
        <input class="form-control" id="pw-current" type="password" placeholder="••••••••"></div>
      <div class="form-group"><label class="form-label">New Password</label>
        <input class="form-control" id="pw-new" type="password" placeholder="••••••••"></div>
      <div class="form-group"><label class="form-label">Confirm New Password</label>
        <input class="form-control" id="pw-confirm" type="password" placeholder="••••••••"></div>
    </div>`;
  openModal({
    title: 'Change Password',
    body,
    confirmText: 'Update Password',
    onConfirm: async () => {
      const cur = document.querySelector('#pw-current').value;
      const nw = document.querySelector('#pw-new').value;
      const cf = document.querySelector('#pw-confirm').value;
      if (!cur || !nw) { Toast.warning('Please fill all fields'); return; }
      if (nw !== cf) { Toast.warning('Passwords do not match'); return; }
      if (nw.length < 8) { Toast.warning('Password must be at least 8 characters'); return; }
      try {
        await AuthAPI.changePassword({ currentPassword: cur, newPassword: nw });
        closeModal();
        Toast.success('Password updated successfully');
      } catch (e) { Toast.error(e.message || 'Failed to update password'); }
    },
  });
}
