// Utility helpers

export const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatCurrency = (n) =>
  n ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—';

export const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

export const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export const debounce = (fn, ms = 300) => {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export const paginate = (arr, page, per) => {
  const start = (page - 1) * per;
  return { items: arr.slice(start, start + per), total: arr.length, totalPages: Math.ceil(arr.length / per), page, per };
};

export const renderPagination = (el, pg, onPage) => {
  const { page, totalPages, total, per } = pg;
  const s = (page - 1) * per + 1, e = Math.min(page * per, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  let html = `<span class="pagination-info">Showing ${s}–${e} of ${total}</span>
    <button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹</button>`;
  let prev = null;
  pages.forEach(p => {
    if (prev && p - prev > 1) html += `<span style="color:var(--text-4);padding:0 2px">…</span>`;
    html += `<button class="page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    prev = p;
  });
  html += `<button class="page-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>›</button>`;
  el.innerHTML = html;
  el.querySelectorAll('.page-btn[data-page]').forEach(b =>
    b.addEventListener('click', () => !b.disabled && onPage(+b.dataset.page))
  );
};

export const statusBadge = (status) => {
  const map = { active: 'badge-green', inactive: 'badge-gray', pending: 'badge-amber', approved: 'badge-green', rejected: 'badge-red', 'on-hold': 'badge-amber', completed: 'badge-gray' };
  return `<span class="badge ${map[status] || 'badge-gray'}">${capitalize(status)}</span>`;
};

export const avatarEl = (name, color, size = 'md') =>
  `<div class="avatar avatar-${size}" style="background:${color}1a;color:${color};font-family:var(--font-head)">${getInitials(name)}</div>`;

export const showLoading = (el) => {
  const ov = document.createElement('div');
  ov.className = 'loading-overlay';
  ov.innerHTML = '<div class="spinner"></div>';
  el.style.position = 'relative';
  el.appendChild(ov);
  return () => ov.remove();
};

export const getDaysInRange = (s, e) =>
  Math.max(1, Math.ceil((new Date(e) - new Date(s)) / 86400000) + 1);

export const currentMonth = () =>
  new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

export const groupBy = (arr, key) =>
  arr.reduce((acc, i) => { (acc[i[key]] ??= []).push(i); return acc; }, {});
