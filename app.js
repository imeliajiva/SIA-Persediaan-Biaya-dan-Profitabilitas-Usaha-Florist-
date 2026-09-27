const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const FRONTEND = path.resolve(__dirname, '..', 'frontend');
const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const catalog = [
  ['FL-ROS-01', 'Mawar merah', 'Mawar', 'batang', 18000, 2500, 7500, 20, '1494972308805-463bc619d34e'],
  ['FL-TUL-02', 'Tulip pastel', 'Tulip', 'batang', 32000, 3000, 14000, 12, '1520763185298-1b434c919102'],
  ['FL-PEO-03', 'Peony blush', 'Peony', 'batang', 45000, 4000, 21000, 8, '1490750967868-88aa4486c946'],
  ['FL-SUN-04', 'Sunflower cerah', 'Bunga musiman', 'batang', 22000, 2500, 9000, 10, '1470252649378-9c29740c9fa8'],
  ['FL-EUC-05', 'Eucalyptus', 'Filler', 'batang', 12000, 1500, 4000, 15, '1508610048659-a06b669e3321'],
  ['FL-MIX-06', 'Buket meadow', 'Rangkaian', 'buket', 285000, 18000, 122000, 4, '1525310072745-f49212b5ac6d']
];
const demoProducts = catalog.map((item, index) => ({
  id: `demo-${index + 1}`, sku: item[0], name: item[1], category: item[2], unit: item[3],
  selling_price: item[4], estimated_selling_cost: item[5], average_unit_cost: item[6],
  minimum_stock: item[7], image_url: `https://images.unsplash.com/photo-${item[8]}?auto=format&fit=crop&w=800&q=85`,
  active: true, stock_on_hand: [38, 18, 7, 22, 31, 6][index],
  inventory_value: [285000, 252000, 147000, 198000, 124000, 732000][index],
  estimated_nrv_per_unit: item[4] - item[5], nrv_review_required: false
}));
const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
const demoTransactions = [
  { id: randomUUID(), transaction_type: 'sale', product_id: 'demo-6', transaction_date: daysAgo(0), quantity: 1, unit_price: 285000, discount_amount: 0, revenue_amount: 285000, material_cost: 122000, labor_cost: 30000, overhead_cost: 12000, ppn_amount: 0, pph_final_estimate: 0, description: 'Pesanan buket wisuda' },
  { id: randomUUID(), transaction_type: 'sale', product_id: 'demo-1', transaction_date: daysAgo(0), quantity: 12, unit_price: 18000, discount_amount: 6000, revenue_amount: 210000, material_cost: 90000, labor_cost: 10000, overhead_cost: 5000, ppn_amount: 0, pph_final_estimate: 0, description: 'Mawar merah pilihan' },
  { id: randomUUID(), transaction_type: 'expense', transaction_date: daysAgo(1), expense_amount: 85000, expense_category: 'Kemasan', description: 'Kertas dan pita' },
  { id: randomUUID(), transaction_type: 'sale', product_id: 'demo-2', transaction_date: daysAgo(1), quantity: 5, unit_price: 32000, discount_amount: 0, revenue_amount: 160000, material_cost: 70000, labor_cost: 0, overhead_cost: 0, ppn_amount: 0, pph_final_estimate: 0, description: 'Tulip pastel' },
  { id: randomUUID(), transaction_type: 'expense', transaction_date: daysAgo(2), expense_amount: 120000, expense_category: 'Pengiriman', description: 'Ongkos kirim pemasok' },
  { id: randomUUID(), transaction_type: 'sale', product_id: 'demo-4', transaction_date: daysAgo(2), quantity: 8, unit_price: 22000, discount_amount: 0, revenue_amount: 176000, material_cost: 72000, labor_cost: 0, overhead_cost: 0, ppn_amount: 0, pph_final_estimate: 0, description: 'Sunflower cerah' },
  { id: randomUUID(), transaction_type: 'expense', transaction_date: daysAgo(3), expense_amount: 250000, expense_category: 'Operasional', description: 'Biaya operasional toko' },
  { id: randomUUID(), transaction_type: 'sale', product_id: 'demo-3', transaction_date: daysAgo(3), quantity: 3, unit_price: 45000, discount_amount: 0, revenue_amount: 135000, material_cost: 63000, labor_cost: 5000, overhead_cost: 0, ppn_amount: 0, pph_final_estimate: 0, description: 'Peony blush' },
  { id: randomUUID(), transaction_type: 'sale', product_id: 'demo-5', transaction_date: daysAgo(4), quantity: 10, unit_price: 12000, discount_amount: 0, revenue_amount: 120000, material_cost: 40000, labor_cost: 0, overhead_cost: 0, ppn_amount: 0, pph_final_estimate: 0, description: 'Eucalyptus' }
];
const demoMovements = demoProducts.map((product) => ({
  id: randomUUID(), product_id: product.id, movement_type: 'purchase', quantity_delta: product.stock_on_hand,
  unit_cost: product.average_unit_cost, total_cost: product.inventory_value, notes: 'Saldo awal demo', created_at: new Date().toISOString()
}));

async function supabaseRequest(endpoint, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers
    }
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase mengembalikan HTTP ${response.status}.`);
  return data;
}

async function getData() {
  if (!USE_SUPABASE) return { mode: 'demo', products: demoProducts, transactions: demoTransactions, movements: demoMovements };
  const [products, transactions, movements] = await Promise.all([
    supabaseRequest('inventory_summary?select=*&active=eq.true&order=name.asc'),
    supabaseRequest('business_transactions?select=*&order=transaction_date.desc,created_at.desc&limit=500'),
    supabaseRequest('inventory_movements?select=*&order=created_at.desc&limit=500')
  ]);
  return { mode: 'supabase', products, transactions, movements };
}

async function rpc(name, args) {
  if (USE_SUPABASE) return supabaseRequest(`rpc/${name}`, { method: 'POST', body: JSON.stringify(args) });
  return runDemoMutation(name, args);
}

function runDemoMutation(name, args) {
  const product = demoProducts.find((item) => item.id === args.p_product_id);
  if (name !== 'record_expense' && !product) throw new Error('Produk tidak ditemukan.');
  const now = new Date().toISOString();
  if (name === 'record_purchase') {
    const qty = Number(args.p_quantity), cost = Number(args.p_unit_cost);
    if (!(qty > 0) || cost < 0) throw new Error('Jumlah dan biaya pembelian harus valid.');
    const stock = Number(product.stock_on_hand);
    product.average_unit_cost = Math.round(((stock * Number(product.average_unit_cost)) + (qty * cost)) / (stock + qty));
    product.stock_on_hand = stock + qty;
    product.inventory_value = Math.round(product.stock_on_hand * product.average_unit_cost);
    demoMovements.unshift({ id: randomUUID(), product_id: product.id, movement_type: 'purchase', quantity_delta: qty, unit_cost: cost, total_cost: qty * cost, notes: args.p_note || 'Pembelian', movement_date: args.p_movement_date || daysAgo(0), created_at: now });
    return { ok: true };
  }
  if (name === 'record_adjustment') {
    const delta = Number(args.p_quantity_delta);
    if (!delta || Number(product.stock_on_hand) + delta < 0) throw new Error('Penyesuaian stok tidak valid.');
    product.stock_on_hand = Number(product.stock_on_hand) + delta;
    demoMovements.unshift({ id: randomUUID(), product_id: product.id, movement_type: 'adjustment', quantity_delta: delta, unit_cost: Number(product.average_unit_cost), total_cost: Math.abs(delta) * Number(product.average_unit_cost), notes: args.p_note || 'Penyesuaian stok', created_at: now });
    return { ok: true };
  }
  if (name === 'record_sale') {
    const qty = Number(args.p_quantity), price = Number(args.p_unit_price), discount = Number(args.p_discount || 0);
    const net = qty * price - discount;
    if (!(qty > 0) || price < 0 || discount < 0 || discount > qty * price || qty > Number(product.stock_on_hand)) throw new Error('Jumlah, harga, diskon, atau stok penjualan tidak valid.');
    const row = { id: randomUUID(), transaction_type: 'sale', product_id: product.id, transaction_date: args.p_transaction_date || daysAgo(0), quantity: qty, unit_price: price, discount_amount: discount, revenue_amount: net, material_cost: Math.round(qty * Number(product.average_unit_cost)), labor_cost: Number(args.p_labor_cost || 0), overhead_cost: Number(args.p_overhead_cost || 0), ppn_rate: Number(args.p_ppn_rate || 0), ppn_amount: Math.round(net * Number(args.p_ppn_rate || 0)) / 100, pph_final_rate: Number(args.p_pph_final_rate || 0), pph_final_estimate: Math.round(net * Number(args.p_pph_final_rate || 0)) / 100, description: args.p_note || '', created_at: now };
    demoTransactions.unshift(row);
    product.stock_on_hand = Number(product.stock_on_hand) - qty;
    product.inventory_value = Math.round(product.stock_on_hand * Number(product.average_unit_cost));
    demoMovements.unshift({ id: randomUUID(), product_id: product.id, movement_type: 'sale', quantity_delta: -qty, unit_cost: Number(product.average_unit_cost), total_cost: row.material_cost, transaction_id: row.id, notes: row.description || 'Penjualan', movement_date: row.transaction_date, created_at: now });
    return row;
  }
  if (name === 'record_expense') {
    const amount = Number(args.p_amount);
    if (!(amount > 0)) throw new Error('Nominal biaya harus lebih besar dari nol.');
    const row = { id: randomUUID(), transaction_type: 'expense', transaction_date: args.p_transaction_date || daysAgo(0), expense_amount: amount, expense_category: args.p_category || 'Operasional', description: args.p_note || '', created_at: now };
    demoTransactions.unshift(row);
    return row;
  }
  throw new Error('Operasi tidak dikenali.');
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64000) throw new Error('Ukuran permintaan terlalu besar.');
  }
  return body ? JSON.parse(body) : {};
}

const routes = {
  'POST /api/products': async (body) => {
    const product = {
      sku: String(body.sku || '').trim(), name: String(body.name || '').trim(),
      category: String(body.category || 'Bunga potong').trim(), unit: String(body.unit || 'batang').trim(),
      image_url: String(body.image_url || '').trim(), selling_price: Number(body.selling_price),
      estimated_selling_cost: Number(body.estimated_selling_cost || 0), minimum_stock: Number(body.minimum_stock || 0)
    };
    if (!product.sku || !product.name || !(product.selling_price >= 0) || !(product.minimum_stock >= 0)) throw new Error('Lengkapi kode, nama, harga jual, dan batas stok dengan nilai yang valid.');
    if (USE_SUPABASE) return supabaseRequest('products', { method: 'POST', body: JSON.stringify(product) });
    if (demoProducts.some((item) => item.sku.toLowerCase() === product.sku.toLowerCase())) throw new Error('Kode SKU sudah digunakan.');
    const row = { ...product, id: randomUUID(), average_unit_cost: 0, stock_on_hand: 0, inventory_value: 0, estimated_nrv_per_unit: product.selling_price - product.estimated_selling_cost, nrv_review_required: false, active: true };
    demoProducts.push(row);
    return row;
  },
  'POST /api/purchase': (body) => rpc('record_purchase', { p_product_id: body.product_id, p_quantity: Number(body.quantity), p_unit_cost: Number(body.unit_cost), p_note: String(body.note || ''), p_movement_date: body.transaction_date || daysAgo(0) }),
  'POST /api/adjustment': (body) => rpc('record_adjustment', { p_product_id: body.product_id, p_quantity_delta: Number(body.quantity_delta), p_note: String(body.note || '') }),
  'POST /api/sales': (body) => rpc('record_sale', {
    p_product_id: body.product_id, p_quantity: Number(body.quantity), p_unit_price: Number(body.unit_price),
    p_discount: Number(body.discount || 0), p_labor_cost: Number(body.labor_cost || 0),
    p_overhead_cost: Number(body.overhead_cost || 0), p_ppn_rate: Number(body.ppn_rate || 0),
    p_pph_final_rate: Number(body.pph_final_rate || 0), p_note: String(body.note || ''),
    p_transaction_date: body.transaction_date || daysAgo(0)
  }),
  'POST /api/expenses': (body) => rpc('record_expense', {
    p_category: String(body.category || 'Operasional'), p_amount: Number(body.amount),
    p_note: String(body.note || ''), p_transaction_date: body.transaction_date || daysAgo(0)
  })
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (request.method === 'GET' && url.pathname === '/api/data') return sendJson(response, 200, await getData());
    if (request.method === 'GET' && url.pathname === '/api/health') return sendJson(response, 200, { ok: true, mode: USE_SUPABASE ? 'supabase' : 'demo' });
    if (request.method === 'POST' && routes[`${request.method} ${url.pathname}`]) {
      const result = await routes[`${request.method} ${url.pathname}`](await readJson(request));
      return sendJson(response, 201, result);
    }
    if (request.method !== 'GET') return sendJson(response, 404, { error: 'Rute tidak ditemukan.' });
    const requestedPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const filePath = path.resolve(FRONTEND, `.${requestedPath}`);
    if (!filePath.startsWith(`${FRONTEND}${path.sep}`)) return sendJson(response, 403, { error: 'Akses ditolak.' });
    const content = await fs.promises.readFile(filePath);
    response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(content);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 422;
    sendJson(response, status, { error: error.message || 'Terjadi kesalahan pada server.' });
  }
});

server.listen(PORT, () => {
  console.log(`Jiva Florist berjalan di http://localhost:${PORT} (${USE_SUPABASE ? 'Supabase' : 'mode demo'})`);
  if (!USE_SUPABASE) console.log('Mode demo aktif. Atur SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY untuk memakai basis data PostgreSQL.');
});
