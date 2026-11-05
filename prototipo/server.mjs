import http from 'node:http';
import fs from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ERP = require('./dist/core.js');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.PORT || 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8'
};

// Inicia estado do ERP em memória a partir do seed de regras de negócio
let state = ERP.seed();

// Carrega catálogo expandido de produtos (69 produtos da loja oficial)
let productsCatalog = [];
const possibleJsonPaths = [
  path.join(root, 'products.json'),
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'database', 'products.json'),
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'encantos-da-serra-api', 'data', 'products.json')
];

for (const p of possibleJsonPaths) {
  if (existsSync(p)) {
    try {
      productsCatalog = JSON.parse(readFileSync(p, 'utf-8'));
      break;
    } catch {
      // Ignora erro de leitura e tenta o próximo
    }
  }
}

// Helper para ler corpo da requisição JSON
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Corpo da requisição excede o limite máximo permitido (5MB).'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('JSON malformatado no corpo da requisição: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

// Helper para responder JSON
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper para responder erros
function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: true, status: statusCode, message });
}

function getAllProducts() {
  const map = new Map();
  // Catálogo oficial integrado (69 produtos com atributos ERP e fotos)
  for (const p of state.products) {
    const key = p.slug || String(p.apiId || p.id);
    map.set(key, p);
  }
  // Se houver algum item extra em productsCatalog
  for (const p of productsCatalog) {
    const key = p.slug || String(p.id);
    if (!map.has(key)) {
      map.set(key, p);
    }
  }
  return Array.from(map.values());
}

// Servidor HTTP com rotas de API e arquivos estáticos
export const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  try {
    // =========================================================================
    // 1. ROTAS DE STATUS E HEALTH
    // =========================================================================
    if (pathname === '/health' && req.method === 'GET') {
      return sendJson(res, 200, {
        status: 'healthy',
        service: 'Encantos da Serra ERP & Catalog API',
        timestamp: new Date().toISOString(),
        products_count: productsCatalog.length || state.products.length,
        orders_count: state.orders.length,
        lots_count: state.lots.length,
        profiles_available: ERP.PROFILES.map(p => p.id)
      });
    }

    // =========================================================================
    // 2. DISCOVERY DE ROTAS
    // =========================================================================
    if (pathname === '/api/routes' && req.method === 'GET') {
      return sendJson(res, 200, {
        service: 'Encantos da Serra ERP API',
        endpoints: [
          { method: 'GET', path: '/health', description: 'Status e integridade do serviço' },
          { method: 'GET', path: '/api/stats', description: 'Métricas gerais e estatísticas operacionais' },
          { method: 'GET', path: '/api/profiles', description: 'Perfis e regras de autorização RBAC' },
          { method: 'GET', path: '/api/state', description: 'Snapshot completo do estado (suporta ?profile=)' },
          { method: 'GET', path: '/api/products', description: 'Listar produtos com filtros, busca e paginação' },
          { method: 'GET', path: '/api/products/:identifier', description: 'Ficha completa do produto por ID ou Slug' },
          { method: 'GET', path: '/api/products/:identifier/images', description: 'Galeria de fotos do produto' },
          { method: 'GET', path: '/api/products/:identifier/price', description: 'Preço e simulação de parcelas' },
          { method: 'GET', path: '/api/categories', description: 'Listagem de categorias com contagens' },
          { method: 'GET', path: '/api/prices', description: 'Resumo financeiro e produtos em promoção' },
          { method: 'GET', path: '/api/orders', description: 'Listar pedidos (suporta ?status=, ?customerId=, ?profile=)' },
          { method: 'POST', path: '/api/orders', description: 'Criar novo pedido' },
          { method: 'GET', path: '/api/orders/:id', description: 'Obter detalhes de um pedido' },
          { method: 'POST', path: '/api/orders/:id/reserve', description: 'Reserva provisória de estoque FEFO (soft-lock)' },
          { method: 'POST', path: '/api/orders/:id/release-reservation', description: 'Libera reserva provisória' },
          { method: 'POST', path: '/api/orders/:id/complete', description: 'Concluir pedido, baixar lotes FEFO e gerar faturamento' },
          { method: 'GET', path: '/api/lots', description: 'Inventário de lotes FEFO (suporta ?profile=)' },
          { method: 'POST', path: '/api/lots', description: 'Cadastrar novo lote de produto' },
          { method: 'POST', path: '/api/check-weight', description: 'Conferência de pesagem com tolerância de ±5%' },
          { method: 'GET', path: '/api/customers', description: 'Clientes B2C e B2B cadastrados' },
          { method: 'POST', path: '/api/customers', description: 'Cadastrar novo cliente' },
          { method: 'GET', path: '/api/receivables', description: 'Contas a receber (suporta ?profile=)' },
          { method: 'POST', path: '/api/receivables/:id/pay', description: 'Registrar recebimento ou quitação' },
          { method: 'GET', path: '/api/export/json', description: 'Download de exportação completa em JSON' },
          { method: 'GET', path: '/api/export/csv', description: 'Download de exportação em CSV com UTF-8 BOM' }
        ]
      });
    }

    // =========================================================================
    // 3. ESTATÍSTICAS E MÉTRICAS OPERACIONAIS
    // =========================================================================
    if (pathname === '/api/stats' && req.method === 'GET') {
      const allProds = getAllProducts();
      const prices = allProds.map(p => Number(p.price)).filter(p => !isNaN(p) && p > 0);
      const avgPrice = prices.length ? Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)) : 0;
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      const openReceivables = state.receivables.filter(r => ERP.balance(r) > 0);
      const openBalance = openReceivables.reduce((acc, r) => acc + ERP.balance(r), 0);

      return sendJson(res, 200, {
        total_products: allProds.length,
        total_orders: state.orders.length,
        pending_orders: state.orders.filter(o => o.status !== 'concluido').length,
        completed_orders: state.orders.filter(o => o.status === 'concluido').length,
        total_lots: state.lots.length,
        total_customers: state.customers.length,
        receivables_open_count: openReceivables.length,
        receivables_open_total: openBalance,
        average_price: avgPrice,
        min_price: minPrice,
        max_price: maxPrice,
        currency: 'BRL',
        updated_at: state.updatedAt
      });
    }

    // =========================================================================
    // 4. PERFIS RBAC
    // =========================================================================
    if (pathname === '/api/profiles' && req.method === 'GET') {
      return sendJson(res, 200, ERP.PROFILES);
    }

    // =========================================================================
    // 5. ESTADO GLOBAL DO ERP
    // =========================================================================
    if (pathname === '/api/state' && req.method === 'GET') {
      const profile = searchParams.get('profile') || 'admin';
      const scopedLots = ERP.filterLotsForProfile(state, profile);
      const scopedOrders = ERP.filterOrdersForProfile(state, profile);
      const scopedReceivables = ERP.filterReceivablesForProfile(state, profile);

      return sendJson(res, 200, {
        ...state,
        profile,
        lots: scopedLots,
        orders: scopedOrders,
        receivables: scopedReceivables
      });
    }

    // =========================================================================
    // 6. PRODUTOS DO CATÁLOGO
    // =========================================================================
    if (pathname === '/api/products' && req.method === 'GET') {
      let items = getAllProducts();

      // Busca textual
      const search = (searchParams.get('search') || '').toLowerCase().trim();
      if (search) {
        items = items.filter(p =>
          (p.name && p.name.toLowerCase().includes(search)) ||
          (p.description && p.description.toLowerCase().includes(search)) ||
          (p.slug && p.slug.toLowerCase().includes(search)) ||
          (p.sku && p.sku.toLowerCase().includes(search))
        );
      }

      // Categoria
      const category = searchParams.get('category');
      if (category && category !== 'todos') {
        items = items.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
      }

      // Faixa de preço
      const minPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : null;
      const maxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : null;
      if (minPrice !== null && !isNaN(minPrice)) items = items.filter(p => Number(p.price) >= minPrice);
      if (maxPrice !== null && !isNaN(maxPrice)) items = items.filter(p => Number(p.price) <= maxPrice);

      // Disponibilidade e desconto
      const isAvailable = searchParams.get('is_available');
      if (isAvailable !== null) items = items.filter(p => Boolean(p.is_available) === (isAvailable === 'true'));
      const hasDiscount = searchParams.get('has_discount');
      if (hasDiscount !== null) items = items.filter(p => Boolean(p.has_discount) === (hasDiscount === 'true'));

      // Ordenação
      const sortBy = searchParams.get('sort_by') || 'name_asc';
      if (sortBy === 'name_asc') items.sort((a, b) => a.name.localeCompare(b.name));
      else if (sortBy === 'name_desc') items.sort((a, b) => b.name.localeCompare(a.name));
      else if (sortBy === 'price_asc') items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      else if (sortBy === 'price_desc') items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      else if (sortBy === 'discount_desc') items.sort((a, b) => (Number(b.discount_percentage) || 0) - (Number(a.discount_percentage) || 0));

      // Paginação
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const pagedItems = items.slice((page - 1) * limit, page * limit);

      return sendJson(res, 200, {
        total,
        page,
        limit,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
        items: pagedItems
      });
    }

    // Detalhe de produto específico
    const productMatch = pathname.match(/^\/api\/products\/([^\/]+)$/);
    if (productMatch && req.method === 'GET') {
      const idOrSlug = decodeURIComponent(productMatch[1]);
      const all = getAllProducts();
      const found = all.find(p => String(p.id) === idOrSlug || String(p.apiId) === idOrSlug || p.slug === idOrSlug);
      if (!found) return sendError(res, 404, `Produto '${idOrSlug}' não encontrado.`);
      return sendJson(res, 200, found);
    }

    // Imagens de produto específico
    const productImagesMatch = pathname.match(/^\/api\/products\/([^\/]+)\/images$/);
    if (productImagesMatch && req.method === 'GET') {
      const idOrSlug = decodeURIComponent(productImagesMatch[1]);
      const all = getAllProducts();
      const found = all.find(p => String(p.id) === idOrSlug || String(p.apiId) === idOrSlug || p.slug === idOrSlug);
      if (!found) return sendError(res, 404, `Produto '${idOrSlug}' não encontrado.`);
      return sendJson(res, 200, {
        product_id: found.id,
        slug: found.slug,
        name: found.name,
        primary_image: found.primary_image || found.image,
        images_count: (found.images && found.images.length) || (found.image ? 1 : 0),
        images: found.images || (found.image ? [found.image] : [])
      });
    }

    // Preço e parcelamento de produto específico
    const productPriceMatch = pathname.match(/^\/api\/products\/([^\/]+)\/price$/);
    if (productPriceMatch && req.method === 'GET') {
      const idOrSlug = decodeURIComponent(productPriceMatch[1]);
      const all = getAllProducts();
      const found = all.find(p => String(p.id) === idOrSlug || String(p.apiId) === idOrSlug || p.slug === idOrSlug);
      if (!found) return sendError(res, 404, `Produto '${idOrSlug}' não encontrado.`);
      const price = Number(found.price) || 0;
      const p3 = price > 0 ? (price / 3).toFixed(2).replace('.', ',') : '0,00';
      const p6 = price > 0 ? (price / 6).toFixed(2).replace('.', ',') : '0,00';
      const pix = price > 0 ? Number((price * 0.95).toFixed(2)) : 0;
      return sendJson(res, 200, {
        product_id: found.id,
        slug: found.slug,
        name: found.name,
        price,
        price_formatted: found.price_formatted || `R$ ${price.toFixed(2).replace('.', ',')}`,
        compare_at_price: found.compare_at_price || null,
        compare_at_price_formatted: found.compare_at_price_formatted || null,
        has_discount: Boolean(found.has_discount),
        discount_percentage: found.discount_percentage || 0,
        installment_3x: `3x de R$ ${p3}`,
        installment_6x: `6x de R$ ${p6}`,
        pix_discount_price: pix,
        pix_discount_formatted: `R$ ${pix.toFixed(2).replace('.', ',')} (-5% no Pix)`
      });
    }

    // =========================================================================
    // 7. CATEGORIAS
    // =========================================================================
    if (pathname === '/api/categories' && req.method === 'GET') {
      const all = getAllProducts();
      const countMap = {};
      all.forEach(p => {
        const cat = p.category || 'Geral';
        countMap[cat] = (countMap[cat] || 0) + 1;
      });
      const categories = Object.keys(countMap).sort().map(cat => ({
        name: cat,
        slug: cat.toLowerCase().replace(/[\s\W]+/g, '-'),
        product_count: countMap[cat]
      }));
      return sendJson(res, 200, categories);
    }

    // =========================================================================
    // 8. RESUMO DE PREÇOS
    // =========================================================================
    if (pathname === '/api/prices' && req.method === 'GET') {
      const all = getAllProducts();
      const prices = all.map(p => Number(p.price)).filter(p => !isNaN(p) && p > 0);
      const discounted = all.filter(p => p.has_discount || (p.compare_at_price && p.compare_at_price > p.price));
      return sendJson(res, 200, {
        summary: {
          average_price: prices.length ? Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)) : 0,
          min_price: prices.length ? Math.min(...prices) : 0,
          max_price: prices.length ? Math.max(...prices) : 0,
          currency: 'BRL',
          products_with_discount_count: discounted.length
        },
        discounted_products: discounted.slice(0, 50)
      });
    }

    // =========================================================================
    // 9. PEDIDOS (ORDERS)
    // =========================================================================
    if (pathname === '/api/orders' && req.method === 'GET') {
      let orders = [...state.orders];
      const status = searchParams.get('status');
      if (status) orders = orders.filter(o => o.status === status);
      const customerId = searchParams.get('customerId');
      if (customerId) orders = orders.filter(o => o.customerId === customerId);
      const profile = searchParams.get('profile');
      if (profile) orders = ERP.filterOrdersForProfile({ orders }, profile);
      return sendJson(res, 200, { total: orders.length, items: orders });
    }

    if (pathname === '/api/orders' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      if (!payload.customerId || !payload.items || !payload.items.length) {
        return sendError(res, 400, 'Informe customerId e ao menos um item no pedido.');
      }
      const newId = 'ES-' + (1050 + state.orders.length);
      const newOrder = {
        id: newId,
        customerId: payload.customerId,
        origin: payload.origin || 'WhatsApp',
        kind: payload.kind || 'padrao',
        status: 'analise',
        payment: payload.payment || 'pix',
        due: payload.due || null,
        items: payload.items,
        notes: payload.notes || '',
        createdAt: ERP.TODAY
      };
      state.orders.unshift(newOrder);
      state.activity.unshift({
        title: `Pedido ${newId} criado via API`,
        detail: `Cliente: ${newOrder.customerId} · Canal: ${newOrder.origin}`,
        date: ERP.TODAY
      });
      return sendJson(res, 201, newOrder);
    }

    const orderMatch = pathname.match(/^\/api\/orders\/([^\/]+)$/);
    if (orderMatch && req.method === 'GET') {
      const id = orderMatch[1];
      const order = state.orders.find(o => o.id === id);
      if (!order) return sendError(res, 404, `Pedido '${id}' não encontrado.`);
      return sendJson(res, 200, order);
    }

    // Reserva provisória (soft-lock)
    const reserveMatch = pathname.match(/^\/api\/orders\/([^\/]+)\/reserve$/);
    if (reserveMatch && req.method === 'POST') {
      const id = reserveMatch[1];
      try {
        state = ERP.reserve(state, id);
        const order = state.orders.find(o => o.id === id);
        return sendJson(res, 200, {
          success: true,
          message: `Reserva provisória alocada para o pedido ${id}`,
          order
        });
      } catch (err) {
        return sendError(res, 400, err.message);
      }
    }

    // Liberação de reserva
    const releaseMatch = pathname.match(/^\/api\/orders\/([^\/]+)\/release-reservation$/);
    if (releaseMatch && req.method === 'POST') {
      const id = releaseMatch[1];
      try {
        state = ERP.releaseReservation(state, id);
        const order = state.orders.find(o => o.id === id);
        return sendJson(res, 200, {
          success: true,
          message: `Reserva provisória liberada para o pedido ${id}`,
          order
        });
      } catch (err) {
        return sendError(res, 400, err.message);
      }
    }

    // Conclusão do pedido
    const completeMatch = pathname.match(/^\/api\/orders\/([^\/]+)\/complete$/);
    if (completeMatch && req.method === 'POST') {
      const id = completeMatch[1];
      try {
        state = ERP.complete(state, id);
        const completed = state.orders.find(o => o.id === id);
        return sendJson(res, 200, {
          success: true,
          message: `Pedido ${id} concluído com sucesso. Estoque baixado e faturamento registrado.`,
          order: completed
        });
      } catch (err) {
        return sendError(res, 400, err.message);
      }
    }

    // =========================================================================
    // 10. LOTES E ESTOQUE FEFO
    // =========================================================================
    if (pathname === '/api/lots' && req.method === 'GET') {
      const profile = searchParams.get('profile') || 'admin';
      const lots = ERP.filterLotsForProfile(state, profile);
      return sendJson(res, 200, { total: lots.length, items: lots });
    }

    if (pathname === '/api/lots' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      if (!payload.productId || !payload.code || !payload.qty) {
        return sendError(res, 400, 'Informe productId, code e qty para o lote.');
      }
      const newLot = {
        id: 'l' + (state.lots.length + 1),
        productId: payload.productId,
        code: payload.code,
        qty: Number(payload.qty),
        reserved: 0,
        expiry: payload.expiry || null,
        received: payload.received || ERP.TODAY,
        cost: Number(payload.cost) || 0
      };
      state.lots.push(newLot);
      state.movements.push({
        id: 'm' + (state.movements.length + 1),
        type: 'entrada',
        lotId: newLot.id,
        productId: newLot.productId,
        qty: newLot.qty,
        date: ERP.TODAY
      });
      return sendJson(res, 201, newLot);
    }

    // Conferência de tolerância de pesagem (±5%)
    if (pathname === '/api/check-weight' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      const { expectedGrams, actualGrams } = payload;
      const result = ERP.checkWeightTolerance(expectedGrams, actualGrams);
      return sendJson(res, 200, result);
    }

    // =========================================================================
    // 11. CONTAS A RECEBER E PAGAMENTOS
    // =========================================================================
    if (pathname === '/api/receivables' && req.method === 'GET') {
      const profile = searchParams.get('profile') || 'admin';
      const rec = ERP.filterReceivablesForProfile(state, profile);
      return sendJson(res, 200, { total: rec.length, items: rec });
    }

    const payMatch = pathname.match(/^\/api\/receivables\/([^\/]+)\/pay$/);
    if (payMatch && req.method === 'POST') {
      const id = payMatch[1];
      const payload = await readJsonBody(req);
      try {
        state = ERP.receive(state, id, payload.amount, payload.method || 'pix');
        const updated = state.receivables.find(r => r.id === id);
        return sendJson(res, 200, {
          success: true,
          message: 'Pagamento processado com sucesso.',
          receivable: updated
        });
      } catch (err) {
        return sendError(res, 400, err.message);
      }
    }

    // =========================================================================
    // 12. CLIENTES (CUSTOMERS)
    // =========================================================================
    if (pathname === '/api/customers' && req.method === 'GET') {
      return sendJson(res, 200, { total: state.customers.length, items: state.customers });
    }

    if (pathname === '/api/customers' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      if (!payload.name) return sendError(res, 400, 'Nome do cliente é obrigatório.');
      const newCustomer = {
        id: 'c' + (state.customers.length + 1),
        name: payload.name,
        type: payload.type || 'Varejo',
        city: payload.city || 'Belo Horizonte',
        channel: payload.channel || 'WhatsApp',
        creditLimit: Number(payload.creditLimit) || 0,
        fiadoAllowed: Boolean(payload.fiadoAllowed)
      };
      state.customers.push(newCustomer);
      return sendJson(res, 201, newCustomer);
    }

    // =========================================================================
    // 13. EXPORTAÇÕES (JSON / CSV)
    // =========================================================================
    if (pathname === '/api/export/json' && req.method === 'GET') {
      const content = JSON.stringify(state, null, 2);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename=encantos_da_serra_erp_export.json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
      return;
    }

    if (pathname === '/api/export/csv' && req.method === 'GET') {
      let csv = 'id,name,category,price,is_available\n';
      const prods = productsCatalog.length ? productsCatalog : state.products;
      prods.forEach(p => {
        const safeName = (p.name || '').replace(/"/g, '""');
        const safeCat = (p.category || '').replace(/"/g, '""');
        csv += `"${p.id}","${safeName}","${safeCat}",${p.price || 0},${p.is_available ? 1 : 0}\n`;
      });
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=encantos_da_serra_produtos.csv',
        'Access-Control-Allow-Origin': '*'
      });
      // Adiciona UTF-8 BOM
      res.end('\ufeff' + csv);
      return;
    }

    // =========================================================================
    // 14. ARQUIVOS ESTÁTICOS DO PROTÓTIPO WEB
    // =========================================================================
    const safePath = path.resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (safePath !== root && !safePath.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end('Acesso negado');
      return;
    }

    const bytes = await fs.readFile(safePath);
    res.writeHead(200, {
      'Content-Type': types[path.extname(safePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(bytes);

  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Recurso não encontrado');
    } else {
      sendError(res, 500, 'Erro interno no servidor: ' + err.message);
    }
  }
});

// Inicialização se executado diretamente
if (process.argv[1] && process.argv[1].endsWith('server.mjs')) {
  server.listen(port, '127.0.0.1', () => {
    console.log(`=======================================================`);
    console.log(`🧀 Encantos da Serra · Servidor ERP & API Ativo!`);
    console.log(`🌐 Aplicação Web: http://127.0.0.1:${port}`);
    console.log(`📡 Rotas da API:   http://127.0.0.1:${port}/api/routes`);
    console.log(`💚 Health Check:  http://127.0.0.1:${port}/health`);
    console.log(`=======================================================`);
  });
}
