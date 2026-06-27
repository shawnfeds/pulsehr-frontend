// Sidebar component
import { getUser, getRole } from '../js/utils/auth.js';
import { getInitials } from '../js/utils/helpers.js';

const EMP_NAV = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '⊞' },
  { id: 'timesheet',  label: 'Timesheet',  icon: '⏱' },
  { id: 'projects',   label: 'Projects',   icon: '◈' },
  { id: 'leaves',     label: 'Leaves',     icon: '📅' },
  { id: 'my-info',    label: 'My Info',    icon: '👤' },
  { id: 'company',    label: 'Company',    icon: '🏢' },
];

const ADMIN_NAV = [
  { id: 'admin-dashboard',  label: 'Overview',   icon: '⊞',  section: null },
  { id: 'employees',        label: 'Employees',  icon: '👥', section: 'Manage' },
  { id: 'admin-projects',   label: 'Projects',   icon: '◈', section: 'Manage' },
  { id: 'leave-management', label: 'Leaves',     icon: '📅', section: 'Manage' },
  { id: 'admin-policies',   label: 'Policies',   icon: '📄', section: 'Settings' },
  { id: 'holidays-events',  label: 'Calendar',   icon: '🗓', section: 'Settings' },
];

// SVG logo mark — abstract geometric P mark
const LOGO_SVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="28" height="28" rx="8" fill="#3b82f6"/>
  <path d="M8 7h7a5 5 0 0 1 0 10H8V7z" fill="white" opacity="0.95"/>
  <rect x="8" y="19" width="4" height="2" rx="1" fill="white" opacity="0.7"/>
</svg>`;

export function createSidebar(onNavigate, onProfileClick) {
  const user = getUser();
  const role = getRole();
  const nav  = role === 'admin' ? ADMIN_NAV : EMP_NAV;
  const defaultPage = role === 'admin' ? 'admin-dashboard' : 'dashboard';

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  const sections = [...new Set(nav.map(n => n.section ?? '__root'))];
  let navHTML = '';
  sections.forEach(sec => {
    const items = nav.filter(n => (n.section ?? '__root') === sec);
    navHTML += '<div class="nav-section">';
    if (sec !== '__root') navHTML += `<div class="nav-section-label">${sec}</div>`;
    items.forEach(item => {
      navHTML += `<div class="nav-item" data-page="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-text">${item.label}</span>
      </div>`;
    });
    navHTML += '</div>';
  });

  const initials = user ? getInitials(user.name) : '??';
  const color = user?.avatarColor || '#3b82f6';

  sidebar.innerHTML = `
    <div class="sidebar-logo" id="sidebar-logo" title="Go to Dashboard" style="cursor:pointer">
      <div class="logo-mark-wrap">${LOGO_SVG}</div>
      <span class="logo-text">PulseHR</span>
    </div>
    <nav class="sidebar-nav">${navHTML}</nav>
    <div class="sidebar-footer">
      <div class="user-pill" id="sidebar-user">
        <div class="avatar avatar-sm" style="background:${color}1a;color:${color};font-family:var(--font-head)">${initials}</div>
        <div class="user-pill-info">
          <div class="user-pill-name">${user?.name || 'User'}</div>
          <div class="user-pill-role">${user?.role || role}</div>
        </div>
      </div>
    </div>
    <button class="collapse-btn" id="collapse-btn" title="Collapse">‹</button>
  `;

  sidebar.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      sidebar.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      onNavigate(el.dataset.page);
    });
  });

  // Logo click → dashboard
  sidebar.querySelector('#sidebar-logo').addEventListener('click', () => {
    sidebar.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const homeItem = sidebar.querySelector(`[data-page="${defaultPage}"]`);
    homeItem?.classList.add('active');
    onNavigate(defaultPage);
  });

  sidebar.querySelector('#sidebar-user').addEventListener('click', () => onProfileClick?.());
  sidebar.querySelector('#collapse-btn').addEventListener('click', () => sidebar.classList.toggle('collapsed'));

  return {
    element: sidebar,
    setActive(id) {
      sidebar.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === id));
    },
  };
}
