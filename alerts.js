import { loadData, getStatus, getProductEOQ, getProductROP } from "./main.js";

export function renderAlerts() {
  const { products } = loadData();
  const critical = products.filter(p => getStatus(p) === 'critical');
  const low = products.filter(p => getStatus(p) === 'low');
  const ok = products.filter(p => getStatus(p) === 'ok');

  document.getElementById('alert-summary-row').innerHTML = `
    <div class="metric-card red" style="flex:1;min-width:140px">
      <div class="metric-label">CRITICAL</div>
      <div class="metric-value red">${critical.length}</div>
      <div class="metric-detail">below 50% of min</div>
    </div>
    <div class="metric-card yellow" style="flex:1;min-width:140px">
      <div class="metric-label">LOW STOCK</div>
      <div class="metric-value yellow">${low.length}</div>
      <div class="metric-detail">at or below minimum</div>
    </div>
    <div class="metric-card green" style="flex:1;min-width:140px">
      <div class="metric-label">HEALTHY</div>
      <div class="metric-value green">${ok.length}</div>
      <div class="metric-detail">above threshold</div>
    </div>
  `;

  const allAlerts = [
    ...critical.map(p => ({ p, level: 'critical' })),
    ...low.map(p => ({ p, level: 'low' })),
  ];

  if (!allAlerts.length) {
    document.getElementById('alert-list').innerHTML = `
      <div class="panel-full">
        <div class="empty" style="padding:60px">
          <div style="font-size:32px;margin-bottom:12px">✓</div>
          All products are above their minimum thresholds.
        </div>
      </div>`;
    return;
  }

  document.getElementById('alert-list').innerHTML = allAlerts.map(({ p, level }) => {
    const eoq = Math.round(getProductEOQ(p));
    const rop = getProductROP(p);
    const needed = Math.max(0, p.minStock - p.stock + eoq);
    const color = level === 'critical' ? 'var(--red)' : 'var(--yellow)';
    const icon = level === 'critical' ? '⚠' : '↓';
    const label = level === 'critical' ? 'Critical — Order Immediately' : 'Low Stock — Plan Reorder';
    return `
      <div class="alert-card">
        <div class="alert-stripe" style="background:${color}"></div>
        <div class="alert-body">
          <div class="alert-icon" style="background:${color}22;color:${color};font-size:20px">${icon}</div>
          <div class="alert-info">
            <div class="alert-title">${p.name}</div>
            <div class="alert-desc">${p.category} · ${p.unit} · Current: ${p.stock} / Min: ${p.minStock} · ROP: ${rop}</div>
          </div>
          <div class="alert-meta" style="color:${color}">
            <div style="font-size:13px;font-weight:700">Order ${eoq} ${p.unit}s</div>
            <div style="color:var(--text3);margin-top:4px">EOQ recommendation</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

export function updateAlertBadge() {
  const { products } = loadData();
  const count = products.filter(p => getStatus(p) !== 'ok').length;
  document.getElementById('alert-count').textContent = count;
}