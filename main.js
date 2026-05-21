import * as eoqUtils from "./eoq.js";
import * as alertUtils from "./alerts.js";
import * as inventoryUtils from "./inventory.js";
import * as dashboardUtils from "./dashboard.js";

const SAMPLE_PRODUCTS = [
  { id: 1, name: "Bottled Water 500ml", category: "Beverages", unit: "case", stock: 280, minStock: 100, maxStock: 600, demand: 3600, orderCost: 350, holdingCost: 18, leadTime: 5, unitCost: 45 },
  { id: 2, name: "Canned Sardines", category: "Canned Goods", unit: "box", stock: 65, minStock: 80, maxStock: 400, demand: 1800, orderCost: 500, holdingCost: 22, leadTime: 7, unitCost: 85 },
  { id: 3, name: "Cooking Oil 1L", category: "Condiments", unit: "carton", stock: 40, minStock: 50, maxStock: 300, demand: 1200, orderCost: 450, holdingCost: 30, leadTime: 10, unitCost: 120 },
  { id: 4, name: "Instant Noodles", category: "Dry Goods", unit: "pack", stock: 520, minStock: 200, maxStock: 1000, demand: 6000, orderCost: 300, holdingCost: 10, leadTime: 3, unitCost: 20 },
  { id: 5, name: "Laundry Detergent", category: "Household", unit: "sack", stock: 28, minStock: 30, maxStock: 150, demand: 720, orderCost: 600, holdingCost: 35, leadTime: 14, unitCost: 180 },
  { id: 6, name: "White Rice 25kg", category: "Staples", unit: "bag", stock: 95, minStock: 50, maxStock: 300, demand: 2400, orderCost: 800, holdingCost: 40, leadTime: 7, unitCost: 1050 },
];

const SAMPLE_TX = [
  { productId: 1, type: "in", qty: 120, note: "PO-2024-031", time: Date.now() - 3600000 * 2 },
  { productId: 4, type: "out", qty: 80, note: "DR-0178", time: Date.now() - 3600000 * 5 },
  { productId: 2, type: "out", qty: 15, note: "DR-0177", time: Date.now() - 3600000 * 8 },
  { productId: 6, type: "in", qty: 20, note: "PO-2024-030", time: Date.now() - 3600000 * 26 },
  { productId: 3, type: "out", qty: 10, note: "DR-0176", time: Date.now() - 3600000 * 30 },
];

export function loadData() {
  const p = localStorage.getItem('iq_products');
  const t = localStorage.getItem('iq_transactions');
  if (!p) {
    localStorage.setItem('iq_products', JSON.stringify(SAMPLE_PRODUCTS));
    localStorage.setItem('iq_transactions', JSON.stringify(SAMPLE_TX));
  }
  return {
    products: JSON.parse(localStorage.getItem('iq_products')),
    transactions: JSON.parse(localStorage.getItem('iq_transactions'))
  };
}

export function saveProducts(products) {
  localStorage.setItem('iq_products', JSON.stringify(products));
}

export function saveTx(transactions) {
  localStorage.setItem('iq_transactions', JSON.stringify(transactions));
}

// ─── EOQ ENGINE ─────────────────────────────────────────────────────────────

export function calcEOQ(D, S, H) {
  if (!D || !S || !H || D <= 0 || S <= 0 || H <= 0) return null;
  return Math.sqrt((2 * D * S) / H);
}

export function calcROP(D, L) {
  const dailyDemand = D / 365;
  return Math.ceil(dailyDemand * L);
}

export function calcTotalCost(D, S, H, Q, C) {
  const orderCost = (D / Q) * S;
  const holdingCost = (Q / 2) * H;
  const purchaseCost = D * (C || 0);
  return { orderCost, holdingCost, purchaseCost, total: orderCost + holdingCost + purchaseCost };
}

export function getProductEOQ(p) {
  return calcEOQ(p.demand, p.orderCost, p.holdingCost);
}

export function getProductROP(p) {
  return calcROP(p.demand, p.leadTime);
}

export function getStatus(p) {
  if (p.stock <= p.minStock * 0.5) return 'critical';
  if (p.stock <= p.minStock) return 'low';
  return 'ok';
}

// ─── NAVIGATION ─────────────────────────────────────────────────────────────

const pageMeta = {
  dashboard: { title: 'Dashboard', sub: 'Real-time inventory overview' },
  inventory:  { title: 'Inventory Management', sub: 'Track incoming & outgoing stock' },
  calculator: { title: 'EOQ Calculator', sub: 'Economic Order Quantity optimizer' },
  alerts:     { title: 'Reorder Alerts', sub: 'Products below minimum threshold' },
};

export function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); });

  const navEl = document.querySelector(`.nav-item[onclick="navigate('${page}')"]`);
  if (navEl) navEl.classList.add('active');

  const screen = document.getElementById('screen-' + page);
  if (screen) { screen.classList.add('active', 'fade-in'); }

  document.getElementById('page-title').textContent = pageMeta[page].title;
  document.getElementById('page-sub').textContent = pageMeta[page].sub;

  if (page === 'dashboard') dashboardUtils.renderDashboard();
  if (page === 'inventory') inventoryUtils.renderInventory();
  if (page === 'calculator') eoqUtils.renderCalculatorSelects();
  if (page === 'alerts') alertUtils.renderAlerts();
}

// ─── CLOCK ──────────────────────────────────────────────────────────────────

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

setInterval(updateClock, 1000);
updateClock();

// ─── DASHBOARD ──────────────────────────────────────────────────────────────



// ─── INVENTORY ───────────────────────────────────────────────────────────────



// ─── EOQ CALCULATOR ──────────────────────────────────────────────────────────



// ─── ALERTS ──────────────────────────────────────────────────────────────────



// ─── UTILS ───────────────────────────────────────────────────────────────────

export function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.round(diff/60) + 'm ago';
  if (diff < 86400) return Math.round(diff/3600) + 'h ago';
  return Math.round(diff/86400) + 'd ago';
}

// ─── INIT ────────────────────────────────────────────────────────────────────

loadData();
dashboardUtils.renderDashboard();
alertUtils.updateAlertBadge();

// Make functions globally available for HTML onclick/oninput handlers
window.navigate = navigate;
window.submitTransaction = inventoryUtils.submitTransaction;
window.clearTxForm = inventoryUtils.clearTxForm;
window.runEOQ = eoqUtils.runEOQ;
window.loadProductIntoCalc = eoqUtils.loadProductIntoCalc;