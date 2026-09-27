const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const numberFormat = (value, digits = 0) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits }).format(Number(value) || 0);
const todayISO = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const dateLabel = (value, options = { day: 'numeric', month: 'short' }) => value ? new Intl.DateTimeFormat('id-ID', options).format(new Date(`${value.slice(0, 10)}T12:00:00`)) : '—';
const flowerFallback = 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=160&q=75';
const productPhotoBySku = {
  'FL-ROS-01': '1494972308805-463bc619d34e',
  'FL-TUL-02': '1520763185298-1b434c919102',
  'FL-PEO-03': '1563241527-3004b7be0ffd',
  'FL-SUN-04': '1470509037663-253afd7f0f51',
  'FL-EUC-05': '1518709268805-4e9042af9f23',
  'FL-MIX-06': '1526047932273-341f2a7631f9'
};
const FILE_MODE = location.protocol === 'file:';
const LOCAL_STORAGE_KEY = `jiva-florist-demo:${location.pathname}:v1`;
let localStorageAvailable = true;
const demoDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const fileDemoData = {
  mode: 'local-demo',
  products: [
    ['FL-ROS-01', 'Mawar merah', 'Mawar', 'batang', 18000, 2500, 7500, 20, 38, '1494972308805-463bc619d34e'],
    ['FL-TUL-02', 'Tulip pastel', 'Tulip', 'batang', 32000, 3000, 14000, 12, 18, '1520763185298-1b434c919102'],
    ['FL-PEO-03', 'Peony blush', 'Peony', 'batang', 45000, 4000, 21000, 8, 7, '1563241527-3004b7be0ffd'],
    ['FL-SUN-04', 'Sunflower cerah', 'Bunga musiman', 'batang', 22000, 2500, 9000, 10, 22, '1470509037663-253afd7f0f51'],
    ['FL-EUC-05', 'Eucalyptus', 'Filler', 'batang', 12000, 1500, 4000, 15, 31, '1518709268805-4e9042af9f23'],
    ['FL-MIX-06', 'Buket meadow', 'Rangkaian', 'buket', 285000, 18000, 122000, 4, 6, '1526047932273-341f2a7631f9']
  ].map(([sku, name, category, unit, selling_price, estimated_selling_cost, average_unit_cost, minimum_stock, stock_on_hand, photo], index) => ({
    id: `local-${index + 1}`, sku, name, category, unit, selling_price, estimated_selling_cost, average_unit_cost,
    minimum_stock, stock_on_hand, inventory_value: stock_on_hand * average_unit_cost,
    estimated_nrv_per_unit: selling_price - estimated_selling_cost,
    image_url: `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=800&q=85`,
    active: true, nrv_review_required: false
  })),
  transactions: [],
  movements: []
};
fileDemoData.transactions = [
  { transaction_type: 'sale', product_id: 'local-6', quantity: 1, revenue_amount: 285000, material_cost: 122000, labor_cost: 30000, overhead_cost: 12000, description: 'Pesanan buket wisuda', transaction_date: demoDate(0) },
  { transaction_type: 'sale', product_id: 'local-1', quantity: 12, revenue_amount: 210000, material_cost: 90000, labor_cost: 10000, overhead_cost: 5000, description: 'Mawar merah pilihan', transaction_date: demoDate(0) },
  { transaction_type: 'expense', expense_category: 'Kemasan', expense_amount: 85000, description: 'Kertas dan pita', transaction_date: demoDate(1) },
  { transaction_type: 'sale', product_id: 'local-2', quantity: 5, revenue_amount: 160000, material_cost: 70000, description: 'Tulip pastel', transaction_date: demoDate(1) },
  { transaction_type: 'expense', expense_category: 'Pengiriman', expense_amount: 120000, description: 'Ongkos kirim pemasok', transaction_date: demoDate(2) },
  { transaction_type: 'sale', product_id: 'local-4', quantity: 8, revenue_amount: 176000, material_cost: 72000, description: 'Sunflower cerah', transaction_date: demoDate(2) },
  { transaction_type: 'expense', expense_category: 'Operasional', expense_amount: 250000, description: 'Biaya operasional toko', transaction_date: demoDate(3) }
].map((row, index) => ({ id: `local-tx-${index + 1}`, ...row }));
function saveFileDemoData() {
  if (!FILE_MODE) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ products: fileDemoData.products, transactions: fileDemoData.transactions, movements: fileDemoData.movements }));
    localStorageAvailable = true;
  } catch {
    localStorageAvailable = false;
    throw new Error('Penyimpanan browser tidak tersedia. Coba gunakan browser biasa dan jangan mode privat.');
  }
}
function restoreFileDemoData() {
  if (!FILE_MODE) return;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.transactions) && Array.isArray(parsed.movements)) {
        fileDemoData.products = parsed.products;
        fileDemoData.products.forEach((product) => {
          const photo = productPhotoBySku[product.sku];
          if (photo) product.image_url = `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=800&q=85`;
        });
        fileDemoData.transactions = parsed.transactions;
        fileDemoData.movements = parsed.movements;
      }
    }
    saveFileDemoData();
  } catch {
    localStorageAvailable = false;
  }
}
restoreFileDemoData();
let appData = FILE_MODE ? fileDemoData : { mode: 'demo', products: [], transactions: [], movements: [] };
let activePage = 'dashboard';

async function api(path, body) {
  if (FILE_MODE) return localDemoApi(path, body);
  const response = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Permintaan tidak dapat diproses.');
  return result;
}
function localDemoApi(path, body = {}) {
  if (path === '/api/data') return structuredClone(fileDemoData);
  const product = fileDemoData.products.find((item) => item.id === body.product_id);
  const addMovement = (values) => fileDemoData.movements.unshift({ id: `local-move-${Date.now()}`, created_at: new Date().toISOString(), ...values });
  if (path === '/api/products') {
    if (fileDemoData.products.some((item) => item.sku.toLowerCase() === String(body.sku).toLowerCase())) throw new Error('Kode SKU sudah digunakan.');
    const item = { ...body, id: `local-${Date.now()}`, average_unit_cost: 0, stock_on_hand: 0, inventory_value: 0, estimated_nrv_per_unit: Number(body.selling_price) - Number(body.estimated_selling_cost || 0), active: true };
    fileDemoData.products.push(item);
    saveFileDemoData();
    return item;
  }
  if (path === '/api/expenses') {
    const row = { id: `local-tx-${Date.now()}`, transaction_type: 'expense', transaction_date: body.transaction_date || todayISO(), expense_amount: Number(body.amount), expense_category: body.category || 'Operasional', description: body.note || '' };
    if (!(row.expense_amount > 0)) throw new Error('Nominal biaya harus lebih besar dari nol.');
    fileDemoData.transactions.unshift(row);
    saveFileDemoData();
    return row;
  }
  if (!product) throw new Error('Pilih produk yang tersedia.');
  if (path === '/api/purchase') {
    const quantity = Number(body.quantity), unitCost = Number(body.unit_cost), oldStock = Number(product.stock_on_hand);
    if (!(quantity > 0) || unitCost < 0) throw new Error('Jumlah dan biaya pembelian tidak valid.');
    product.average_unit_cost = Math.round((oldStock * product.average_unit_cost + quantity * unitCost) / (oldStock + quantity));
    product.stock_on_hand = oldStock + quantity;
    product.inventory_value = product.stock_on_hand * product.average_unit_cost;
    addMovement({ product_id: product.id, movement_type: 'purchase', quantity_delta: quantity, unit_cost: unitCost, total_cost: quantity * unitCost, movement_date: body.transaction_date || todayISO(), notes: body.note || '' });
    saveFileDemoData();
    return { ok: true };
  }
  if (path === '/api/adjustment') {
    const delta = Number(body.quantity_delta);
    if (!delta || product.stock_on_hand + delta < 0) throw new Error('Penyesuaian stok tidak valid.');
    product.stock_on_hand += delta;
    product.inventory_value = product.stock_on_hand * product.average_unit_cost;
    addMovement({ product_id: product.id, movement_type: 'adjustment', quantity_delta: delta, unit_cost: product.average_unit_cost, total_cost: Math.abs(delta) * product.average_unit_cost, movement_date: todayISO(), notes: body.note || '' });
    saveFileDemoData();
    return { ok: true };
  }
  if (path === '/api/sales') {
    const quantity = Number(body.quantity), price = Number(body.unit_price), discount = Number(body.discount || 0), gross = quantity * price;
    if (!(quantity > 0) || price < 0 || discount < 0 || discount > gross || quantity > product.stock_on_hand) throw new Error('Jumlah, diskon, atau stok penjualan tidak valid.');
    const revenue = gross - discount;
    const row = { id: `local-tx-${Date.now()}`, transaction_type: 'sale', product_id: product.id, transaction_date: body.transaction_date || todayISO(), quantity, unit_price: price, discount_amount: discount, revenue_amount: revenue, material_cost: Math.round(quantity * product.average_unit_cost), labor_cost: Number(body.labor_cost || 0), overhead_cost: Number(body.overhead_cost || 0), ppn_amount: Math.round(revenue * Number(body.ppn_rate || 0) / 100), pph_final_estimate: Math.round(revenue * Number(body.pph_final_rate || 0) / 100), description: body.note || '' };
    fileDemoData.transactions.unshift(row);
    product.stock_on_hand -= quantity;
    product.inventory_value = product.stock_on_hand * product.average_unit_cost;
    addMovement({ product_id: product.id, movement_type: 'sale', quantity_delta: -quantity, unit_cost: product.average_unit_cost, total_cost: row.material_cost, transaction_id: row.id, movement_date: row.transaction_date, notes: row.description || 'Penjualan' });
    saveFileDemoData();
    return row;
  }
  throw new Error('Operasi tidak dikenali.');
}
function sortedTransactions(rows = appData.transactions) { return [...rows].sort((a, b) => String(b.transaction_date).localeCompare(String(a.transaction_date)) || String(b.created_at || '').localeCompare(String(a.created_at || ''))); }
function productFor(row) { return appData.products.find((product) => product.id === row.product_id); }
function saleProfit(row) { return Number(row.revenue_amount || 0) - Number(row.material_cost || 0) - Number(row.labor_cost || 0) - Number(row.overhead_cost || 0); }
function salesInPeriod(period) {
  const now = new Date();
  return appData.transactions.filter((row) => {
    if (period === 'all') return true;
    const date = new Date(`${row.transaction_date}T12:00:00`);
    if (period === 'last-month') { const month = new Date(now.getFullYear(), now.getMonth() - 1, 1); return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear(); }
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
}
function periodTotals(rows) {
  const sales = rows.filter((row) => row.transaction_type === 'sale');
  const expenses = rows.filter((row) => row.transaction_type === 'expense');
  const revenue = sales.reduce((sum, row) => sum + Number(row.revenue_amount || 0), 0);
  const materials = sales.reduce((sum, row) => sum + Number(row.material_cost || 0), 0);
  const labor = sales.reduce((sum, row) => sum + Number(row.labor_cost || 0), 0);
  const overhead = sales.reduce((sum, row) => sum + Number(row.overhead_cost || 0), 0);
  const otherExpenses = expenses.reduce((sum, row) => sum + Number(row.expense_amount || 0), 0);
  const grossProfit = revenue - materials;
  const operatingProfit = grossProfit - labor - overhead - otherExpenses;
  const taxEstimate = sales.reduce((sum, row) => sum + Number(row.pph_final_estimate || 0), 0);
  return { sales, expenses, revenue, materials, labor, overhead, otherExpenses, grossProfit, operatingProfit, taxEstimate, afterTax: operatingProfit - taxEstimate };
}
function metricCard(label, value, foot, icon, tone = '') { return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon ${tone}">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></article>`; }
function renderMetrics(container, rows) {
  const totals = periodTotals(rows);
  const lowStock = appData.products.filter((item) => Number(item.stock_on_hand) <= Number(item.minimum_stock)).length;
  container.innerHTML = [
    metricCard('Penjualan bersih', rupiah(totals.revenue), `${totals.sales.length} transaksi penjualan`, '↗'),
    metricCard('Profit kotor', rupiah(totals.grossProfit), 'Penjualan dikurangi biaya bahan', '✿', 'pink'),
    metricCard('Profit setelah biaya', rupiah(totals.afterTax), 'Setelah biaya langsung & operasional', '⌁', 'gold'),
    metricCard('Produk aktif', numberFormat(appData.products.length), `${lowStock} produk perlu restok`, '▦', 'gray')
  ].join('');
}
function renderRecent() {
  const rows = sortedTransactions().slice(0, 6);
  document.querySelector('#recentTransactions').innerHTML = rows.length ? rows.map((row) => {
    const sale = row.transaction_type === 'sale';
    const title = sale ? (productFor(row)?.name || 'Penjualan') : (row.expense_category || 'Biaya operasional');
    const value = sale ? row.revenue_amount : row.expense_amount;
    return `<tr><td class="table-primary">${escapeHtml(title)}<span class="table-secondary">${escapeHtml(row.description || (sale ? `${numberFormat(row.quantity, 2)} unit` : 'Biaya usaha'))}</span></td><td>${dateLabel(row.transaction_date)}</td><td><span class="transaction-kind ${sale ? '' : 'expense'}">${sale ? 'Penjualan' : 'Biaya'}</span></td><td class="align-right ${sale ? 'positive-value' : 'negative-value'}">${sale ? '+' : '−'}${rupiah(value)}</td></tr>`;
  }).join('') : '<tr><td colspan="4" class="empty-state">Belum ada transaksi.</td></tr>';
}
function renderAttention() {
  const low = appData.products.filter((item) => Number(item.stock_on_hand) <= Number(item.minimum_stock));
  const nrv = appData.products.filter((item) => item.nrv_review_required && !low.some((other) => other.id === item.id));
  const items = [...low.map((item) => ({ ...item, reason: 'low' })), ...nrv.map((item) => ({ ...item, reason: 'nrv' }))].slice(0, 4);
  document.querySelector('#attentionList').innerHTML = items.length ? items.map((item) => `<div class="attention-item"><img class="mini-flower" src="${escapeHtml(item.image_url || flowerFallback)}" alt="${escapeHtml(item.name)}" onerror="this.src='${flowerFallback}'"><div class="attention-copy"><strong>${escapeHtml(item.name)}</strong><small>${item.reason === 'low' ? `${numberFormat(item.stock_on_hand, 2)} ${escapeHtml(item.unit)} tersisa` : `Biaya ${rupiah(item.average_unit_cost)} / NRV ${rupiah(item.estimated_nrv_per_unit)}`}</small></div><span class="status-pill ${item.reason === 'low' ? 'critical' : ''}">${item.reason === 'low' ? 'Restok' : 'Tinjau NRV'}</span></div>`).join('') : '<div class="empty-state">Semua stok aman. Tidak ada tinjauan NRV yang tertunda.</div>';
}
function chartRows(days) {
  const rows = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(); date.setDate(date.getDate() - offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const sales = appData.transactions.filter((row) => row.transaction_type === 'sale' && row.transaction_date === key);
    rows.push({ key, label: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date), revenue: sales.reduce((sum, row) => sum + Number(row.revenue_amount || 0), 0), profit: sales.reduce((sum, row) => sum + saleProfit(row), 0) });
  }
  return rows;
}
function drawChart() {
  const canvas = document.querySelector('#revenueChart');
  const days = Number(document.querySelector('#chartRange').value);
  const data = chartRows(days);
  document.querySelector('#chartAxis').style.gridTemplateColumns = `repeat(${data.length}, 1fr)`;
  document.querySelector('#chartAxis').innerHTML = data.map((row, i) => `<span>${days > 7 && i % 5 !== 0 && i !== data.length - 1 ? '' : row.label}</span>`).join('');
  const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
  const ratio = window.devicePixelRatio || 1; canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
  const context = canvas.getContext('2d'); context.scale(ratio, ratio);
  const width = rect.width, height = rect.height, pad = { top: 12, right: 8, bottom: 8, left: 38 };
  const chartWidth = width - pad.left - pad.right, chartHeight = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((row) => row.revenue)) * 1.15;
  context.font = '9px DM Sans, sans-serif'; context.textAlign = 'right';
  for (let line = 0; line < 4; line++) {
    const y = pad.top + chartHeight * line / 3;
    context.beginPath(); context.moveTo(pad.left, y); context.lineTo(width - pad.right, y); context.strokeStyle = '#f3e8ed'; context.stroke();
    const tick = max * (1 - line / 3); context.fillStyle = '#9aa29c'; context.fillText(tick >= 1000000 ? `${(tick / 1000000).toFixed(1)} jt` : `${Math.round(tick / 1000)} rb`, pad.left - 7, y + 3);
  }
  const step = chartWidth / data.length, barWidth = Math.min(12, Math.max(3, step * .28));
  data.forEach((row, i) => {
    const center = pad.left + step * (i + .5), revenueHeight = row.revenue / max * chartHeight, profitHeight = Math.max(0, row.profit) / max * chartHeight;
    context.fillStyle = '#b84370'; context.beginPath(); context.roundRect(center - barWidth - 1, pad.top + chartHeight - revenueHeight, barWidth, Math.max(2, revenueHeight), 3); context.fill();
    context.fillStyle = '#e3a0b8'; context.beginPath(); context.roundRect(center + 1, pad.top + chartHeight - profitHeight, barWidth, Math.max(2, profitHeight), 3); context.fill();
  });
}
function renderInventory() {
  const query = document.querySelector('#inventorySearch').value.trim().toLowerCase(), filter = document.querySelector('#stockFilter').value;
  const items = appData.products.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query) && (filter === 'low' ? Number(item.stock_on_hand) <= Number(item.minimum_stock) : filter === 'nrv' ? item.nrv_review_required : true));
  document.querySelector('#inventoryEmpty').classList.toggle('hidden', Boolean(items.length));
  document.querySelector('#inventoryRows').innerHTML = items.map((item) => {
    const low = Number(item.stock_on_hand) <= Number(item.minimum_stock);
    const status = item.nrv_review_required ? '<span class="status-pill">Tinjau NRV</span>' : low ? '<span class="status-pill critical">Stok menipis</span>' : '<span class="status-pill good">Tersedia</span>';
    return `<tr><td><div class="product-cell"><img src="${escapeHtml(item.image_url || flowerFallback)}" alt="${escapeHtml(item.name)}" onerror="this.src='${flowerFallback}'"><div class="table-primary">${escapeHtml(item.name)}<span class="table-secondary">${escapeHtml(item.category)}</span></div></div></td><td>${escapeHtml(item.sku)}</td><td><div class="stock-cell"><strong>${numberFormat(item.stock_on_hand, 2)} ${escapeHtml(item.unit)}</strong><small>Min. ${numberFormat(item.minimum_stock, 2)} ${escapeHtml(item.unit)}</small></div></td><td>${rupiah(item.average_unit_cost)}<span class="table-secondary">per ${escapeHtml(item.unit)}</span></td><td class="table-primary">${rupiah(item.inventory_value)}</td><td>${status}</td><td><button class="row-action" data-purchase-product="${escapeHtml(item.id)}" title="Catat pembelian untuk ${escapeHtml(item.name)}">＋ Beli</button></td></tr>`;
  }).join('');
}
function breakdownRow(label, value, max, tone = '') {
  const width = max > 0 ? Math.max(value > 0 ? 2 : 0, value / max * 100) : 0;
  return `<div class="breakdown-row"><span>${label}</span><div class="breakdown-track"><div class="breakdown-bar ${tone}" style="width:${Math.min(100, width)}%"></div></div><strong>${rupiah(value)}</strong></div>`;
}
function renderReports() {
  const totals = periodTotals(salesInPeriod(document.querySelector('#reportRange').value));
  renderMetrics(document.querySelector('#reportMetrics'), [...totals.sales, ...totals.expenses]);
  const max = Math.max(1, totals.revenue);
  document.querySelector('#profitBreakdown').innerHTML = breakdownRow('Penjualan bersih', totals.revenue, max) + breakdownRow('Biaya bahan', totals.materials, max, 'cost') + breakdownRow('Tenaga kerja', totals.labor, max, 'cost') + breakdownRow('Overhead produksi', totals.overhead, max, 'expense') + breakdownRow('Biaya operasional', totals.otherExpenses, max, 'expense');
  document.querySelector('#profitSummary').innerHTML = `<div class="summary-line"><span>Penjualan bersih</span><strong>${rupiah(totals.revenue)}</strong></div><div class="summary-line"><span>(−) Biaya bahan / HPP</span><strong>${rupiah(totals.materials)}</strong></div><div class="summary-line"><span>Profit kotor</span><strong>${rupiah(totals.grossProfit)}</strong></div><div class="summary-line"><span>(−) Tenaga kerja & overhead</span><strong>${rupiah(totals.labor + totals.overhead)}</strong></div><div class="summary-line"><span>(−) Biaya operasional</span><strong>${rupiah(totals.otherExpenses)}</strong></div><div class="summary-line"><span>(−) Estimasi PPh final</span><strong>${rupiah(totals.taxEstimate)}</strong></div><div class="summary-line total"><span>Profit setelah estimasi PPh</span><strong>${rupiah(totals.afterTax)}</strong></div><p class="summary-note">PPN diperlakukan sebagai pungutan terpisah dan tidak mengurangi laba. Estimasi PPh dihitung dari tarif yang Anda masukkan; pastikan rezim dan kelayakan pajak dengan konsultan.</p>`;
  const rows = sortedTransactions([...totals.sales, ...totals.expenses]).slice(0, 100);
  document.querySelector('#reportRows').innerHTML = rows.length ? rows.map((row) => {
    const sale = row.transaction_type === 'sale', profit = sale ? saleProfit(row) : -Number(row.expense_amount || 0);
    const subject = sale ? (productFor(row)?.name || 'Penjualan') : (row.expense_category || 'Biaya operasional'), amount = sale ? row.revenue_amount : row.expense_amount;
    return `<tr><td>${dateLabel(row.transaction_date, { day: 'numeric', month: 'short', year: 'numeric' })}</td><td class="table-primary">${escapeHtml(subject)}<span class="table-secondary">${escapeHtml(row.description || (sale ? `${numberFormat(row.quantity, 2)} unit` : ''))}</span></td><td><span class="transaction-kind ${sale ? '' : 'expense'}">${sale ? 'Penjualan' : 'Biaya operasional'}</span></td><td class="align-right">${rupiah(amount)}</td><td class="align-right ${profit >= 0 ? 'positive-value' : 'negative-value'}">${rupiah(profit)}</td></tr>`;
  }).join('') : '<tr><td colspan="5" class="empty-state">Belum ada transaksi untuk periode ini.</td></tr>';
}
function renderAll() {
  const badge = document.querySelector('#modeBadge');
  document.querySelector('#todayLabel').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  badge.textContent = appData.mode === 'supabase' ? 'Supabase aktif' : FILE_MODE ? (localStorageAvailable ? 'Demo lokal' : 'Demo sementara') : 'Mode demo'; badge.classList.toggle('connected', appData.mode === 'supabase');
  badge.title = FILE_MODE && localStorageAvailable ? 'Data tersimpan di browser ini, tidak tersinkron ke Supabase.' : '';
  renderMetrics(document.querySelector('#metricGrid'), salesInPeriod('month')); renderRecent(); renderAttention(); renderInventory(); renderReports(); drawChart();
}
async function refreshData() { appData = await api('/api/data'); renderAll(); }
function showToast(message, isError = false) {
  const toast = document.createElement('div'); toast.className = `toast${isError ? ' error' : ''}`; toast.textContent = message;
  document.querySelector('#toastRegion').append(toast); window.setTimeout(() => toast.remove(), 3600);
}
function setPage(page) {
  activePage = page;
  document.querySelectorAll('.page-view').forEach((section) => section.classList.toggle('active', section.id === `page-${page}`));
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.page === page));
  document.querySelector('#pageCrumb').textContent = { dashboard: 'Ringkasan', inventory: 'Persediaan', reports: 'Profitabilitas' }[page] || 'Ringkasan';
  document.querySelector('#sidebar').classList.remove('open'); if (page === 'dashboard') drawChart();
}
function field(label, name, type = 'text', options = {}) {
  const required = options.required ? ' required' : '', step = options.step ? ` step="${options.step}"` : '';
  const min = options.min !== undefined ? ` min="${options.min}"` : '', max = options.max !== undefined ? ` max="${options.max}"` : '';
  const control = type === 'select'
    ? `<select id="field-${name}" name="${name}"${required}>${options.choices.map((choice) => `<option value="${escapeHtml(choice.value)}">${escapeHtml(choice.label)}</option>`).join('')}</select>`
    : `<input id="field-${name}" name="${name}" type="${type}" placeholder="${escapeHtml(options.placeholder || '')}"${required}${step}${min}${max}${options.value !== undefined ? ` value="${escapeHtml(options.value)}"` : ''}>`;
  return `<div class="field${options.full ? ' full' : ''}"><label for="field-${name}">${label}</label>${control}${options.help ? `<small>${options.help}</small>` : ''}</div>`;
}
const productChoices = () => appData.products.map((item) => ({ value: item.id, label: `${item.name} · stok ${numberFormat(item.stock_on_hand, 2)} ${item.unit}` }));
function saleWarnings() {
  const form = document.querySelector('#entryForm');
  const product = appData.products.find((item) => item.id === form.elements.product_id?.value);
  if (!product) return [];
  const quantity = Number(form.elements.quantity?.value || 0);
  const unitPrice = Number(form.elements.unit_price?.value || 0);
  const unitCost = Number(product.average_unit_cost || 0);
  const revenue = quantity * unitPrice - Number(form.elements.discount?.value || 0);
  const materialCost = quantity * unitCost;
  const productionCosts = Number(form.elements.labor_cost?.value || 0) + Number(form.elements.overhead_cost?.value || 0);
  const warnings = [];
  if (unitPrice < unitCost) warnings.push(`Harga jual per unit ${rupiah(unitPrice)} lebih rendah dari biaya beli rata-rata ${rupiah(unitCost)}.`);
  if (quantity > 0 && revenue < materialCost + productionCosts) warnings.push(`Transaksi diperkirakan rugi ${rupiah(materialCost + productionCosts - revenue)} setelah diskon, HPP, tenaga kerja, dan overhead.`);
  return warnings;
}
function updateSaleWarning() {
  const warning = document.querySelector('#saleWarning');
  const warnings = saleWarnings();
  warning.classList.toggle('hidden', warnings.length === 0);
  warning.innerHTML = warnings.length ? `<strong>Peringatan: potensi transaksi merugi</strong><ul>${warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '';
  return warnings;
}
function openForm(action, productId) {
  const fields = document.querySelector('#formFields'), error = document.querySelector('#formError'); error.classList.add('hidden'); error.textContent = '';
  const dateField = field('Tanggal', 'transaction_date', 'date', { value: todayISO(), required: true });
  let title, submit, content, formType = action;
  if (action === 'product') {
    title = 'Tambah produk'; submit = 'Simpan produk';
    content = field('Kode SKU', 'sku', 'text', { required: true, placeholder: 'FL-ROSE-07' }) + field('Nama produk', 'name', 'text', { required: true, placeholder: 'Mawar putih' }) + field('Kategori', 'category', 'text', { required: true, value: 'Bunga potong' }) + field('Satuan', 'unit', 'select', { choices: ['batang', 'ikat', 'buket', 'pot'].map((v) => ({ value: v, label: v })) }) + field('Harga jual (Rp)', 'selling_price', 'number', { required: true, min: 0, step: '.01' }) + field('Biaya jual per unit (Rp)', 'estimated_selling_cost', 'number', { min: 0, step: '.01', value: 0, help: 'Estimasi biaya penyelesaian dan penjualan untuk tinjauan NRV.' }) + field('Batas minimum stok', 'minimum_stock', 'number', { required: true, min: 0, step: '.001', value: 3 }) + field('URL foto produk', 'image_url', 'url', { full: true, placeholder: 'https://...' });
  } else if (action === 'purchase') {
    title = 'Catat pembelian'; submit = 'Simpan pembelian'; formType = 'purchase';
    content = field('Produk', 'product_id', 'select', { required: true, choices: productChoices() }) + field('Jumlah masuk', 'quantity', 'number', { required: true, min: '.001', step: '.001' }) + field('Biaya per unit (Rp)', 'unit_cost', 'number', { required: true, min: 0, step: '.01' }) + dateField + field('Catatan', 'note', 'text', { full: true, placeholder: 'Nama pemasok / nomor nota' });
  } else if (action === 'adjustment') {
    title = 'Penyesuaian stok'; submit = 'Simpan penyesuaian';
    content = field('Produk', 'product_id', 'select', { required: true, choices: productChoices() }) + field('Perubahan jumlah', 'quantity_delta', 'number', { required: true, step: '.001', placeholder: 'Contoh: -2 atau 5', help: 'Jumlah positif menambah; negatif mengurangi stok.' }) + field('Catatan', 'note', 'text', { full: true, required: true, placeholder: 'Alasan penyesuaian / stok opname' });
  } else if (action === 'sale') {
    title = 'Catat penjualan'; submit = 'Simpan penjualan';
    content = field('Produk', 'product_id', 'select', { required: true, choices: productChoices() }) + field('Jumlah terjual', 'quantity', 'number', { required: true, min: '.001', step: '.001' }) + field('Harga jual per unit (Rp)', 'unit_price', 'number', { required: true, min: 0, step: '.01' }) + field('Diskon (Rp)', 'discount', 'number', { min: 0, step: '.01', value: 0 }) + field('Biaya tenaga kerja (Rp)', 'labor_cost', 'number', { min: 0, step: '.01', value: 0 }) + field('Overhead produksi (Rp)', 'overhead_cost', 'number', { min: 0, step: '.01', value: 0 }) + field('PPN faktur (%)', 'ppn_rate', 'number', { min: 0, max: 100, step: '.001', value: 0, help: 'Pencatatan PPN terpisah dari pendapatan dan laba.' }) + field('Estimasi PPh final (%)', 'pph_final_rate', 'number', { min: 0, max: 100, step: '.001', value: 0, help: 'Opsional. Masukkan hanya bila sesuai rezim pajak usaha Anda.' }) + dateField + field('Catatan', 'note', 'text', { full: true, placeholder: 'Nama pelanggan / detail pesanan' });
  } else {
    title = 'Catat biaya operasional'; submit = 'Simpan biaya'; formType = 'expense';
    content = field('Kategori biaya', 'category', 'select', { required: true, choices: ['Kemasan', 'Pengiriman', 'Sewa', 'Utilitas', 'Pemasaran', 'Perlengkapan', 'Lainnya'].map((v) => ({ value: v, label: v })) }) + field('Jumlah (Rp)', 'amount', 'number', { required: true, min: '.01', step: '.01' }) + dateField + field('Catatan', 'note', 'text', { full: true, placeholder: 'Keterangan biaya / nomor bukti' });
  }
  document.querySelector('#dialogTitle').textContent = title; document.querySelector('#formSubmit').textContent = submit;
  fields.innerHTML = content; const form = document.querySelector('#entryForm'); form.dataset.formType = formType;
  if (productId) document.querySelector('[name="product_id"]').value = productId;
  if (action === 'sale') {
    const select = document.querySelector('[name="product_id"]'), price = document.querySelector('[name="unit_price"]');
    const setPrice = () => { const product = appData.products.find((item) => item.id === select.value); if (product) price.value = product.selling_price; };
    select.addEventListener('change', setPrice); setPrice();
    document.querySelectorAll('#entryForm [name="product_id"], #entryForm [name="quantity"], #entryForm [name="unit_price"], #entryForm [name="discount"], #entryForm [name="labor_cost"], #entryForm [name="overhead_cost"]').forEach((input) => {
      input.addEventListener('input', updateSaleWarning);
      input.addEventListener('change', updateSaleWarning);
    });
    updateSaleWarning();
  }
  document.querySelector('#formDialog').showModal();
}
async function submitForm(event) {
  event.preventDefault(); const form = event.currentTarget, button = document.querySelector('#formSubmit'), error = document.querySelector('#formError');
  const data = Object.fromEntries(new FormData(form).entries());
  for (const key of ['quantity', 'unit_price', 'discount', 'labor_cost', 'overhead_cost', 'ppn_rate', 'pph_final_rate', 'unit_cost', 'quantity_delta', 'amount', 'selling_price', 'estimated_selling_cost', 'minimum_stock']) if (data[key] !== undefined && data[key] !== '') data[key] = Number(data[key]);
  const type = form.dataset.formType, endpoint = { sale: '/api/sales', expense: '/api/expenses', purchase: '/api/purchase', adjustment: '/api/adjustment', product: '/api/products' }[type];
  if (type === 'sale') {
    const warnings = updateSaleWarning();
    if (warnings.length && !window.confirm(`${warnings.join('\n')}\n\nTetap catat penjualan ini?`)) return;
  }
  button.disabled = true;
  try {
    await api(endpoint, data); document.querySelector('#formDialog').close(); await refreshData();
    showToast({ sale: 'Penjualan tercatat dan stok terpotong.', expense: 'Biaya operasional tercatat.', purchase: 'Pembelian tercatat; biaya rata-rata diperbarui.', adjustment: 'Penyesuaian stok tercatat.', product: 'Produk baru berhasil ditambahkan.' }[type]);
  } catch (requestError) { error.textContent = requestError.message; error.classList.remove('hidden'); }
  finally { button.disabled = false; }
}
function csvCell(value) { let text = String(value ?? ''); if (/^[=+\-@]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; }
function exportCsv() {
  const rows = salesInPeriod(document.querySelector('#reportRange').value), header = ['Tanggal', 'Jenis', 'Uraian', 'Jumlah', 'Penjualan/biaya (IDR)', 'Biaya bahan (IDR)', 'Tenaga kerja (IDR)', 'Overhead (IDR)', 'PPN (IDR)', 'Estimasi PPh (IDR)', 'Profit transaksi (IDR)'];
  const lines = sortedTransactions(rows).map((row) => {
    const sale = row.transaction_type === 'sale';
    return [row.transaction_date, sale ? 'Penjualan' : 'Biaya operasional', sale ? productFor(row)?.name : row.expense_category, sale ? row.quantity : '', sale ? row.revenue_amount : row.expense_amount, row.material_cost || 0, row.labor_cost || 0, row.overhead_cost || 0, row.ppn_amount || 0, row.pph_final_estimate || 0, sale ? saleProfit(row) : -Number(row.expense_amount || 0)].map(csvCell).join(',');
  });
  const blob = new Blob(['\ufeff', [header.map(csvCell).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `jiva-laporan-${todayISO()}.csv`; link.click(); URL.revokeObjectURL(link.href);
}

document.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', () => setPage(link.dataset.page)));
document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]'), navigate = event.target.closest('[data-navigate]'), purchase = event.target.closest('[data-purchase-product]');
  if (action) openForm(action.dataset.action); if (navigate) setPage(navigate.dataset.navigate); if (purchase) openForm('purchase', purchase.dataset.purchaseProduct);
});
document.querySelector('#mobileMenu').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
document.querySelector('#inventorySearch').addEventListener('input', renderInventory);
document.querySelector('#stockFilter').addEventListener('change', renderInventory);
document.querySelector('#chartRange').addEventListener('change', drawChart);
document.querySelector('#reportRange').addEventListener('change', renderReports);
document.querySelector('#exportCsv').addEventListener('click', exportCsv);
document.querySelector('#entryForm').addEventListener('submit', submitForm);
document.querySelector('#dialogClose').addEventListener('click', () => document.querySelector('#formDialog').close());
document.querySelector('#dialogCancel').addEventListener('click', () => document.querySelector('#formDialog').close());
window.addEventListener('resize', () => { if (activePage === 'dashboard') drawChart(); });
refreshData().catch((error) => { showToast(`Data tidak dapat dimuat: ${error.message}`, true); document.querySelector('#modeBadge').textContent = 'Koneksi gagal'; });
