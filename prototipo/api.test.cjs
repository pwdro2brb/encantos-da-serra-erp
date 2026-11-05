const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Importa o servidor
test('Suíte de testes de integração para as rotas da API no servidor Node.js', async (t) => {
  const { server } = await import('./server.mjs');

  // Inicializa servidor em porta dinâmica de teste
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  async function request(path, options = {}) {
    const url = new URL(path, baseUrl);
    return new Promise((resolve, reject) => {
      const req = http.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let json = null;
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            try { json = JSON.parse(data); } catch {}
          }
          resolve({ status: res.statusCode, headers: res.headers, text: data, json });
        });
      });
      req.on('error', reject);
      if (options.body) {
        req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body);
      }
      req.end();
    });
  }

  try {
    await t.test('1. GET /health retorna status healthy', async () => {
      const res = await request('/health');
      assert.equal(res.status, 200);
      assert.equal(res.json.status, 'healthy');
      assert(res.json.products_count > 0);
    });

    await t.test('2. GET /api/routes retorna catálogo de rotas', async () => {
      const res = await request('/api/routes');
      assert.equal(res.status, 200);
      assert(Array.isArray(res.json.endpoints));
      assert(res.json.endpoints.length >= 20);
    });

    await t.test('3. GET /api/stats retorna métricas consolidadas', async () => {
      const res = await request('/api/stats');
      assert.equal(res.status, 200);
      assert.equal(typeof res.json.total_products, 'number');
      assert.equal(typeof res.json.total_orders, 'number');
      assert(res.json.total_lots > 0);
    });

    await t.test('4. GET /api/profiles retorna os 6 perfis RBAC', async () => {
      const res = await request('/api/profiles');
      assert.equal(res.status, 200);
      assert(Array.isArray(res.json));
      const ids = res.json.map(p => p.id);
      assert(ids.includes('admin'));
      assert(ids.includes('produtor'));
      assert(ids.includes('cliente_b2b'));
    });

    await t.test('5. GET /api/state com filtro de perfil RBAC', async () => {
      const resAdmin = await request('/api/state?profile=admin');
      assert.equal(resAdmin.status, 200);
      const resProd = await request('/api/state?profile=produtor');
      assert.equal(resProd.status, 200);
      // Produtor só vê lotes do produto p1
      assert(resProd.json.lots.every(l => l.productId === 'p1'));
      assert.equal(resProd.json.receivables.length, 0); // Financeiro bloqueado
    });

    await t.test('6. GET /api/products com paginação e busca', async () => {
      const res = await request('/api/products?limit=5');
      assert.equal(res.status, 200);
      assert.equal(res.json.items.length, 5);

      const searchRes = await request('/api/products?search=provolone');
      assert.equal(searchRes.status, 200);
      assert(searchRes.json.total > 0);
    });

    await t.test('7. GET /api/products/:identifier por ID e por Slug', async () => {
      const resP1 = await request('/api/products/p1');
      assert.equal(resP1.status, 200);
      assert.equal(resP1.json.id, 'p1');

      const notFound = await request('/api/products/produto-inexistente-xyz');
      assert.equal(notFound.status, 404);
    });

    await t.test('8. GET /api/products/:identifier/images e /price', async () => {
      const imgRes = await request('/api/products/p1/images');
      assert.equal(imgRes.status, 200);
      assert(imgRes.json.images.length > 0);

      const priceRes = await request('/api/products/p1/price');
      assert.equal(priceRes.status, 200);
      assert(priceRes.json.installment_3x.includes('3x de R$'));
    });

    await t.test('9. GET /api/categories lista categorias com contagens', async () => {
      const res = await request('/api/categories');
      assert.equal(res.status, 200);
      assert(Array.isArray(res.json));
      assert(res.json.length > 0);
      assert(res.json[0].product_count > 0);
    });

    await t.test('10. POST /api/orders cria novo pedido e GET /api/orders lista', async () => {
      const createRes = await request('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          customerId: 'c1',
          origin: 'WhatsApp',
          payment: 'pix',
          items: [{ productId: 'p1', qty: 1, price: 42.9 }]
        }
      });
      assert.equal(createRes.status, 201);
      assert(createRes.json.id.startsWith('ES-'));

      const listRes = await request('/api/orders');
      assert.equal(listRes.status, 200);
      assert(listRes.json.items.some(o => o.id === createRes.json.id));
    });

    await t.test('11. POST /api/orders/:id/reserve e release-reservation', async () => {
      // Pedido ES-1048 tem 2x p1
      const resReserve = await request('/api/orders/ES-1048/reserve', { method: 'POST' });
      assert.equal(resReserve.status, 200);
      assert(resReserve.json.success);

      const resRelease = await request('/api/orders/ES-1048/release-reservation', { method: 'POST' });
      assert.equal(resRelease.status, 200);
      assert(resRelease.json.success);
    });

    await t.test('12. POST /api/check-weight valida tolerância de ±5%', async () => {
      const ok = await request('/api/check-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { expectedGrams: 1000, actualGrams: 1040 }
      });
      assert.equal(ok.status, 200);
      assert.equal(ok.json.valid, true);

      const invalid = await request('/api/check-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { expectedGrams: 1000, actualGrams: 1100 }
      });
      assert.equal(invalid.status, 200);
      assert.equal(invalid.json.valid, false);
    });

    await t.test('13. POST /api/lots cadastra novo lote', async () => {
      const res = await request('/api/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          productId: 'p1',
          code: 'LOTE-TESTE-99',
          qty: 25,
          expiry: '2026-12-31',
          cost: 28.5
        }
      });
      assert.equal(res.status, 201);
      assert.equal(res.json.code, 'LOTE-TESTE-99');
    });

    await t.test('14. POST /api/receivables/:id/pay processa pagamento', async () => {
      const payRes = await request('/api/receivables/r1/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { amount: 50, method: 'pix' }
      });
      assert.equal(payRes.status, 200);
      assert(payRes.json.success);
    });

    await t.test('15. Exportações /api/export/json e /api/export/csv', async () => {
      const jsonRes = await request('/api/export/json');
      assert.equal(jsonRes.status, 200);
      assert(jsonRes.headers['content-type'].includes('application/json'));

      const csvRes = await request('/api/export/csv');
      assert.equal(csvRes.status, 200);
      assert(csvRes.headers['content-type'].includes('text/csv'));
    });

    await t.test('16. Arquivos estáticos continuam sendo servidos', async () => {
      const htmlRes = await request('/index.html');
      assert.equal(htmlRes.status, 200);
      assert(htmlRes.headers['content-type'].includes('text/html'));
    });

  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
