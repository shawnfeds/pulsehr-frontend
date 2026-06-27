// Router
import { renderEmployeeDashboard } from '../pages/emp-dashboard.js';
import { renderTimesheet }         from '../pages/timesheet.js';
import { renderProjects }          from '../pages/projects.js';
import { renderLeaves }            from '../pages/leaves.js';
import { renderMyInfo }            from '../pages/my-info.js';
import { renderCompany }           from '../pages/company.js';
import { renderProfile }           from '../pages/profile.js';
import { renderAdminDashboard }    from '../pages/admin-dashboard.js';
import { renderEmployees }         from '../pages/admin-employees.js';
import { renderAdminProjects }     from '../pages/admin-projects.js';
import { renderLeaveManagement }   from '../pages/admin-leaves.js';
import { renderAdminPolicies }     from '../pages/admin-policies.js';
import { renderHolidaysEvents }    from '../pages/admin-holidays.js';
import { Toast }                   from './utils/toast.js';

const ROUTES = {
  // Employee
  dashboard:         renderEmployeeDashboard,
  timesheet:         renderTimesheet,
  projects:          renderProjects,
  leaves:            renderLeaves,
  'my-info':         renderMyInfo,
  company:           renderCompany,
  profile:           renderProfile,
  // Admin
  'admin-dashboard': renderAdminDashboard,
  employees:         renderEmployees,
  'admin-projects':  renderAdminProjects,
  'leave-management':renderLeaveManagement,
  'admin-policies':  renderAdminPolicies,
  'holidays-events': renderHolidaysEvents,
};

export async function navigateTo(pageId, container) {
  const render = ROUTES[pageId];
  if (!render) {
    container.innerHTML = `<div class="empty-state" style="padding:80px">
      <div class="empty-state-icon">🔍</div><h3>Page not found</h3><p>"${pageId}" does not exist</p></div>`;
    return;
  }

  container.style.transition = 'opacity 0.12s ease, transform 0.12s ease';
  container.style.opacity = '0';
  container.style.transform = 'translateY(6px)';
  await new Promise(r => setTimeout(r, 80));
  container.innerHTML = '';

  try {
    await render(container);
  } catch (e) {
    console.error(`Error rendering "${pageId}":`, e);
    container.innerHTML = `<div class="empty-state" style="padding:60px">
      <div class="empty-state-icon">⚠️</div><h3>Something went wrong</h3>
      <p>${e.message}</p>
      <button class="btn btn-primary" style="margin-top:16px" onclick="location.reload()">Reload</button></div>`;
    Toast.error(`Failed to load: ${pageId}`);
  }

  requestAnimationFrame(() => {
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
    setTimeout(() => container.style.transition = '', 200);
  });
}
