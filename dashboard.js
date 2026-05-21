import { loadData, getStatus, getProductEOQ, getProductROP, timeAgo } from "./main.js";

let stockChart = null;

export function renderDashboard() {
  const { products, transactions } = loadData();

  // metrics
  const totalProducts = products.length;
  const totalValue = products.reduce((s, p) => s + p.stock * p.unitCost, 0);
  const criticalCount = products.filter(p => getStatus(p) === 'critical').length;
  const lowCount = products.filter(p => getStatus(p) === 'low').length;
  const alertCount = criticalCount + lowCount;

  document.getElementById('alert-count').textContent = alertCount;

  document.getElementById('metric-row').innerHTML = `
    <div class="metric-card green">
      <div class="metric-label">TOTAL PRODUCTS</div>
      <div class="metric-value green">${totalProducts}</div>
      <div class="metric-detail">active SKUs</div>
    </div>
    <div class="metric-card blue">
      <div class="metric-label">INVENTORY VALUE</div>
      <div class="metric-value blue">₱${totalValue.toLocaleString('en-PH', {minimumFractionDigits:0, maximumFractionDigits:0})}</div>
      <div class="metric-detail">at current stock</div>
    </div>
    <div class="metric-card yellow">
      <div class="metric-label">LOW STOCK</div>
      <div class="metric-value yellow">${lowCount}</div>
      <div class="metric-detail">products near threshold</div>
    </div>
    <div class="metric-card red">
      <div class="metric-label">CRITICAL</div>
      <div class="metric-value red">${criticalCount}</div>
      <div class="metric-detail">below 50% of minimum</div>
    </div>
  `;

  // stock chart
  const ctx = document.getElementById('stock-chart').getContext('2d');
  if (stockChart) stockChart.destroy();
  const pcts = products.map(p => Math.min(100, Math.round((p.stock / p.maxStock) * 100)));
  const colors = products.map(p => {
    const s = getStatus(p);
    return s === 'critical' ? '#ff5c5c' : s === 'low' ? '#f5c842' : '#4fffb0';
  });

  stockChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: products.map(p => p.name.length > 14 ? p.name.slice(0,14)+'…' : p.name),
      datasets: [{
        label: 'Stock %',
        data: pcts,
        backgroundColor: colors.map(c => c + '33'),
        borderColor: colors,
        borderWidth: 1.5,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0, max: 100,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#555a6e', font: { family: 'DM Mono', size: 10 }, callback: v => v+'%' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#555a6e', font: { family: 'DM Mono', size: 10 } }
        }
      }
    }
  });

  // tx list
  const txList = document.getElementById('tx-list');
  const recent = [...transactions].sort((a,b) => b.time - a.time).slice(0,5);
  document.getElementById('tx-count-tag').textContent = transactions.length + ' entries';
  if (!recent.length) { txList.innerHTML = '<div class="empty">No transactions yet</div>'; return; }
  txList.innerHTML = recent.map(t => {
    const p = products.find(x => x.id === t.productId);
    const name = p ? p.name : 'Unknown';
    const ago = timeAgo(t.time);
    return `
      <div class="tx-item">
        <div class="tx-dot" style="background:${t.type==='in'?'var(--accent)':'var(--red)'}"></div>
        <div class="tx-info">
          <div class="tx-name">${name}</div>
          <div class="tx-time">${t.note || '—'} · ${ago}</div>
        </div>
        <div class="tx-amount" style="color:${t.type==='in'?'var(--accent)':'var(--red)'}">${t.type==='in'?'+':'-'}${t.qty}</div>
      </div>`;
  }).join('');

  // overview table
  document.getElementById('overview-body').innerHTML = products.map(p => {
    const eoq = Math.round(getProductEOQ(p));
    const rop = getProductROP(p);
    const status = getStatus(p);
    const pct = Math.min(100, Math.round((p.stock / p.maxStock) * 100));
    const barColor = status === 'critical' ? 'var(--red)' : status === 'low' ? 'var(--yellow)' : 'var(--accent)';
    const pillClass = status === 'critical' ? 'pill-critical' : status === 'low' ? 'pill-low' : 'pill-ok';
    const pillText = status === 'critical' ? 'Critical' : status === 'low' ? 'Low Stock' : 'In Stock';
    return `
      <tr>
        <td><span style="font-weight:600">${p.name}</span><br><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${p.category}</span></td>
        <td class="mono-val">${p.stock.toLocaleString()} ${p.unit}s</td>
        <td class="mono-val text-yellow">${rop} ${p.unit}s</td>
        <td class="mono-val text-accent">${eoq} ${p.unit}s</td>
        <td><span class="status-pill ${pillClass}">${pillText}</span></td>
        <td>
          <div class="stock-bar-wrap">
            <div class="stock-bar-bg"><div class="stock-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
            <span class="mono-val" style="font-size:11px;color:var(--text3);min-width:32px">${pct}%</span>
          </div>
        </td>
      </tr>`;
  }).join('');
}