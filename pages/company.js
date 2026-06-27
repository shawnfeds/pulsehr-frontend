// Company Page
import { PolicyAPI, HolidayAPI, EventAPI } from '../js/services/api.js';
import { formatDate, showLoading } from '../js/utils/helpers.js';
import { Toast } from '../js/utils/toast.js';

export async function renderCompany(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Company</h1>
        <p class="page-subtitle">Policies, holidays, and upcoming events</p>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="policies">Policies</button>
      <button class="tab-btn" data-tab="holidays">Holiday List</button>
      <button class="tab-btn" data-tab="events">Events</button>
    </div>

    <div class="tab-panel active" id="tab-policies">
      <div id="policies-content"></div>
    </div>
    <div class="tab-panel" id="tab-holidays">
      <div id="holidays-content"></div>
    </div>
    <div class="tab-panel" id="tab-events">
      <div id="events-content"></div>
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

  loadPolicies();
  loadHolidays();
  loadEvents();
}

async function loadPolicies() {
  const wrap = document.querySelector('#policies-content');
  const stop = showLoading(wrap);
  try {
    const { data } = await PolicyAPI.getAll();
    stop();
    wrap.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
        ${data.map(p => `
          <div class="card" style="display:flex;align-items:center;gap:14px;padding:16px">
            <div style="width:40px;height:48px;background:var(--red-light);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px">📄</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:13px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
              <div style="font-size:11px;color:var(--ink-40)">${p.category} · ${p.size}</div>
              <div style="font-size:11px;color:var(--ink-20);margin-top:2px">Updated ${formatDate(p.uploadedOn)}</div>
            </div>
            <button class="btn btn-ghost btn-icon" title="Download" onclick="alert('Download not available in demo')">↓</button>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    stop();
    wrap.innerHTML = '<p style="color:var(--red);padding:16px">Failed to load policies</p>';
  }
}

async function loadHolidays() {
  const wrap = document.querySelector('#holidays-content');
  const stop = showLoading(wrap);
  try {
    const { data } = await HolidayAPI.getAll();
    stop();
    const typeColors = { National: 'badge-green', Festival: 'badge-amber', Optional: 'badge-gray' };
    wrap.innerHTML = `
      <div class="card" style="padding:0">
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>#</th><th>Holiday</th><th>Date</th><th>Day</th><th>Type</th></tr></thead>
            <tbody>
              ${data.map((h, i) => {
                const d = new Date(h.date);
                return `
                  <tr>
                    <td style="color:var(--ink-40);font-size:12px">${i + 1}</td>
                    <td style="font-weight:500">${h.name}</td>
                    <td style="font-size:12px;color:var(--ink-60)">${formatDate(h.date)}</td>
                    <td style="font-size:12px;color:var(--ink-40)">${d.toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                    <td><span class="badge ${typeColors[h.type] || 'badge-gray'}">${h.type}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    stop();
    Toast.error('Failed to load holidays');
  }
}

async function loadEvents() {
  const wrap = document.querySelector('#events-content');
  const stop = showLoading(wrap);
  try {
    const { data } = await EventAPI.getAll();
    stop();
    const typeColors = { Meeting: 'badge-blue', Event: 'badge-purple', Social: 'badge-green' };
    wrap.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        ${data.map(e => `
          <div class="card" style="display:flex;align-items:center;gap:16px;padding:16px">
            <div style="text-align:center;min-width:48px">
              <div style="font-size:22px;font-weight:800;color:var(--accent);font-family:var(--font-mono);line-height:1">${new Date(e.date).getDate()}</div>
              <div style="font-size:10px;text-transform:uppercase;color:var(--ink-40);font-weight:600">${new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</div>
            </div>
            <div style="width:1px;height:40px;background:var(--ink-10)"></div>
            <div style="flex:1">
              <div style="font-weight:600;margin-bottom:3px">${e.name}</div>
              <div style="font-size:12px;color:var(--ink-40)">${e.description}</div>
            </div>
            <span class="badge ${typeColors[e.type] || 'badge-gray'}">${e.type}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    stop();
    Toast.error('Failed to load events');
  }
}
