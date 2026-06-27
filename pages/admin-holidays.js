// Admin Holidays & Events Page
import { HolidayAPI, EventAPI } from '../js/services/api.js';
import { formatDate, showLoading } from '../js/utils/helpers.js';
import { openModal, closeModal, confirmDialog } from '../js/utils/modal.js';
import { Toast } from '../js/utils/toast.js';

let holidays = [];
let events = [];

export async function renderHolidaysEvents(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Holidays & Events</h1>
        <p class="page-subtitle">Manage company calendar</p>
      </div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="holidays">Holidays</button>
      <button class="tab-btn" data-tab="events">Events</button>
    </div>
    <div class="tab-panel active" id="tab-holidays">
      <div class="page-header" style="margin-bottom:16px">
        <div></div>
        <button class="btn btn-primary btn-sm" id="add-holiday-btn">+ Add Holiday</button>
      </div>
      <div id="holidays-table"></div>
    </div>
    <div class="tab-panel" id="tab-events">
      <div class="page-header" style="margin-bottom:16px">
        <div></div>
        <button class="btn btn-primary btn-sm" id="add-event-btn">+ Add Event</button>
      </div>
      <div id="events-table"></div>
    </div>
  `;

  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      container.querySelector(`#tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  const stop = showLoading(container);
  try {
    const [hRes, eRes] = await Promise.all([HolidayAPI.getAll(), EventAPI.getAll()]);
    holidays = hRes.data;
    events = eRes.data;
    stop();
    renderHolidays();
    renderEvents();
  } catch (e) {
    stop();
    Toast.error('Failed to load data');
  }

  container.querySelector('#add-holiday-btn').addEventListener('click', openHolidayModal);
  container.querySelector('#add-event-btn').addEventListener('click', openEventModal);
}

function renderHolidays() {
  const typeColors = { National: 'badge-green', Festival: 'badge-amber', Optional: 'badge-gray' };
  document.querySelector('#holidays-table').innerHTML = `
    <div class="card" style="padding:0">
      <div class="table-wrap" style="border:none">
        <table>
          <thead><tr><th>Holiday</th><th>Date</th><th>Day</th><th>Type</th><th>Actions</th></tr></thead>
          <tbody>
            ${holidays.map(h => `
              <tr>
                <td style="font-weight:500">${h.name}</td>
                <td style="font-size:12px;color:var(--ink-60)">${formatDate(h.date)}</td>
                <td style="font-size:12px;color:var(--ink-40)">${new Date(h.date).toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                <td><span class="badge ${typeColors[h.type] || 'badge-gray'}">${h.type}</span></td>
                <td>
                  <button class="btn btn-ghost btn-icon btn-sm del-holiday-btn" data-id="${h.id}" style="color:var(--red)" title="Delete">✕</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.querySelectorAll('.del-holiday-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteHoliday(parseInt(btn.dataset.id)))
  );
}

function renderEvents() {
  const typeColors = { Meeting: 'badge-blue', Event: 'badge-purple', Social: 'badge-green' };
  document.querySelector('#events-table').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${events.map(e => `
        <div class="card" style="display:flex;align-items:center;gap:16px;padding:16px">
          <div style="text-align:center;min-width:52px">
            <div style="font-size:24px;font-weight:800;color:var(--accent);font-family:var(--font-mono);line-height:1">${new Date(e.date).getDate()}</div>
            <div style="font-size:10px;text-transform:uppercase;color:var(--ink-40);font-weight:600">${new Date(e.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
          </div>
          <div style="width:1px;height:40px;background:var(--ink-10)"></div>
          <div style="flex:1">
            <div style="font-weight:600;margin-bottom:3px">${e.name}</div>
            <div style="font-size:12px;color:var(--ink-40)">${e.description}</div>
          </div>
          <span class="badge ${typeColors[e.type] || 'badge-gray'}">${e.type}</span>
          <button class="btn btn-ghost btn-icon btn-sm del-event-btn" data-id="${e.id}" style="color:var(--red)" title="Delete">✕</button>
        </div>
      `).join('')}
    </div>
  `;
  document.querySelectorAll('.del-event-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteEvent(parseInt(btn.dataset.id)))
  );
}

function openHolidayModal() {
  const body = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">Holiday Name *</label>
        <input class="form-control" id="hol-name" placeholder="e.g. Diwali">
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input class="form-control" id="hol-date" type="date">
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-control" id="hol-type">
            <option value="National">National</option>
            <option value="Festival">Festival</option>
            <option value="Optional">Optional</option>
          </select>
        </div>
      </div>
    </div>
  `;
  openModal({
    title: 'Add Holiday',
    body,
    confirmText: 'Add Holiday',
    onConfirm: async () => {
      const name = document.querySelector('#hol-name').value.trim();
      const date = document.querySelector('#hol-date').value;
      const type = document.querySelector('#hol-type').value;
      if (!name || !date) { Toast.warning('Name and date are required'); return; }
      try {
        const { data } = await HolidayAPI.create({ name, date, type });
        holidays.push(data);
        holidays.sort((a, b) => new Date(a.date) - new Date(b.date));
        closeModal();
        renderHolidays();
        Toast.success('Holiday added');
      } catch (e) { Toast.error('Failed to add holiday'); }
    },
  });
}

function openEventModal() {
  const body = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">Event Name *</label>
        <input class="form-control" id="evt-name" placeholder="e.g. Team Outing">
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input class="form-control" id="evt-date" type="date">
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-control" id="evt-type">
            <option value="Meeting">Meeting</option>
            <option value="Event">Event</option>
            <option value="Social">Social</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-control" id="evt-desc" rows="2" style="resize:vertical" placeholder="Brief description…"></textarea>
      </div>
    </div>
  `;
  openModal({
    title: 'Add Event',
    body,
    confirmText: 'Add Event',
    onConfirm: async () => {
      const name = document.querySelector('#evt-name').value.trim();
      const date = document.querySelector('#evt-date').value;
      const type = document.querySelector('#evt-type').value;
      const description = document.querySelector('#evt-desc').value.trim();
      if (!name || !date) { Toast.warning('Name and date are required'); return; }
      try {
        const { data } = await EventAPI.create({ name, date, type, description });
        events.push(data);
        closeModal();
        renderEvents();
        Toast.success('Event added');
      } catch (e) { Toast.error('Failed to add event'); }
    },
  });
}

async function deleteHoliday(id) {
  const ok = await confirmDialog({ title: 'Delete Holiday', message: 'Remove this holiday?', icon: '🗑' });
  if (!ok) return;
  await HolidayAPI.delete(id);
  holidays = holidays.filter(h => h.id !== id);
  renderHolidays();
  Toast.success('Holiday removed');
}

async function deleteEvent(id) {
  const ok = await confirmDialog({ title: 'Delete Event', message: 'Remove this event?', icon: '🗑' });
  if (!ok) return;
  await EventAPI.delete(id);
  events = events.filter(e => e.id !== id);
  renderEvents();
  Toast.success('Event removed');
}
