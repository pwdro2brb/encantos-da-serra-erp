const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('./dist/core.js');

test('conclusão baixa estoque e cria conta a prazo uma única vez',()=>{const s=E.seed(),o=s.orders.find(o=>o.id==='ES-1045');const before=E.stock(s,'p1');const done=E.complete(s,o.id);assert.equal(E.stock(done,'p1'),before-4);assert.equal(done.receivables.at(-1).total,276);assert.equal(E.balance(done.receivables.at(-1)),276);assert.deepEqual(E.complete(done,o.id),done);assert.equal(E.stock(s,'p1'),before);});
test('seleção usa menor validade liberada e exclui limite de sete dias',()=>{const s=E.seed();s.lots.push({id:'seven',productId:'p1',code:'SEVEN',qty:50,expiry:'2026-11-10',received:'2026-10-01',cost:29},{id:'early',productId:'p1',code:'EARLY',qty:2,expiry:'2026-11-11',received:'2026-11-01',cost:29});const plan=E.plan(s,s.orders.find(o=>o.id==='ES-1045'));assert.equal(plan[0].lotId,'early');assert.equal(plan[0].qty,2);assert.equal(plan[1].lotId,'l2');assert.equal(plan[1].qty,2);assert(!plan.some(a=>['l1','seven'].includes(a.lotId)));});
test('falta em um produto não causa baixa parcial',()=>{const s=E.seed(),o=s.orders.find(o=>o.id==='ES-1045');s.lots.find(l=>l.productId==='p5').qty=0;const original=JSON.stringify(s);assert.throws(()=>E.complete(s,o.id),/insuficiente/);assert.equal(JSON.stringify(s),original);});
test('personalizado exige aprovação antes de concluir',()=>{const s=E.seed(),o=s.orders.find(o=>o.id==='ES-1046');o.status='pronto';assert.throws(()=>E.complete(s,o.id),/Aprove/);});
test('conclusão exige etapa pronta',()=>{const s=E.seed();assert.throws(()=>E.complete(s,'ES-1048'),/pronto/);});
test('venda a prazo exige vencimento válido',()=>{const s=E.seed(),o=s.orders.find(o=>o.id==='ES-1045');o.due='2026-10-31';assert.throws(()=>E.complete(s,o.id),/vencimento/);});
test('recebimento parcial e quitação preservam saldo',()=>{let s=E.seed();s=E.receive(s,'r1',20,'pix');assert.equal(E.balance(s.receivables[0]),200);s=E.receive(s,'r1',200,'pix');assert.equal(E.balance(s.receivables[0]),0);assert.throws(()=>E.receive(s,'r1',1,'pix'),/saldo/);});
test('recusa pagamento inválido ou superior ao saldo',()=>{const s=E.seed();for(const v of [0,-1,NaN,221])assert.throws(()=>E.receive(s,'r1',v,'pix'));});
test('pedido à vista gera recebimento e conta quitada',()=>{const s=E.seed(),o=s.orders.find(o=>o.id==='ES-1048');o.status='pronto';const done=E.complete(s,o.id),r=done.receivables.at(-1);assert.equal(E.balance(r),0);assert.equal(r.payments[0].method,'pix');});
test('atualização oficial preserva pedidos, pagamentos e quantidades da sessão',()=>{const s=E.seed();s.products[0].name='Nome do cenário anterior';s.products[0].price=999;s.lots[1].qty=17;s.receivables[0].payments.push({id:'test',amount:10,date:E.TODAY,method:'pix'});const migrated=E.applyOfficialCatalog(s);assert.equal(migrated.products.length,69);assert.equal(migrated.products[0].price,42.9);assert.deepEqual(migrated.orders,s.orders);assert.deepEqual(migrated.lots,s.lots);assert.deepEqual(migrated.receivables,s.receivables);assert.equal(s.products[0].name,'Nome do cenário anterior');});
test('produto com validade indeterminada permanece elegível e não gera data artificial',()=>{const s=E.seed(),o=s.orders.find(o=>o.id==='ES-1044');o.status='pronto';assert.equal(s.lots.find(l=>l.productId==='p3').expiry,null);assert.equal(E.days(null),Infinity);const done=E.complete(s,o.id);assert.equal(E.stock(done,'p3'),18);assert.equal(done.orders.find(x=>x.id===o.id).allocations[0].lotId,'l4');});
test('catálogo tem fontes oficiais e preços válidos em todos os produtos',()=>{const s=E.seed();for(const p of s.products){assert(p.sourceUrl.startsWith('https://encantosdaserra.lojavirtualnuvem.com.br/produtos/'));assert(Number.isFinite(p.price)&&p.price>0);assert.equal(p.verifiedAt,E.TODAY);assert(p.image.startsWith('assets/official/')||p.image.startsWith('https://'));}});

test('reserva provisória aloca lote na separação e liberação devolve saldo disponível',()=>{
  let s=E.seed();
  const oId='ES-1048'; // 2x p1
  const availBefore=E.availableStock(s,'p1');
  s=E.reserve(s,oId);
  assert.equal(E.availableStock(s,'p1'),availBefore-2);
  const reservedOrder=s.orders.find(o=>o.id===oId);
  assert(reservedOrder.reservations&&reservedOrder.reservations.length>=1);
  assert.equal(reservedOrder.reservations[0].qty,2);
  // Liberação do soft-lock restaura o saldo disponível
  s=E.releaseReservation(s,oId);
  assert.equal(E.availableStock(s,'p1'),availBefore);
  const releasedOrder=s.orders.find(o=>o.id===oId);
  assert(!releasedOrder.reservations);
});

test('conferência de pesagem valida tolerância de 5%',()=>{
  const ok=E.checkWeightTolerance(1000,1045);
  assert(ok.valid);
  assert.equal(ok.diffPercent,4.5);
  const excess=E.checkWeightTolerance(1000,1065);
  assert(!excess.valid);
  assert.equal(excess.diffPercent,6.5);
});

test('catálogo de perfis inclui equipe interna, cliente B2B e produtor rural',()=>{
  const ids=E.PROFILES.map(p=>p.id);
  assert(ids.includes('admin'));
  assert(ids.includes('atendimento'));
  assert(ids.includes('estoque'));
  assert(ids.includes('financeiro'));
  assert(ids.includes('cliente_b2b'));
  assert(ids.includes('produtor'));
  for(const p of E.PROFILES){
    assert(Array.isArray(p.atribuicoes)&&p.atribuicoes.length>0);
    assert(Array.isArray(p.permissoes)&&p.permissoes.length>0);
    assert(Array.isArray(p.restricoes)&&p.restricoes.length>0);
    assert(Array.isArray(p.allowedRoutes)&&p.allowedRoutes.length>0);
  }
});

test('produtor Família Oliveira não tem acesso ao estoque geral nem financeiro do empório',()=>{
  const s=E.seed();
  const lots=E.filterLotsForProfile(s,'produtor');
  // Deve ver apenas lotes do Queijo Canastra (p1)
  assert.equal(lots.length,2);
  assert(lots.every(l=>l.productId==='p1'));
  // Não pode ver doces (p2), cachaças (p3), salames (p5)
  assert(!lots.some(l=>['p2','p3','p4','p5'].includes(l.productId)));
  // Financeiro do empório bloqueado
  const rec=E.filterReceivablesForProfile(s,'produtor');
  assert.equal(rec.length,0);
  assert.equal(E.canAccessRoute('produtor','financeiro'),false);
  assert.equal(E.canAccessRoute('produtor','clientes'),false);
});

test('cliente B2B Empório Raízes não tem acesso a estoque interno nem faturas de outros',()=>{
  const s=E.seed();
  // Não tem acesso a lotes internos de estoque
  const lots=E.filterLotsForProfile(s,'cliente_b2b');
  assert.equal(lots.length,0);
  assert.equal(E.canAccessRoute('cliente_b2b','estoque'),false);
  assert.equal(E.canAccessRoute('cliente_b2b','clientes'),false);
  // Visualiza estritamente suas próprias contas
  const rec=E.filterReceivablesForProfile(s,'cliente_b2b');
  assert.equal(rec.length,1);
  assert.equal(rec[0].customerId,'c2');
  // Visualiza estritamente seus próprios pedidos
  const ord=E.filterOrdersForProfile(s,'cliente_b2b');
  assert(ord.every(o=>o.customerId==='c2'));
});

test('estoquista e atendente não têm acesso a dados financeiros do empório',()=>{
  assert.equal(E.canAccessRoute('estoque','financeiro'),false);
  assert.equal(E.canAccessRoute('atendimento','financeiro'),false);
});
