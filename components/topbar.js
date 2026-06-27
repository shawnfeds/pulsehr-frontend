// Topbar component
import { getUser, logout } from '../js/utils/auth.js';
import { getInitials, debounce } from '../js/utils/helpers.js';
import { SearchAPI, NotificationAPI, AuthAPI } from '../js/services/api.js';
import { Toast } from '../js/utils/toast.js';
import { openModal, closeModal } from '../js/utils/modal.js';

export function createTopbar(onNavigate) {
  const user = getUser();
  const color = user?.avatarColor || '#3b82f6';
  const initials = getInitials(user?.name || '');

  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `
    <div class="topbar-search">
      <span class="s-icon">⌕</span>
      <input type="text" id="global-search" placeholder="Search employees, projects…" autocomplete="off">
      <div class="search-dropdown" id="search-dropdown"></div>
    </div>
    <div class="topbar-actions">
      <div class="topbar-icon-btn" id="notif-btn" title="Notifications">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <div class="notif-dot" id="notif-dot" style="display:none"></div>
        <div class="notif-panel" id="notif-panel">
          <div class="notif-panel-head">
            <span>Notifications</span>
            <span id="mark-all-read" style="font-size:11px;color:var(--accent-light);cursor:pointer;font-weight:400">Mark all read</span>
          </div>
          <div id="notif-list"></div>
        </div>
      </div>
      <div class="topbar-sep"></div>
      <div class="topbar-icon-btn action-wrap" id="user-btn">
        <div class="avatar avatar-sm" style="background:${color}1a;color:${color};font-family:var(--font-head)">${initials}</div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--text-3);margin-left:2px"><polyline points="6 9 12 15 18 9"/></svg>
        <div class="user-dropdown" id="user-dropdown">
          <div class="dropdown-item" id="dd-profile"><span class="dropdown-icon">👤</span> My Profile</div>
          <div class="dropdown-item" id="dd-change-pw"><span class="dropdown-icon">🔒</span> Change Password</div>
          <div class="dropdown-item danger" id="dd-logout"><span class="dropdown-icon">⏻</span> Sign Out</div>
        </div>
      </div>
    </div>
  `;

  // ── Search ──
  const input = bar.querySelector('#global-search');
  const dropdown = bar.querySelector('#search-dropdown');
  const doSearch = debounce(async (q) => {
    if (q.length < 2) { dropdown.classList.remove('open'); return; }
    try {
      const { data } = await SearchAPI.global(q);
      dropdown.innerHTML = data.length
        ? data.map(r => `
          <div class="search-result" data-type="${r.type}" data-id="${r.id}">
            ${r.type === 'employee'
              ? `<div class="avatar avatar-sm" style="background:${r.color}1a;color:${r.color};font-family:var(--font-head)">${r.avatar}</div>`
              : '<span style="font-size:18px">◈</span>'}
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500">${r.label}</div>
              <div style="font-size:11px;color:var(--text-3)">${r.sub}</div>
            </div>
            <span class="badge badge-${r.type === 'employee' ? 'blue' : 'purple'}">${r.type}</span>
          </div>`).join('')
        : '<div style="padding:16px;text-align:center;font-size:13px;color:var(--text-3)">No results found</div>';
      dropdown.classList.add('open');
    } catch { Toast.error('Search failed'); }
  }, 280);

  input.addEventListener('input', e => doSearch(e.target.value));
  document.addEventListener('click', e => {
    if (!bar.querySelector('.topbar-search').contains(e.target)) dropdown.classList.remove('open');
  });

  // ── Notifications ──
  const notifBtn = bar.querySelector('#notif-btn');
  const notifPanel = bar.querySelector('#notif-panel');
  (async () => {
    try {
      const { data } = await NotificationAPI.getAll();
      if (data.some(n => !n.read)) bar.querySelector('#notif-dot').style.display = 'block';
      bar.querySelector('#notif-list').innerHTML = data.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}">
          <div class="notif-unread-dot" style="${n.read ? 'opacity:0' : ''}"></div>
          <div class="notif-content"><p>${n.text}</p><span>${n.time}</span></div>
        </div>`).join('');
    } catch { /* silent */ }
  })();

  notifBtn.addEventListener('click', e => { e.stopPropagation(); notifPanel.classList.toggle('open'); });
  bar.querySelector('#mark-all-read').addEventListener('click', async () => {
    await NotificationAPI.markAllRead().catch(() => {});
    bar.querySelector('#notif-dot').style.display = 'none';
    bar.querySelectorAll('.notif-item').forEach(el => {
      el.classList.remove('unread');
      el.querySelector('.notif-unread-dot').style.opacity = '0';
    });
  });

  // ── User dropdown ──
  const userBtn = bar.querySelector('#user-btn');
  const userDD  = bar.querySelector('#user-dropdown');
  userBtn.addEventListener('click', e => { e.stopPropagation(); userDD.classList.toggle('open'); });

  bar.querySelector('#dd-profile').addEventListener('click', () => {
    userDD.classList.remove('open'); onNavigate?.('profile');
  });
  bar.querySelector('#dd-change-pw').addEventListener('click', () => {
    userDD.classList.remove('open'); openChangePasswordModal();
  });
  bar.querySelector('#dd-logout').addEventListener('click', () => {
    userDD.classList.remove('open'); logout();
  });

  document.addEventListener('click', e => {
    if (!notifBtn.contains(e.target)) notifPanel.classList.remove('open');
    if (!userBtn.contains(e.target)) userDD.classList.remove('open');
  });

  return bar;
}

function openChangePasswordModal() {
  openModal({
    title: 'Change Password',
    body: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input class="form-control" id="pw-current" type="password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input class="form-control" id="pw-new" type="password" placeholder="Min 8 characters" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <input class="form-control" id="pw-confirm" type="password" placeholder="Repeat new password" autocomplete="new-password">
        </div>
        <div id="pw-error" style="display:none;padding:10px 12px;background:var(--red-dim);border:1px solid rgba(239,68,68,0.2);border-radius:var(--r-md);font-size:12px;color:var(--red)"></div>
      </div>`,
    confirmText: 'Update Password',
    onConfirm: async () => {
      const cur   = document.querySelector('#pw-current').value;
      const nw    = document.querySelector('#pw-new').value;
      const cf    = document.querySelector('#pw-confirm').value;
      const errEl = document.querySelector('#pw-error');
      const showErr = (msg) => { errEl.textContent = msg; errEl.style.display = 'block'; };
      if (!cur || !nw || !cf) { showErr('Please fill all fields'); return; }
      if (nw.length < 8)       { showErr('New password must be at least 8 characters'); return; }
      if (nw !== cf)            { showErr('Passwords do not match'); return; }
      try {
        await AuthAPI.changePassword({ currentPassword: cur, newPassword: nw });
        closeModal();
        Toast.success('Password updated successfully');
      } catch (e) { showErr(e.message || 'Failed to update password'); }
    },
  });
  setTimeout(() => document.querySelector('#pw-current')?.focus(), 80);
}
