import { requireAuth, getRole } from './utils/auth.js';
import { createSidebar } from '../components/sidebar.js';
import { createTopbar }  from '../components/topbar.js';
import { navigateTo }    from './router.js';

async function init() {
  if (!requireAuth()) return;

  const role = getRole();
  const defaultPage = role === 'admin' ? 'admin-dashboard' : 'dashboard';

  const shell = document.getElementById('app');
  shell.className = 'app-shell';

  let currentPage = defaultPage;

  const navigate = (pageId) => {
    currentPage = pageId;
    sidebar.setActive(pageId);
    navigateTo(pageId, pageBody);
  };

  const sidebar = createSidebar(navigate, () => navigate('profile'));
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';

  const topbar = createTopbar(navigate);
  const pageBody = document.createElement('main');
  pageBody.className = 'page-body';

  mainContent.appendChild(topbar);
  mainContent.appendChild(pageBody);
  shell.appendChild(sidebar.element);
  shell.appendChild(mainContent);

  // Listen for internal navigation events (e.g. from dashboard "View All" buttons)
  document.addEventListener('app:navigate', (e) => navigate(e.detail));

  navigate(defaultPage);
}

document.addEventListener('DOMContentLoaded', init);
