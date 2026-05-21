import { loadData, calcEOQ, calcROP, calcTotalCost } from "./main.js";

let costChart = null;

export function renderCalculatorSelects() {
  const { products } = loadData();
  const sel = document.getElementById('calc-product');
  sel.innerHTML = '<option value="">— manual entry —</option>' +
    products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

export function runEOQ() {
  const D = parseFloat(document.getElementById('calc-D').value);
  const S = parseFloat(document.getElementById('calc-S').value);
  const H = parseFloat(document.getElementById('calc-H').value);
  const L = parseFloat(document.getElementById('calc-L').value) || 0;
  const C = parseFloat(document.getElementById('calc-C').value) || 0;

  const eoq = calcEOQ(D, S, H);
  if (!eoq) {
    ['res-eoq','res-rop','res-orders','res-cycle','res-cost'].forEach(id => document.getElementById(id).textContent = '—');
    document.getElementById('cost-breakdown').innerHTML = '';
    return;
  }

  const Q = Math.round(eoq);
  const rop = calcROP(D, L);
  const ordersPerYear = Math.round(D / Q);
  const cycleDays = Math.round(365 / (D / Q));
  const costs = calcTotalCost(D, S, H, Q, C);

  document.getElementById('res-eoq').textContent = Q.toLocaleString();
  document.getElementById('res-rop').textContent = rop.toLocaleString();
  document.getElementById('res-orders').textContent = ordersPerYear;
  document.getElementById('res-cycle').textContent = cycleDays;
  document.getElementById('res-cost').textContent = '₱' + Math.round(costs.total).toLocaleString();

  document.getElementById('cost-breakdown').innerHTML = `
    <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:12px">
      <span style="color:var(--text3)">Ordering cost</span>
      <span style="color:var(--blue)">₱${Math.round(costs.orderCost).toLocaleString()}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:12px">
      <span style="color:var(--text3)">Holding cost</span>
      <span style="color:var(--yellow)">₱${Math.round(costs.holdingCost).toLocaleString()}</span>
    </div>
    ${C ? `<div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:12px">
      <span style="color:var(--text3)">Purchase cost</span>
      <span style="color:var(--text2)">₱${Math.round(costs.purchaseCost).toLocaleString()}</span>
    </div>` : ''}
  `;

  // cost chart
  const qVals = [];
  const orderCosts = [], holdCosts = [], totalCosts = [];
  const min = Math.max(10, Math.round(Q * 0.2));
  const max = Math.round(Q * 3);
  const step = Math.max(1, Math.round((max - min) / 30));
  for (let q = min; q <= max; q += step) {
    const c = calcTotalCost(D, S, H, q, 0);
    qVals.push(q);
    orderCosts.push(Math.round(c.orderCost));
    holdCosts.push(Math.round(c.holdingCost));
    totalCosts.push(Math.round(c.orderCost + c.holdingCost));
  }

  const ctx2 = document.getElementById('cost-chart').getContext('2d');
  if (costChart) costChart.destroy();
  costChart = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: qVals,
      datasets: [
        { label: 'Total Cost', data: totalCosts, borderColor: '#4fffb0', backgroundColor: 'rgba(79,255,176,0.05)', borderWidth: 2, pointRadius: 0, tension: 0.4 },
        { label: 'Ordering Cost', data: orderCosts, borderColor: '#5c9dff', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, tension: 0.4, borderDash: [4,4] },
        { label: 'Holding Cost', data: holdCosts, borderColor: '#f5c842', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, tension: 0.4, borderDash: [4,4] },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#8b90a4', font: { family: 'DM Mono', size: 11 }, boxWidth: 20, padding: 16 } },
        annotation: {}
      },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#555a6e', font: { family: 'DM Mono', size: 10 }, callback: v => '₱'+v.toLocaleString() } },
        x: { grid: { display: false }, ticks: { color: '#555a6e', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 8 } }
      }
    }
  });
}

export function loadProductIntoCalc() {
  const id = parseInt(document.getElementById('calc-product').value);
  if (!id) return;
  const { products } = loadData();
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('calc-D').value = p.demand;
  document.getElementById('calc-S').value = p.orderCost;
  document.getElementById('calc-H').value = p.holdingCost;
  document.getElementById('calc-L').value = p.leadTime;
  document.getElementById('calc-C').value = p.unitCost;
  runEOQ();
}