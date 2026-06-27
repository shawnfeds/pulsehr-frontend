// Toast notifications
let container;
const getContainer = () => {
  if (!container) {
    container = Object.assign(document.createElement('div'), { className: 'toast-container' });
    document.body.appendChild(container);
  }
  return container;
};

const show = (msg, type, dur = 3500) => {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span><span class="toast-close">✕</span>`;
  getContainer().appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  const dismiss = () => { t.classList.replace('show', 'hide'); setTimeout(() => t.remove(), 400); };
  t.querySelector('.toast-close').onclick = dismiss;
  setTimeout(dismiss, dur);
};

export const Toast = {
  success: (m) => show(m, 'success'),
  error:   (m) => show(m, 'error', 5000),
  warning: (m) => show(m, 'warning'),
  info:    (m) => show(m, 'info'),
};
