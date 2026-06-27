import { getUser } from '../js/utils/auth.js';
// Admin Policies Page
import { PolicyAPI } from '../js/services/api.js';
import { formatDate, showLoading } from '../js/utils/helpers.js';
import { openModal, closeModal, confirmDialog } from '../js/utils/modal.js';
import { Toast } from '../js/utils/toast.js';


let policies = [];

export async function renderAdminPolicies(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Policies</h1>
        <p class="page-subtitle">Upload and manage company documents</p>
      </div>
      <button class="btn btn-primary" id="upload-policy-btn">↑ Upload Policy</button>
    </div>
    <div class="filter-bar">
      <select class="form-control" id="policy-cat-filter" style="width:auto">
        <option value="">All Categories</option>
        <option value="HR">HR</option>
        <option value="IT">IT</option>
        <option value="Finance">Finance</option>
        <option value="Compliance">Compliance</option>
      </select>
    </div>
    <div id="policies-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px"></div>
  `;

  const stop = showLoading(container);
  try {
    const { data } = await PolicyAPI.getAll();
    policies = data;
    stop();
    renderPolicies();
  } catch (e) {
    stop();
    Toast.error('Failed to load policies');
  }

  container.querySelector('#upload-policy-btn').addEventListener('click', openUploadModal);
  container.querySelector('#policy-cat-filter').addEventListener('change', e => renderPolicies(e.target.value));
}

function renderPolicies(catFilter = '') {
  const filtered = catFilter ? policies.filter(p => p.category === catFilter) : policies;
  const grid = document.querySelector('#policies-grid');

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📄</div><h3>No policies</h3><p>Upload your first policy document</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="card" style="padding:16px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="width:44px;height:52px;background:var(--red-light);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px">📄</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px;margin-bottom:3px">${p.name}</div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="badge badge-blue">${p.category}</span>
            <span style="font-size:11px;color:var(--ink-40)">${p.size}</span>
          </div>
          <div style="font-size:11px;color:var(--ink-20);margin-top:4px">
            By ${p.uploadedBy} · ${formatDate(p.uploadedOn)}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid var(--ink-05)">
        <button class="btn btn-secondary btn-sm" style="flex:1" onclick="alert('Download not available in demo')">↓ Download</button>
        <button class="btn btn-ghost btn-icon btn-sm del-policy-btn" data-id="${p.id}" style="color:var(--red)" title="Delete">✕</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.del-policy-btn').forEach(btn =>
    btn.addEventListener('click', () => deletePolicy(parseInt(btn.dataset.id)))
  );
}

function openUploadModal() {
  const body = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">Policy Name *</label>
        <input class="form-control" id="pol-name" placeholder="e.g. Remote Work Policy 2024">
      </div>
      <div class="form-group">
        <label class="form-label">Category *</label>
        <select class="form-control" id="pol-cat">
          <option value="HR">HR</option>
          <option value="IT">IT</option>
          <option value="Finance">Finance</option>
          <option value="Compliance">Compliance</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Upload File</label>
        <div class="file-drop" id="file-drop-zone">
          <div class="file-drop-icon">📎</div>
          <p>Drag & drop or click to upload</p>
          <span>PDF, DOC, DOCX up to 10MB</span>
          <input type="file" id="pol-file" accept=".pdf,.doc,.docx" style="display:none">
        </div>
        <div id="file-name" style="font-size:12px;color:var(--ink-40);margin-top:6px"></div>
      </div>
    </div>
  `;

  const modal = openModal({
    title: 'Upload Policy',
    body,
    confirmText: 'Upload',
    onConfirm: savePolicy,
  });

  setTimeout(() => {
    const dropZone = document.querySelector('#file-drop-zone');
    const fileInput = document.querySelector('#pol-file');
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) {
        document.querySelector('#file-name').textContent = `Selected: ${e.target.files[0].name}`;
        dropZone.style.borderColor = 'var(--accent)';
      }
    });
    ['dragover', 'dragleave', 'drop'].forEach(ev => {
      dropZone.addEventListener(ev, e => {
        e.preventDefault();
        dropZone.classList.toggle('over', ev === 'dragover');
        if (ev === 'drop' && e.dataTransfer.files[0]) {
          document.querySelector('#file-name').textContent = `Selected: ${e.dataTransfer.files[0].name}`;
        }
      });
    });
  }, 50);
}

async function savePolicy() {
  const name = document.querySelector('#pol-name').value.trim();
  const category = document.querySelector('#pol-cat').value;
  const fileInput = document.querySelector('#pol-file');
  const file = fileInput?.files[0];

  if (!name) { Toast.warning('Policy name is required'); return; }

  const payload = {
    name, category,
    uploadedBy: getUser().name,
    uploadedOn: new Date().toISOString().split('T')[0],
    size: file ? `${Math.round(file.size / 1024)} KB` : '—',
    type: 'pdf',
  };

  try {
    const { data } = await PolicyAPI.create(payload);
    policies.unshift(data);
    closeModal();
    renderPolicies();
    Toast.success('Policy uploaded successfully');
  } catch (e) {
    Toast.error('Failed to upload policy');
  }
}

async function deletePolicy(id) {
  const confirmed = await confirmDialog({
    title: 'Delete Policy',
    message: 'This will permanently remove the policy document.',
    icon: '🗑',
  });
  if (!confirmed) return;
  try {
    await PolicyAPI.delete(id);
    policies = policies.filter(p => p.id !== id);
    renderPolicies();
    Toast.success('Policy deleted');
  } catch (e) {
    Toast.error('Failed to delete policy');
  }
}
