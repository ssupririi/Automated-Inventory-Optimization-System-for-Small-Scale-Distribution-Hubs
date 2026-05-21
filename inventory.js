import { loadData, getStatus, saveProducts, saveTx } from "./main.js";
import { updateAlertBadge } from "./alerts.js";

export function renderInventory() {
  const { products } = loadData();

  const sel = document.getElementById('tx-product');
  sel.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  document.getElementById('inv-body').innerHTML = products.map(p => {
    const pct = Math.min(100, Math.round((p.stock / p.maxStock) * 100));
    const barColor = getStatus(p) === 'critical' ? 'var(--red)' : getStatus(p) === 'low' ? 'var(--yellow)' : 'var(--accent)';
    return `
      <tr>
        <td><span style="font-weight:600">${p.name}</span></td>
        <td class="mono-val text-muted">${p.category}</td>
        <td class="mono-val text-muted">${p.unit}</td>
        <td class="mono-val" style="font-size:15px;font-weight:500;color:var(--text)">${p.stock.toLocaleString()}</td>
        <td class="mono-val text-yellow">${p.minStock.toLocaleString()}</td>
        <td class="mono-val text-muted">₱${p.unitCost.toLocaleString()}</td>
        <td>
          <div class="stock-bar-wrap">
            <div class="stock-bar-bg" style="min-width:80px"><div class="stock-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
            <span class="mono-val" style="font-size:11px;color:var(--text3);min-width:32px">${pct}%</span>
          </div>
        </td>
      </tr>`;
  }).join('');
}

export function submitTransaction() {
  const { products, transactions } = loadData();
  const productId = parseInt(document.getElementById('tx-product').value);
  const type = document.getElementById('tx-type').value;
  const qty = parseInt(document.getElementById('tx-qty').value);
  const note = document.getElementById('tx-note').value.trim();

  if (!qty || qty <= 0) { alert('Please enter a valid quantity.'); return; }

  const pIdx = products.findIndex(p => p.id === productId);
  if (pIdx === -1) return;

  if (type === 'out' && products[pIdx].stock < qty) {
    alert(`Insufficient stock. Current: ${products[pIdx].stock} units.`); return;
  }

  products[pIdx].stock += type === 'in' ? qty : -qty;
  transactions.unshift({ productId, type, qty, note, time: Date.now() });

  saveProducts(products);
  saveTx(transactions);
  clearTxForm();
  renderInventory();
  updateAlertBadge();
}

export function clearTxForm() {
  document.getElementById('tx-qty').value = '';
  document.getElementById('tx-note').value = '';
}