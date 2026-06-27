import { getUser } from '../js/utils/auth.js';
import { EMPLOYEE_HISTORY, SALARY_HISTORY, LEAVE_SUMMARY } from '../js/data.js';
import { formatDate, formatCurrency } from '../js/utils/helpers.js';

export async function renderMyInfo(container) {
  const user = getUser();
  const color = user?.avatarColor || '#3b82f6';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

  // Build year-by-year leave history from join date to now
  const joinYear = new Date(user?.joinDate || '2022-01-01').getFullYear();
  const currentYear = new Date().getFullYear();
  const yearRows = [];
  for (let y = joinYear; y <= currentYear; y++) {
    yearRows.push({ year: y, sick: { total: 12, used: y < currentYear ? 3 : 2, balance: y < currentYear ? 9 : 10 }, casual: { total: 12, used: y < currentYear ? 5 : 0.5, balance: y < currentYear ? 7 : 11.5 }, unpaid: y < currentYear ? 1 : 0 });
  }

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">My Info</h1><p class="page-subtitle">Your personal and professional details</p></div>
    </div>

    <div class="card" style="margin-bottom:16px;padding:24px">
      <div style="display:flex;align-items:center;gap:20px">
        <div class="avatar avatar-lg" style="background:${color}1a;color:${color};font-family:var(--font-head);width:60px;height:60px;font-size:22px">${initials}</div>
        <div style="flex:1">
          <div style="font-family:var(--font-head);font-size:20px;font-weight:700">${user?.name}</div>
          <div style="font-size:13px;color:var(--text-3);margin-top:3px">${user?.role} · ${user?.dept}</div>
          <div style="font-size:12px;color:var(--text-4);margin-top:4px">${user?.email}</div>
        </div>
        <div style="display:flex;gap:24px">
          <div style="text-align:right">
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Join Date</div>
            <div style="font-size:13px;font-weight:600;margin-top:3px">${formatDate(user?.joinDate)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Employee ID</div>
            <div style="font-size:13px;font-weight:600;font-family:var(--font-mono);margin-top:3px">EMP-${String(user?.id || 1).padStart(4,'0')}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="history">Employment History</button>
      <button class="tab-btn" data-tab="salary">Salary History</button>
      <button class="tab-btn" data-tab="leave-summary">Leave Summary</button>
    </div>

    <div class="tab-panel active" id="tab-history">
      <div class="card" style="padding:0">
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>Date</th><th>Event</th><th>Role</th><th>Department</th></tr></thead>
            <tbody>
              ${EMPLOYEE_HISTORY.map(h => `<tr>
                <td style="font-size:12px;color:var(--text-3)">${formatDate(h.date)}</td>
                <td><span class="badge ${h.event === 'Promotion' ? 'badge-green' : h.event === 'Joined' ? 'badge-blue' : 'badge-amber'}">${h.event}</span></td>
                <td style="font-weight:500">${h.role}</td>
                <td style="color:var(--text-3)">${h.dept}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="tab-panel" id="tab-salary">
      <div class="card" style="padding:0">
        <div class="table-wrap" style="border:none">
          <table>
            <thead><tr><th>Effective Date</th><th>Annual CTC</th><th>Monthly</th><th>Note</th></tr></thead>
            <tbody>
              ${SALARY_HISTORY.map(s => `<tr>
                <td style="font-size:12px;color:var(--text-3)">${formatDate(s.date)}</td>
                <td><span class="mono" style="color:var(--green);font-weight:600">${formatCurrency(s.amount)}</span></td>
                <td><span class="mono" style="color:var(--text-3)">${formatCurrency(Math.round(s.amount/12))}</span></td>
                <td style="color:var(--text-3)">${s.note}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="tab-panel" id="tab-leave-summary">
      <!-- Top: current year quick stats grid -->
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--red-dim);color:var(--red)">🤒</div>
          <div class="stat-value">${LEAVE_SUMMARY.sick.balance}</div>
          <div class="stat-label">Sick Balance</div>
          <div class="stat-sub">${LEAVE_SUMMARY.sick.used} used of ${LEAVE_SUMMARY.sick.total}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">✈</div>
          <div class="stat-value">${LEAVE_SUMMARY.casual.balance}</div>
          <div class="stat-label">Casual Balance</div>
          <div class="stat-sub">${LEAVE_SUMMARY.casual.used} used of ${LEAVE_SUMMARY.casual.total}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--amber-dim);color:var(--amber)">📊</div>
          <div class="stat-value">${LEAVE_SUMMARY.sick.used + LEAVE_SUMMARY.casual.used}</div>
          <div class="stat-label">Total Taken (${currentYear})</div>
          <div class="stat-sub">0 unpaid days</div>
        </div>
      </div>

      <!-- Year-by-year breakdown table -->
      <div class="card" style="padding:0">
        <div class="card-header" style="padding:14px 20px;border-bottom:1px solid var(--border)">
          <span class="card-title">Year-by-Year Leave History</span>
          <span style="font-size:12px;color:var(--text-3)">Since joining ${formatDate(user?.joinDate)}</span>
        </div>
        <div class="table-wrap" style="border:none">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Sick (Used / Total)</th>
                <th>Casual (Used / Total)</th>
                <th>Unpaid</th>
                <th>Total Taken</th>
              </tr>
            </thead>
            <tbody>
              ${yearRows.map((r, i) => `<tr ${i === yearRows.length - 1 ? 'style="background:rgba(59,130,246,0.04)"' : ''}>
                <td>
                  <span style="font-family:var(--font-mono);font-weight:600">${r.year}</span>
                  ${i === yearRows.length - 1 ? '<span class="badge badge-blue" style="margin-left:8px">Current</span>' : ''}
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="mono" style="color:var(--red)">${r.sick.used}</span>
                    <span style="color:var(--text-4)">/</span>
                    <span class="mono" style="color:var(--text-3)">${r.sick.total}</span>
                    <div class="progress-bar" style="width:60px;flex-shrink:0">
                      <div class="progress-fill" style="width:${Math.round((r.sick.used/r.sick.total)*100)}%;background:var(--red)"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="mono" style="color:var(--accent)">${r.casual.used}</span>
                    <span style="color:var(--text-4)">/</span>
                    <span class="mono" style="color:var(--text-3)">${r.casual.total}</span>
                    <div class="progress-bar" style="width:60px;flex-shrink:0">
                      <div class="progress-fill" style="width:${Math.round((r.casual.used/r.casual.total)*100)}%"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="mono" style="color:${r.unpaid > 0 ? 'var(--amber)' : 'var(--text-4)'}">${r.unpaid}</span>
                </td>
                <td>
                  <span class="mono" style="font-weight:600;color:var(--text-1)">${r.sick.used + r.casual.used + r.unpaid}</span>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
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
}
