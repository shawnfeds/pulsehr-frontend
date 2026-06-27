// Modal manager
let active = null;

export const closeModal = () => {
  if (!active) return;
  active.classList.remove('open');
  document.removeEventListener('keydown', onEsc);
  setTimeout(() => { active?.remove(); active = null; }, 250);
};

const onEsc = (e) => { if (e.key === 'Escape') closeModal(); };

export function openModal(cfg) {
  closeModal();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  const sizeClass = cfg.size === 'lg' ? 'modal-lg' : cfg.size === 'sm' ? 'modal-sm' : '';
  ov.innerHTML = `
    <div class="modal ${sizeClass}">
      <div class="modal-header">
        <h3 class="modal-title">${cfg.title}</h3>
        <button class="modal-close">✕</button>
      </div>
      <div class="modal-body" id="modal-body"></div>
      ${cfg.footer !== false ? '<div class="modal-footer" id="modal-footer"></div>' : ''}
    </div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('open'));

  const body = ov.querySelector('#modal-body');
  if (typeof cfg.body === 'string') body.innerHTML = cfg.body;
  else if (cfg.body instanceof HTMLElement) body.appendChild(cfg.body);

  if (cfg.footer !== false) {
    const footer = ov.querySelector('#modal-footer');
    if (cfg.footer instanceof HTMLElement) {
      footer.appendChild(cfg.footer);
    } else {
      const cancel = Object.assign(document.createElement('button'), { className: 'btn btn-secondary', textContent: cfg.cancelText || 'Cancel' });
      cancel.onclick = closeModal;
      footer.appendChild(cancel);
      if (cfg.onConfirm) {
        const confirm = Object.assign(document.createElement('button'), { className: `btn btn-primary`, textContent: cfg.confirmText || 'Save' });
        confirm.onclick = async () => {
          confirm.disabled = true;
          confirm.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block"></div>';
          try { await cfg.onConfirm(ov); } catch (e) { console.error(e); }
          confirm.disabled = false;
          confirm.textContent = cfg.confirmText || 'Save';
        };
        footer.appendChild(confirm);
      }
    }
  }

  ov.querySelector('.modal-close').onclick = closeModal;
  ov.onclick = (e) => { if (e.target === ov) closeModal(); };
  document.addEventListener('keydown', onEsc);
  active = ov;
  return ov;
}

export function confirmDialog(cfg) {
  return new Promise(resolve => {
    const body = document.createElement('div');
    body.style.textAlign = 'center';
    body.innerHTML = `
      <div style="font-size:36px;margin-bottom:12px">${cfg.icon || '⚠️'}</div>
      <h3 style="font-size:16px;margin-bottom:8px;font-family:var(--font-head)">${cfg.title || 'Are you sure?'}</h3>
      <p style="font-size:13px;color:var(--text-3)">${cfg.message || 'This action cannot be undone.'}</p>`;
    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:8px;justify-content:center';
    const cancel = Object.assign(document.createElement('button'), { className: 'btn btn-secondary', textContent: 'Cancel' });
    const confirm = Object.assign(document.createElement('button'), { className: `btn ${cfg.confirmClass || 'btn-danger'}`, textContent: cfg.confirmText || 'Confirm' });
    cancel.onclick = () => { closeModal(); resolve(false); };
    confirm.onclick = () => { closeModal(); resolve(true); };
    footer.append(cancel, confirm);
    openModal({ title: cfg.title || 'Confirm', body, footer, size: 'sm' });
  });
}
