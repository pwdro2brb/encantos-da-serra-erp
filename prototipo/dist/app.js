/* Protótipo Encantos da Serra ERP · Revitalização Estrada Real & Mapeamento de Sessões / RBAC */
'use strict';
const E=ERP, O=ERP_OFFICIAL, KEY='encantos-erp-demo-v1';
let state;
try{
  state=JSON.parse(localStorage.getItem(KEY));
  if(state?.version!==1) state=E.seed();
}catch{
  state=E.seed();
}
if(!state.currentProfile) state.currentProfile='admin';
if(state.catalogRevision!==O.revision){
  state=E.applyOfficialCatalog(state);
  try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}
}

let filter='todos',query='',financeFilter='abertas',currentSlide=0,lastFocus=null,catalogFilter='todos',catalogSearch='';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const date=d=>d?new Date(d+'T12:00:00').toLocaleDateString('pt-BR'):'A combinar';
const short=d=>date(d).slice(0,5);
const customer=id=>state.customers.find(c=>c.id===id)||{name:'Cliente',type:'B2C',channel:'WhatsApp'};
const product=id=>state.products.find(p=>p.id===id)||state.products[0];
const initials=n=>n.split(' ').slice(0,2).map(n=>n[0]).join('');

const currentProfile=()=>E.getProfile(state.currentProfile);

const paths={
  mountain:'M2 18 9 5l5 9 3-5 5 9H2Zm5-9 2 3 2-3',
  grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  board:'M3 4h18v16H3zM9 4v16M15 4v16M5 8h2M11 8h2M17 8h2',
  spark:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  box:'m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10M7.5 4.5l9 5',
  wallet:'M3 6h17v15H3V6Zm0 0V3h14v3M16 11h5v5h-5z',
  leaf:'M20 3c-12-2-18 4-14 12s17 3 14-12ZM4 21l12-13',
  arrow:'M4 12h16m-5-5 5 5-5 5',
  plus:'M12 5v14M5 12h14',
  search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  down:'m6 9 6 6 6-6',
  clock:'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  check:'m5 12 4 4L19 6',
  alert:'m12 3 10 18H2L12 3Zm0 6v5M12 17v.2',
  link:'m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 2 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
  close:'m6 6 12 12M6 18 18 6',
  play:'m8 4 13 8-13 8V4Z',
  refresh:'M20 7v5h-5M4 17v-5h5M20 12a8 8 0 0 0-14-6M4 12a8 8 0 0 0 14 6',
  menu:'M3 6h18M3 12h18M3 18h18',
  chart:'M4 19V5M4 19h17M9 15v-4M14 15V7M19 15v-7',
  message:'M21 12a9 9 0 0 1-9 9c-2 0-3-.5-4.5-1L3 21l1-4.5A9 9 0 1 1 21 12Z',
  receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6M9 12h6',
  lock:'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Zm-7 4v3M7 11V7a5 5 0 0 1 10 0v4',
  compass:'m14.8 9.2-2.3 5.6-5.6 2.3 2.3-5.6 5.6-2.3ZM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z',
  shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  terminal:'M4 17l6-5-6-5m8 10h8'
};

function icon(name){
  return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${paths[name]||paths.box}"/></svg>`;
}

const statuses={
  novo:['Marco Zero (Novo)','blue'],
  analise:['Curadoria (Análise)','amber'],
  separacao:['Na Tulha (Separação)','purple'],
  pronto:['Pronto na Porteira','green'],
  concluido:['Entregue com Encanto','gray'],
  cancelado:['Cancelado','red']
};

function badge(s){
  const t=statuses[s]||[s,'gray'];
  return `<span class="badge ${t[1]}">${t[0]}</span>`;
}

function save(){
  try{
    localStorage.setItem(KEY,JSON.stringify(state));
  }catch{
    toast('O navegador não permitiu salvar. Os dados ficam nesta sessão.');
  }
}

function toast(t){
  $('#toast').textContent=t;
  $('#toast').classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);
}

function go(route){ location.hash='/'+route; }
function route(){ return (location.hash.slice(1).split('?')[0]||'/visao-geral').replace(/^\//,''); }

function getOrders(kind){
  let list=E.filterOrdersForProfile(state, currentProfile()).filter(o=>o.status!=='cancelado');
  if(kind) list=list.filter(o=>o.kind===kind);
  return list;
}

function pageHeading(kicker,title,sub,buttons=''){
  return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="subtitle">${sub}</p></div><div class="actions">${buttons}</div></div>`;
}

function button(text,action,ico='plus',cls='primary',extra=''){
  return `<button class="btn ${cls}" data-action="${action}" ${extra}>${icon(ico)}${text}</button>`;
}

function metric(title,value,foot,ico){
  return `<div class="metric"><div class="metric-top">${title}${icon(ico)}</div><div class="metric-value money">${value}</div><div class="metric-foot">${foot}</div></div>`;
}

function getNavigationForProfile(prof){
  const allNav=[
    ['visao-geral','grid','Visão geral'],
    ['catalogo','leaf','Catálogo oficial'],
    ['pedidos','board','Quadro de pedidos'],
    ['personalizados','spark','Personalizados'],
    ['clientes','users','Clientes'],
    ['estoque','box','Estoque & Lotes'],
    ['financeiro','wallet','Financeiro'],
    ['fornecedores','compass','Produção Estrada Real'],
    ['empresa','mountain','Sobre a empresa'],
    ['api','terminal','Console da API']
  ];

  if(prof.id==='cliente_b2b'){
    return [
      ['visao-geral','grid','Painel B2B'],
      ['catalogo','leaf','Catálogo Atacado'],
      ['pedidos','board','Meus Pedidos'],
      ['financeiro','wallet','Minhas Faturas & Fiado'],
      ['empresa','mountain','Sobre a Empresa']
    ];
  }
  if(prof.id==='produtor'){
    return [
      ['visao-geral','grid','Painel do Produtor'],
      ['estoque','box','Remessas & Lotes Canastra'],
      ['fornecedores','compass','Minha Capacidade'],
      ['catalogo','leaf','Catálogo Oficial'],
      ['empresa','mountain','Sobre a Empresa']
    ];
  }
  if(prof.id==='atendimento'){
    return [
      ['visao-geral','grid','Visão geral'],
      ['catalogo','leaf','Catálogo oficial'],
      ['pedidos','board','Quadro de pedidos'],
      ['personalizados','spark','Personalizados'],
      ['clientes','users','Clientes'],
      ['empresa','mountain','Sobre a empresa'],
      ['api','terminal','Console da API']
    ];
  }
  if(prof.id==='estoque'){
    return [
      ['visao-geral','grid','Visão geral'],
      ['estoque','box','Estoque & Lotes'],
      ['pedidos','board','Separação & Expedição'],
      ['fornecedores','compass','Produtores'],
      ['api','terminal','Console da API']
    ];
  }
  if(prof.id==='financeiro'){
    return [
      ['visao-geral','grid','Visão geral'],
      ['financeiro','wallet','Financeiro & Fiado'],
      ['pedidos','board','Pedidos & Faturamento'],
      ['clientes','users','Clientes & Crédito'],
      ['api','terminal','Console da API']
    ];
  }
  if(prof.id==='compras'){
    return [
      ['visao-geral','grid','Visão geral'],
      ['fornecedores','compass','Produtores & Compras'],
      ['estoque','box','Estoque & Reposição'],
      ['catalogo','leaf','Catálogo'],
      ['api','terminal','Console da API']
    ];
  }
  return allNav;
}

function shell(content,r){
  const prof=currentProfile();
  const nav=getNavigationForProfile(prof);
  const openCount=getOrders().filter(o=>!['concluido','cancelado'].includes(o.status)).length;

  const apiLink=nav.find(([id])=>id==='api');
  const navLink=([id,ico,label])=>`
    <a class="nav-item" href="#/${id}"${id===r?' aria-current="page"':''}>
      ${icon(ico)}${label}
      ${id==='pedidos'?`<span class="nav-count">${openCount}</span>`:''}
    </a>`;

  return `
  <header class="site-header">
    <div class="header-bar">
      <a class="brand" href="#/visao-geral">
        ${officialLogo('brand-logo')}
        <div class="brand-name">
          Encantos da Serra
          <small>ESTRADA REAL · ERP</small>
        </div>
      </a>
      ${prof.type==='client' ? customerHeaderContacts() : ''}
      <div class="header-actions">
        <button class="role-badge-pill" data-action="switch-profile" title="Alternar perfil" aria-label="Alternar perfil. Perfil ativo: ${esc(prof.name)}">
          ${icon('users')}<span>${esc(prof.name)}</span>
        </button>
        <button class="header-button" data-action="alerts" aria-label="Ver alertas de estoque">${icon('bell')}</button>
        <button class="header-button menu-toggle" data-action="menu" aria-label="Menu principal" aria-expanded="false" aria-controls="main-menu">${icon('menu')}</button>
      </div>
    </div>
    <nav class="site-nav" id="main-menu" aria-label="Menu principal">
      ${nav.filter(([id])=>id!=='api').map(navLink).join('')}
      <details class="more-options">
        <summary class="nav-item">Mais opções</summary>
        <div class="more-options-panel">
          ${apiLink ? navLink(apiLink) : ''}
          <button class="nav-item" data-action="view-rbac">${icon('shield')}Matriz de Permissões</button>
          <a class="nav-item" href="#/apresentacao">${icon('play')}Apresentação executiva</a>
          <button class="nav-item" data-action="reset">${icon('refresh')}Reiniciar simulação</button>
        </div>
      </details>
    </nav>
  </header>

  <main class="main">
    <div class="content">
      ${content}
      <footer class="page-footer">
        <span>Circuito da Estrada Real · Feito para valorizar quem produz e encantar quem recebe.</span>
        <span>Projeto de Engenharia da Computação · ERP Encantos da Serra</span>
      </footer>
    </div>
  </main>`;
}

function customerHeaderContacts(){
  return `<address class="header-contacts" aria-label="Contato do Empório">${officialContactItems()}</address>`;
}

/* TELA DE ACESSO RESTRITO / PERMISSÃO NEGADA (403) */
function forbiddenPage(prof, requestedRoute){
  return `
  <section class="forbidden-screen">
    <div class="forbidden-icon">
      ${icon('lock')}
    </div>
    <div class="eyebrow" style="color:var(--terracota)">SEGURANÇA & GOVERNANÇA DE DADOS (403)</div>
    <h2>Acesso Restrito ao Módulo</h2>
    <p>
      O perfil ativo atual <strong>${esc(prof.name)}</strong> (<em>${esc(prof.role)}</em>) não possui permissão para acessar o módulo <code>#/${esc(requestedRoute)}</code>.
    </p>

    <div class="forbidden-box">
      <strong>🛡️ Restrições Ativas para este Perfil:</strong>
      <ul>
        ${prof.restricoes.map(r=>`<li>${esc(r)}</li>`).join('')}
      </ul>
      <p style="margin:12px 0 0;font-size:11px;color:var(--pedra)">
        Por segurança e conformidade, dados estratégicos de estoque geral, custos de terceiros e finanças do empório permanecem estritamente isolados da visualização de perfis externos ou com escopo restrito.
      </p>
    </div>

    <div class="actions" style="justify-content:center;margin-top:24px">
      <button class="btn primary" data-action="navigate" data-route="visao-geral">
        Voltar para o Painel Permitido
      </button>
      <button class="btn soft" data-action="view-rbac">
        ${icon('shield')} Consultar Matriz de Permissões
      </button>
    </div>
  </section>`;
}

function orderRows(orders){
  const prof=currentProfile();
  return orders.map(o=>{
    const c=customer(o.customerId);
    const hasRes=o.reservations&&o.reservations.length>0;
    const clientDisplay=prof.type==='supplier'?'Cliente Varejo (Remessa Canastra)':esc(c.name);
    return `<tr>
      <td><button class="text-link" data-action="order" data-id="${o.id}"><strong>${o.id}</strong></button></td>
      <td>
        <div class="customer-cell">
          <div class="avatar">${initials(clientDisplay)}</div>
          <div>
            <strong>${clientDisplay}</strong>
            <span class="cell-muted">${c.type} · ${esc(c.city||'Minas Gerais')}</span>
          </div>
        </div>
      </td>
      <td><span class="ticket-channel">${esc(o.channel)}</span></td>
      <td>${badge(o.status)} ${hasRes?'<span class="badge reserve">🔒 Reservado</span>':''}</td>
      <td class="money"><strong>${money(E.total(o))}</strong></td>
      <td>${short(o.delivery)}</td>
    </tr>`;
  }).join('');
}

function dashboard(){
  const prof=currentProfile();
  const ordersList=getOrders();
  const active=ordersList.filter(o=>o.status!=='concluido');
  const userLots=E.filterLotsForProfile(state, prof);
  const userReceivables=E.filterReceivablesForProfile(state, prof);
  const openReceivables=userReceivables.filter(r=>E.balance(r)>0);
  const blockedLots=userLots.filter(l=>E.days(l.expiry)<=7&&l.qty>0);
  const lowStock=state.products.filter(p=>E.stock(state,p.id,true)<p.minimum);
  const todayTotal=ordersList.filter(o=>o.completedAt===E.TODAY).reduce((a,o)=>a+E.total(o),0);
  const stageTotals=['novo','analise','separacao','pronto','concluido'].map(s=>ordersList.filter(o=>o.status===s).reduce((a,o)=>a+E.total(o),0));
  const max=Math.max(...stageTotals,1);

  let bannerNotice='';
  let metricsSection='';

  if(prof.type==='client'){
    bannerNotice=`
    <div class="portal-welcome-card">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <h2>Área do Parceiro Comercial B2B · ${esc(prof.name)}</h2>
        <span class="badge green">Portal B2B Autenticado</span>
      </div>
      <p>Você tem acesso exclusivo aos pedidos da sua empresa, catálogo com preços comerciais e extrato de faturas com vencimento acordado. Dados de fornecedores, estoques internos e clientes de terceiros estão resguardados.</p>
    </div>`;

    metricsSection=`
    <div class="metrics">
      ${metric('Meus pedidos ativos',active.length,`${active.filter(o=>o.status==='novo').length} no Marco Zero aguardando separação`,'board')}
      ${metric('Total faturado entregue',money(todayTotal),'Histórico de compras liquidadas','chart')}
      ${metric('Minhas faturas a pagar',money(openReceivables.reduce((a,r)=>a+E.balance(r),0)),`${openReceivables.length} fatura a prazo em aberto`,'wallet')}
      ${metric('Recompra em 1 clique',ordersList.length?'Disponível':'Sem pedidos','Reponha queijos Canastra com rapidez','leaf')}
    </div>`;
  } else if(prof.type==='supplier'){
    bannerNotice=`
    <div class="portal-welcome-card">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <h2>Extranet do Produtor Canastra · ${esc(prof.name)}</h2>
        <span class="badge green">Portal do Produtor Ativo</span>
      </div>
      <p>Visão restrita às remessas de queijo fornecidas pela sua fazenda. O estoque geral de outros produtores e o financeiro global do empório estão inacessíveis por governança.</p>
    </div>
    <div class="segregated-banner">
      ${icon('shield')}
      <div>
        <strong>Privacidade e Segregação de Dados Ativa:</strong>
        Você visualiza exclusivamente os lotes e pedidos referentes ao <strong>Queijo Minas Artesanal Canastra</strong> (${userLots.length} lotes na câmara). Dados de outros produtores de doces, cachaças e embutidos não são exibidos.
      </div>
    </div>`;

    metricsSection=`
    <div class="metrics">
      ${metric('Remessas em andamento',active.length,`${active.length} pedidos em separação contendo seu queijo`,'board')}
      ${metric('Minhas peças na câmara',userLots.reduce((a,l)=>a+l.qty,0),'Saldo físico dos lotes da Família Oliveira','box')}
      ${metric('Capacidade mensal', '124 / 180 un', '69% da cota mensal comprometida com a Encantos', 'compass')}
      ${metric('Lotes em atenção', blockedLots.length, `${blockedLots.length} lote com corte em 7 dias`, 'alert')}
    </div>`;
  } else if(prof.id==='estoque'){
    metricsSection=`
    <div class="metrics">
      ${metric('Pedidos em separação',ordersList.filter(o=>['separacao','pronto'].includes(o.status)).length,'Aguardando picking e embalagem térmica','board')}
      ${metric('Peças no almoxarifado',userLots.reduce((a,l)=>a+l.qty,0),'Saldo físico total nas câmaras frigoríficas','box')}
      ${metric('Alocadas em reserva',userLots.reduce((a,l)=>a+(l.reserved||0),0),'Unidades reservadas com soft-lock','lock')}
      ${metric('Atenção ao vencimento',blockedLots.length,`${blockedLots.length} lote com menos de 7 dias de validade`,'alert')}
    </div>`;
  } else {
    // Admin, Financeiro, Atendimento, Compras
    metricsSection=`
    <div class="metrics">
      ${metric('Pedidos em andamento',active.length,`${active.filter(o=>o.status==='novo').length} no Marco Zero aguardando curadoria`,'board')}
      ${metric('Concluído na rota',money(todayTotal),'Valor dos pedidos entregues e liquidados hoje','chart')}
      ${metric('A receber (Fiado/Prazo)',money(openReceivables.reduce((a,r)=>a+E.balance(r),0)),`<b>${openReceivables.filter(r=>E.days(r.due)<0).length} conta vencida</b> · vendas a prazo acompanhadas`,'wallet')}
      ${metric('Atenção ao estoque',blockedLots.length+lowStock.length,`${blockedLots.length} lotes em limite de 7 dias · ${lowStock.length} produtos em reposição`,'box')}
    </div>`;
  }

  return pageHeading(
    'CIRCUITO ESTRADA REAL · GESTÃO INTEGRADA',
    'Um bom dia para encantar.',
    `Perfil ativo: <strong>${prof.name}</strong> (${prof.description}).`,
    prof.type==='internal'?button('Formulário do cliente','public','link','')+button('Novo pedido','new-order','plus','btn terracota'):''
  )+
  bannerNotice+
  (prof.type==='internal'?officialBanner():'')+
  metricsSection+
  `<div class="dashboard-grid">
    <div>
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Etapas do Caminho Real</h2>
            <p class="subtitle">Valor total dos pedidos em cada marco do percurso</p>
          </div>
          <span class="badge gray">Posição na Rota</span>
        </div>
        <div class="chart">
          ${stageTotals.map((v,i)=>`
            <div class="chart-col">
              <b>${money(v)}</b>
              <div class="bar ${i===4?'dark':''}" style="height:${Math.max(5,v/max*112)}px"></div>
              <small>${['Marco Zero','Curadoria','Na Tulha','Porteira','Entregue'][i]}</small>
            </div>
          `).join('')}
        </div>
        <div class="chart-legend">
          <span><i class="legend-square"></i>Em atendimento & separação</span>
          <span><i class="legend-square dark"></i>Entregues & Baixados</span>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Pedidos recentes na rota</h2>
          <button class="text-link" data-action="navigate" data-route="pedidos">Ver todos os pedidos ${icon('arrow')}</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Pedido</th><th>Cliente</th><th>Origem</th><th>Etapa</th><th>Valor</th><th>Entrega</th></tr>
            </thead>
            <tbody>
              ${orderRows(ordersList.slice(0,5))}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div>
      <section class="panel">
        <div class="panel-head">
          <h2>${prof.type==='supplier'?'Alertas das Remessas Canastra':'Alertas da Estrada Real'}</h2>
          <span class="badge amber">${blockedLots.length}</span>
        </div>
        ${blockedLots.map(l=>`
          <div class="alert-row">
            <div class="alert-symbol red">${icon('alert')}</div>
            <div>
              <strong>Lote próximo ao corte de validade (7 dias)</strong>
              <p>${product(l.productId).name} · ${esc(l.code)}<br>Vence em ${short(l.expiry)} · ${l.qty} un. bloqueadas para pedidos online</p>
              <button class="text-link" data-action="navigate" data-route="estoque">Conferir lote ${icon('arrow')}</button>
            </div>
          </div>
        `).join('')}
        ${prof.type==='supplier'?`
          <div class="alert-row">
            <div class="alert-symbol green">${icon('compass')}</div>
            <div>
              <strong>Queijaria Canastra Homologada</strong>
              <p>Certificação sanitária ativa. Próxima remessa de queijos programada para terça-feira.</p>
            </div>
          </div>
        `:''}
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Livro de registros da rota</h2>
          ${icon('clock')}
        </div>
        <div class="activity">
          ${state.activity.slice(0,4).map(a=>`
            <div class="activity-item">
              <i class="activity-point"></i>
              <div>
                <p>${esc(a.title)}</p>
                <small>${esc(a.detail)} · ${short(a.date)}</small>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  </div>`;
}

function card(o){
  const c=customer(o.customerId);
  const prof=currentProfile();
  const hasReservation=o.reservations&&o.reservations.length>0;
  const clientTitle=prof.type==='supplier'?'Pedido Contendo Queijo Canastra':esc(c.name);
  return `
  <button class="ticket" data-action="order" data-id="${o.id}">
    <div class="ticket-top">
      <span class="ticket-id">${o.id}</span>
      <span class="ticket-channel">${esc(o.channel)}</span>
    </div>
    <h3>${clientTitle}</h3>
    <span class="badge ${c.type==='B2B'?'amber':'gray'}">${c.type==='B2B'?'Comercial B2B':'Consumidor Varejo'}</span>
    ${hasReservation?'<span class="badge reserve">🔒 Lote Reservado</span>':''}
    ${o.kind==='personalizado'?`<p class="ticket-custom">✧ Cesta / Personalizado${!o.approved?' · aguardando orçamento':''}</p>`:''}
    <p class="summary">${o.items.slice(0,2).map(i=>`${i.qty}× ${esc(product(i.productId).name)}`).join('<br>')}${o.items.length>2?`<br>+ ${o.items.length-2} produto(s)`:''}</p>
    <div class="ticket-footer">
      <span>${short(o.delivery)}${o.payment==='fiado'?' · a prazo':''}</span>
      <strong>${money(E.total(o))}</strong>
    </div>
  </button>`;
}

function board(custom=false){
  const prof=currentProfile();
  let list=getOrders(custom?'personalizado':undefined);
  if(filter==='b2b') list=list.filter(o=>customer(o.customerId).type==='B2B');
  if(filter==='whatsapp') list=list.filter(o=>o.channel==='WhatsApp');
  if(query) list=list.filter(o=>(customer(o.customerId).name+' '+o.id).toLowerCase().includes(query.toLowerCase()));

  const stageKeys=['novo','analise','separacao','pronto','concluido'];
  const stageTitles={
    novo:'🚩 Marco Zero',
    analise:'⚖️ Curadoria',
    separacao:'🧺 Na Tulha',
    pronto:'📦 Na Porteira',
    concluido:'🏡 Entregue'
  };

  let segregationNotice='';
  if(prof.type==='client'){
    segregationNotice=`<div class="segregated-banner">${icon('shield')} <div><strong>Visão Segregada B2B:</strong> Acompanhando exclusivamente os pedidos realizados pelo <strong>${esc(prof.name)}</strong>. Pedidos de outros estabelecimentos estão ocultos.</div></div>`;
  } else if(prof.type==='supplier'){
    segregationNotice=`<div class="segregated-banner">${icon('shield')} <div><strong>Visão Segregada do Produtor:</strong> Exibindo exclusivamente os pedidos que contêm <strong>Queijo Minas Artesanal Canastra</strong>. Dados cadastrais e telefones de consumidores estão protegidos.</div></div>`;
  }

  return pageHeading(
    'CENTRAL DE PEDIDOS · CAMINHO DA SERRA',
    custom?'Curadoria de Cestas & Personalizados':'Trilha de Atendimento Estrada Real',
    custom?'Orçamentos detalhados, embalagens térmicas e aprovação prévia.':'Acompanhe o pedido desde o Marco Zero até a entrega na casa do cliente.',
    prof.type==='internal'?button('Formulário do cliente','public','link','')+button('Novo pedido','new-order','plus','btn terracota'):''
  )+
  segregationNotice+
  `<div class="toolbar">
    <div class="tabs" role="group" aria-label="Filtros de pedidos">
      ${[['todos',custom?'Personalizados':'Todos os pedidos'],['b2b','Empórios e Pousadas (B2B)'],['whatsapp','Canal WhatsApp']].map(([f,t])=>`
        <button class="tab ${filter===f?'active':''}" data-action="filter" data-filter="${f}">${t}</button>
      `).join('')}
    </div>
    <label class="search">
      ${icon('search')}
      <span class="screen-reader">Buscar pedido ou cliente</span>
      <input id="order-search" placeholder="Buscar pedido ou código" value="${esc(query)}">
    </label>
  </div>
  <div class="board">
    ${stageKeys.map(s=>`
      <section class="column">
        <div class="column-head">
          <i class="totem-icon"></i>
          <span>${stageTitles[s]}</span>
          <small>${list.filter(o=>o.status===s).length}</small>
        </div>
        ${list.filter(o=>o.status===s).map(card).join('')||'<div class="empty">Nenhum pedido neste marco da rota.</div>'}
      </section>
    `).join('')}
  </div>
  <div class="note">
    ${icon('compass')} <strong>Garantia de Origem e Reserva (Soft-Lock):</strong> Ao avançar o pedido para <em>Na Tulha (Separação)</em>, o sistema reserva automaticamente os lotes FEFO com validade superior a 7 dias, protegendo contra furos de estoque. A baixa definitiva ocorre apenas na confirmação de entrega.
  </div>`;
}

function inventory(){
  const prof=currentProfile();
  const lots=E.filterLotsForProfile(state, prof);

  let segregationNotice='';
  if(prof.type==='supplier'){
    segregationNotice=`
    <div class="segregated-banner">
      ${icon('shield')}
      <div>
        <strong>Isolamento de Segurança Ativo:</strong>
        Você está navegando como <strong>${esc(prof.name)}</strong>. Esta visualização exibe exclusivamente os lotes fornecidos pela sua queijaria (${lots.length} lotes de Queijo Canastra). O estoque geral de outros produtores (doces, cachaças, embutidos) e os custos internos do empório estão bloqueados por governança.
      </div>
    </div>`;
  }

  const canManageStock=prof.id==='admin'||prof.id==='estoque';

  return pageHeading(
    'ALMOXARIFADO & RASTREABILIDADE',
    prof.type==='supplier'?`Remessas de Queijo da ${prof.name}`:'Lotes Artesanais da Canastra & Estrada Real',
    prof.type==='supplier'?'Acompanhamento técnico das suas peças entregues e armazenadas no empório.':'Controle de validade FEFO, conferência de pesagem (±5%) e separação técnica.',
    canManageStock?button('Receber novo lote','stock-entry','plus','btn primary'):''
  )+
  segregationNotice+
  `<div class="metrics">
    ${metric(prof.type==='supplier'?'Minhas peças no empório':'Unidades em estoque',lots.reduce((a,l)=>a+l.qty,0),'Saldo físico auditado nas câmaras','box')}
    ${metric('Liberadas (FEFO > 7d)',lots.filter(l=>E.days(l.expiry)>7).reduce((a,l)=>a+l.qty,0),'Elegíveis para atendimento online imediato','check')}
    ${metric('Alocadas em reserva',lots.reduce((a,l)=>a+(l.reserved||0),0),'Unidades reservadas com soft-lock','lock')}
    ${metric('Lotes em atenção/bloqueio',lots.filter(l=>E.days(l.expiry)<=15&&l.qty>0).length,'Vencimento em menos de 15 dias','alert')}
  </div>
  <section class="panel">
    <div class="panel-head">
      <div>
        <h2>${prof.type==='supplier'?'Lotes Fornecidos por Você':'Inventário detalhado por lote'}</h2>
        <p class="subtitle">Ordenação inteligente por data de vencimento e tempo de recebimento</p>
      </div>
      <span class="badge green">Algoritmo FEFO Ativo</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produto / Queijaria</th>
            <th>Lote</th>
            <th>Validade</th>
            <th>Físico</th>
            <th>Reservado</th>
            <th>Disponível</th>
            <th>Situação</th>
            <th>Localização</th>
            ${canManageStock?'<th>Ações</th>':''}
          </tr>
        </thead>
        <tbody>
          ${lots.map(l=>{
            const p=product(l.productId), d=E.days(l.expiry), res=l.reserved||0, avail=Math.max(0,l.qty-res);
            return `<tr>
              <td>
                <div class="customer-cell">
                  ${officialProductThumb(p)}
                  <div>
                    <strong class="product-label">${esc(p.name)}</strong>
                    <span class="cell-muted">${esc(p.producer)}</span>
                  </div>
                </div>
              </td>
              <td><code>${esc(l.code)}</code></td>
              <td>
                ${l.expiry?date(l.expiry):'Indeterminada'}
                <span class="cell-muted">${l.expiry?(d<0?'Vencido':d+' dias restantes'):'Produto não perecível'}</span>
              </td>
              <td><strong>${l.qty}</strong> ${p.unit}</td>
              <td>${res>0?`<span class="badge reserve">🔒 ${res}</span>`:'0'}</td>
              <td><strong style="color:var(--madeira)">${avail}</strong></td>
              <td><span class="badge ${d<=7?'red':d<=15?'amber':'green'}">${d<=7?'Bloqueado (<=7d)':d<=15?'Atenção (<=15d)':'Liberado'}</span></td>
              <td>${esc(l.location)}</td>
              ${canManageStock?`<td><button class="text-link" data-action="loss" data-id="${l.id}" ${!l.qty?'disabled':''}>Registrar perda</button></td>`:''}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </section>`;
}

function finance(){
  const prof=currentProfile();
  const userReceivables=E.filterReceivablesForProfile(state, prof);
  const open=userReceivables.filter(r=>E.balance(r)>0);
  const late=open.filter(r=>E.days(r.due)<0);
  const paid=userReceivables.reduce((a,r)=>a+r.payments.reduce((n,p)=>n+p.amount,0),0);

  let rows=userReceivables;
  if(financeFilter==='abertas') rows=open;
  if(financeFilter==='vencidas') rows=late;
  if(financeFilter==='quitadas') rows=rows.filter(r=>E.balance(r)===0);

  let segregationNotice='';
  if(prof.type==='client'){
    segregationNotice=`
    <div class="segregated-banner">
      ${icon('shield')}
      <div>
        <strong>Extrato Financeiro B2B Isolado:</strong>
        Exibindo exclusivamente as faturas faturadas a prazo para <strong>${esc(prof.name)}</strong>. O faturamento global do empório e dados de outros clientes estão estritamente resguardados.
      </div>
    </div>`;
  }

  const isB2B=prof.type==='client';

  return pageHeading(
    isB2B?'MINHAS FATURAS & PRAZO (B2B)':'FINANCEIRO & CRÉDITO',
    isB2B?`Controle de Pagamentos de ${prof.name}`:'Contas a Receber e Vendas a Prazo (Fiado)',
    isB2B?'Consulte suas faturas em aberto e quitações com a Encantos da Serra.':'Controle de pagamentos à vista, fiado comercial B2B e quitações parciais.',
    ''
  )+
  segregationNotice+
  `<div class="metrics">
    ${metric(isB2B?'Meu saldo a liquidar':'Total a receber',money(open.reduce((a,r)=>a+E.balance(r),0)),`${open.length} faturas com saldo em aberto`,'wallet')}
    ${metric(isB2B?'Faturas em atraso':'Em atraso',money(late.reduce((a,r)=>a+E.balance(r),0)),`${late.length} conta com data acordada vencida`,'alert')}
    ${metric(isB2B?'Total já quitado':'Recebimentos liquidados',money(paid),'Total pago via Pix, Cartão e Dinheiro','check')}
    ${metric(isB2B?'Condição autorizada':'Clientes com fiado',isB2B?'A prazo (15 dias)':new Set(open.map(r=>r.customerId)).size,'Política comercial acordada','users')}
  </div>
  <div class="toolbar">
    <div class="tabs" aria-label="Filtrar contas">
      ${[['abertas','Em aberto'],['vencidas','Vencidas'],['quitadas','Quitadas'],['todas','Todas as contas']].map(([v,t])=>`
        <button class="tab ${financeFilter===v?'active':''}" data-action="finance-filter" data-filter="${v}">${t}</button>
      `).join('')}
    </div>
    <span class="micro">Data de referência do sistema: ${date(E.TODAY)}</span>
  </div>
  <section class="panel">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Protocolo / Pedido</th>
            <th>Valor da Venda</th>
            <th>Vencimento</th>
            <th>Já Recebido</th>
            <th>Saldo Aberto</th>
            <th>Situação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r=>{
            const b=E.balance(r), isLate=b>0&&E.days(r.due)<0;
            return `<tr>
              <td>
                <button class="text-link" data-action="order" data-id="${r.orderId}"><strong>Pedido ${r.orderId}</strong></button>
              </td>
              <td>${money(r.total)}</td>
              <td>${date(r.due)}</td>
              <td>${money(r.total-b)}</td>
              <td><strong style="color:${b>0?'var(--terracota)':'var(--madeira)'}">${money(b)}</strong></td>
              <td><span class="badge ${b===0?'green':isLate?'red':'amber'}">${b===0?'Quitado':isLate?'Vencido':'A vencer'}</span></td>
              <td>
                <button class="btn soft" style="font-size:10px;padding:5px 10px" data-action="payment" data-id="${r.id}">
                  ${b===0?'Ver recibos':'Registrar recebimento'}
                </button>
              </td>
            </tr>`;
          }).join('')||'<tr><td colspan="7"><div class="empty">Nenhuma fatura encontrada neste filtro.</div></td></tr>'}
        </tbody>
      </table>
    </div>
  </section>`;
}

function clients(){
  return pageHeading(
    'RELACIONAMENTO COM CLIENTES',
    'Carteira de Consumidores e Parceiros B2B',
    'Histórico de pedidos, cidades da Estrada Real e controle de compras.',
    button('Novo cliente','new-client','plus','btn terracota')
  )+
  `<section class="panel">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Perfil</th>
            <th>Canal de Entrada</th>
            <th>Cidade</th>
            <th>Pedidos Realizados</th>
            <th>Saldo em Aberto</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          ${state.customers.map(c=>`
            <tr>
              <td>
                <div class="customer-cell">
                  <div class="avatar">${esc(initials(c.name))}</div>
                  <div>
                    <strong>${esc(c.name)}</strong>
                    <span class="cell-muted">${esc(c.contact)}</span>
                  </div>
                </div>
              </td>
              <td><span class="badge ${c.type==='B2B'?'amber':'green'}">${c.type==='B2B'?'Comercial B2B':'Consumidor Varejo'}</span></td>
              <td>${esc(c.channel)}</td>
              <td>${esc(c.city||'Minas Gerais')}</td>
              <td><strong>${state.orders.filter(o=>o.customerId===c.id).length}</strong></td>
              <td><strong class="money">${money(state.receivables.filter(r=>r.customerId===c.id).reduce((a,r)=>a+E.balance(r),0))}</strong></td>
              <td><button class="text-link" data-action="client" data-id="${c.id}">Ficha do cliente ${icon('arrow')}</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </section>`;
}

/* MODAL DA MATRIZ COMPLETA DE PERMISSÕES & SEGURANÇA (RBAC) */
function rbacModal(){
  openModal(
    modalHead('SEGURANÇA & GOVERNANÇA','Matriz Exata de Atribuições & Permissões')+
    `<p class="subtitle" style="margin-bottom:20px">
      Detalhamento formal de permissões, responsabilidades operacionais e restrições de isolamento de dados para cada ator do Encantos da Serra ERP.
    </p>
    <div class="rbac-grid">
      ${E.PROFILES.map(p=>`
        <div class="rbac-card">
          <div class="rbac-card-header">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="avatar" style="background:${p.avatarBg};color:${p.avatarColor};width:36px;height:36px">${p.initials}</div>
              <div>
                <strong style="font-size:14px;color:var(--ink)">${esc(p.name)}</strong>
                <span class="badge ${p.type==='internal'?'green':p.type==='client'?'amber':'blue'}" style="margin-left:6px">${esc(p.role)}</span>
              </div>
            </div>
            <button class="btn soft" style="font-size:10px" data-action="set-profile" data-profile="${p.id}">
              ${state.currentProfile===p.id?'Ativo':'Alternar para este'}
            </button>
          </div>

          <div style="margin-bottom:12px">
            <span class="field-label">Atribuições e Responsabilidades:</span>
            <ul class="rbac-list">
              ${p.atribuicoes.map(a=>`<li>${esc(a)}</li>`).join('')}
            </ul>
          </div>

          <div class="rbac-columns">
            <div>
              <span class="field-label" style="color:var(--green)">✓ Permissões Concedidas:</span>
              <ul class="rbac-list allowed">
                ${p.permissoes.map(a=>`<li>${esc(a)}</li>`).join('')}
              </ul>
            </div>
            <div>
              <span class="field-label" style="color:var(--terracota)">⛔ Restrições de Segurança (Dados Ocultos):</span>
              <ul class="rbac-list denied">
                ${p.restricoes.map(r=>`<li>${esc(r)}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--divisor);font-size:10px;color:var(--muted)">
            <strong>Módulos Acessíveis:</strong> ${p.allowedRoutes.join(', ')}
          </div>
        </div>
      `).join('')}
    </div>
    <div class="modal-footer">
      <button class="btn primary" data-action="close">Fechar Matriz</button>
    </div>`
  );
}

/* MODAL DE ALTERNÂNCIA DE PERFIS */
function switchProfileModal(){
  const current=currentProfile();
  openModal(
    modalHead('SIMULADOR DE SESSÕES & PERFIS','Quem está navegando no ERP?')+
    `<p class="subtitle" style="margin-bottom:16px">
      Alterne o perfil ativo para experimentar como a interface, os menus e as permissões se comportam para cada ator do ecossistema Encantos da Serra.
    </p>
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
      <button class="text-link" data-action="view-rbac">${icon('shield')} Consultar Descrição Exata de Permissões (RBAC)</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;max-height:55vh;overflow-y:auto;padding-right:4px">
      ${E.PROFILES.map(p=>{
        const isSelected=p.id===current.id;
        return `
          <div style="border:1px solid ${isSelected?'var(--ouro)':'var(--border)'};background:${isSelected?'var(--ouro-soft)':'#ffffff'};padding:14px 18px;border-radius:9px;display:flex;align-items:center;justify-content:space-between;gap:14px;box-shadow:${isSelected?'0 3px 10px rgba(195,153,67,0.15)':'none'}">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="avatar" style="background:${p.avatarBg};color:${p.avatarColor};width:38px;height:38px;font-size:13px">${p.initials}</div>
              <div>
                <strong style="font-size:13px;display:block;color:var(--ink)">${esc(p.name)} ${isSelected?'<span class="badge green" style="margin-left:6px">Perfil Ativo</span>':''}</strong>
                <span style="font-size:11px;color:var(--terracota);font-weight:600">${esc(p.role)} · ${p.type==='internal'?'Equipe Interna':p.type==='client'?'Cliente B2B':'Produtor Rural'}</span>
                <p style="font-size:10px;color:var(--muted);margin:4px 0 0">${esc(p.description)}</p>
              </div>
            </div>
            <button class="btn ${isSelected?'soft':'primary'}" data-action="set-profile" data-profile="${p.id}" ${isSelected?'disabled':''}>
              ${isSelected?'Em uso':'Mudar perfil'}
            </button>
          </div>
        `;
      }).join('')}
    </div>
    <div class="modal-footer">
      <button class="btn" data-action="close">Fechar</button>
    </div>`
  );
}

function openModal(content){
  lastFocus=document.activeElement;
  $('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1">${content}</section></div>`;
  document.body.style.overflow='hidden';
  $('.modal').focus();
}

function closeModal(){
  $('#modal-root').innerHTML='';
  document.body.style.overflow='';
  lastFocus?.focus?.();
}

function modalHead(eyebrow,title){
  return `<div class="modal-header"><div><span class="eyebrow">${eyebrow}</span><h2 id="dialog-title">${title}</h2></div><button class="icon-button" data-action="close" aria-label="Fechar">${icon('close')}</button></div>`;
}

function orderDetail(id){
  const o=state.orders.find(o=>o.id===id), c=customer(o.customerId), statusKeys=['novo','analise','separacao','pronto','concluido'];
  const prof=currentProfile();
  let allocations=[], planError='';
  if(!['concluido','cancelado'].includes(o.status)){
    try{ allocations=E.plan(state,o); }catch(e){ planError=e.message; }
  } else {
    allocations=o.allocations||[];
  }
  const hasReservation=o.reservations&&o.reservations.length>0;

  openModal(
    modalHead(o.id,prof.type==='supplier'?'Pedido Contendo Queijo Canastra':esc(c.name))+
    `<div class="actions">
      ${badge(o.status)}
      <span class="badge gray">${esc(o.channel)}</span>
      <span class="badge amber">Simulação Estrada Real</span>
      ${hasReservation?'<span class="badge reserve">🔒 Lote Reservado (Soft-Lock Ativo)</span>':''}
      ${o.kind==='personalizado'?'<span class="badge purple">Cesta Personalizada</span>':''}
    </div>
    <div class="modal-section details-grid">
      <div><span class="field-label">Previsão de entrega</span><div class="field-value">${date(o.delivery)}</div></div>
      <div><span class="field-label">Condição acordada</span><div class="field-value">${o.payment==='fiado'?'A prazo · vencimento em '+date(o.due):o.payment==='pix'?'Pix com conferência':'Cartão'}</div></div>
      <div style="grid-column:1/-1"><span class="field-label">Orientações do cliente</span><div class="field-value">${esc(o.notes||'Sem observações adicionais.')}</div></div>
    </div>
    ${o.custom?`<div class="note"><strong>Detalhes da Personalização:</strong><br>${esc(o.custom)}<br>${o.approved?'✓ Orçamento aprovado pela curadoria.':'⚠️ Aguardando aprovação formal do orçamento.'}</div>`:''}
    <div class="modal-section">
      <h3>Iguarias solicitadas</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Produto</th><th>Qtd.</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${o.items.map(i=>`<tr><td>${esc(product(i.productId).name)}</td><td>${i.qty}</td><td>${money(i.qty*i.price)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="form-total"><span>Total do pedido</span><strong>${money(E.total(o))}</strong></div>
    </div>
    ${prof.type!=='client'?`
    <div class="modal-section">
      <h3>Separação técnica & Conservação</h3>
      ${planError?`<div class="note red">${esc(planError)}</div>`:
        allocations.length?allocations.map(a=>{
          const l=state.lots.find(l=>l.id===a.lotId), p=product(a.productId);
          return `<div class="note">
            <strong>${a.qty}× ${p.name} · Lote: ${esc(l.code)}</strong><br>
            Local: ${esc(l.location)} · ${l.expiry?'Validade: '+date(l.expiry):'Validade indeterminada'}<br>
            Embalagem: ${p.packing||'Embalagem padrão para viagem'}
          </div>`;
        }).join(''):'<p class="subtitle" style="margin-top:12px">Pedido histórico ou concluído anteriormente.</p>'
      }
    </div>`:''}
    <div class="modal-footer">
      ${prof.type==='internal'&&!['concluido','cancelado'].includes(o.status)?`<button class="btn danger" data-action="cancel-order" data-id="${id}">Cancelar pedido</button>`:''}
      ${prof.type==='internal'&&o.kind==='personalizado'&&!o.approved&&!['concluido','cancelado'].includes(o.status)?`<button class="btn primary" data-action="approve" data-id="${id}">Registrar aprovação de orçamento</button>`:''}
      ${prof.type==='internal'&&!['concluido','cancelado'].includes(o.status)&&!(o.kind==='personalizado'&&!o.approved)?`
        <button class="btn primary" data-action="advance" data-id="${id}" ${planError&&o.status==='pronto'?'disabled':''}>
          ${o.status==='pronto'?'Concluir e dar baixa final':`Avançar para: ${statuses[statusKeys[statusKeys.indexOf(o.status)+1]][0]}`} ${icon('arrow')}
        </button>
      `:''}
      ${prof.type==='client'&&o.status==='concluido'?`
        <button class="btn terracota" data-action="reorder" data-id="${id}">Solicitar Recompra</button>
      `:''}
    </div>`
  );
}

function stockModal(pid){
  openModal(
    modalHead('RECEBIMENTO DE PRODUTORES','Novo Lote de Iguarias')+
    `<form id="stock-form">
      <div class="form-grid">
        <label class="wide">Produto da Estrada Real
          <select name="productId">
            ${state.products.map(p=>`<option value="${p.id}" ${p.id===pid?'selected':''}>${p.name} (${p.producer})</option>`).join('')}
          </select>
        </label>
        <label>Código do Lote<input name="code" required maxlength="40" placeholder="Ex.: QMC-1105"></label>
        <label>Quantidade de Peças / Un.<input name="qty" type="number" required min="1" max="99999" step="1"></label>
        <label>Peso Esperado Total (g)<input name="expectedWeight" type="number" placeholder="Ex: 1000g"></label>
        <label>Peso Aferido em Balança (g)<input name="actualWeight" type="number" placeholder="Ex: 1040g"></label>
        <label>Data de Fabricação<input type="date" name="manufactured" required max="${E.TODAY}"></label>
        <label>Data de Validade<input type="date" name="expiry" min="${E.TODAY}"></label>
        <label>Custo Unitário de Referência (R$)<input name="cost" type="number" required min="0.01" step="0.01"></label>
        <label>Local de Armazenamento<input name="location" required maxlength="80" placeholder="Câmara A · 02"></label>
      </div>
      <div class="note"><strong>Tolerância de Pesagem:</strong> Queijos artesanais têm margem de tolerância aceita de até ±5%. Caso haja divergência maior, será solicitada justificativa no ato.</div>
      <div class="form-error" role="alert"></div>
      <div class="modal-footer">
        <button class="btn" type="button" data-action="close">Voltar</button>
        <button class="btn primary" type="submit">Cadastrar e Liberar Lote</button>
      </div>
    </form>`
  );
}

function lossModal(id){
  const l=state.lots.find(l=>l.id===id);
  openModal(
    modalHead('REGISTRO DE PERDAS JUSTIFICADAS',esc(l.code))+
    `<p class="subtitle">${product(l.productId).name} · Saldo físico de ${l.qty} unidades</p>
    <form id="loss-form" data-id="${id}">
      <div class="form-grid" style="margin-top:22px">
        <label>Quantidade a baixar<input name="qty" type="number" min="1" max="${l.qty}" required step="1"></label>
        <label>Motivo da perda
          <select name="reason">
            <option>Avaria no transporte</option>
            <option>Validade expirada</option>
            <option>Falha de refrigeração</option>
            <option>Aferição de pesagem divergente</option>
          </select>
        </label>
        <label class="wide">Justificativa técnica detalhada<textarea name="notes" required maxlength="500" placeholder="Descreva a ocorrência para auditoria..."></textarea></label>
      </div>
      <div class="form-error" role="alert"></div>
      <div class="modal-footer">
        <button class="btn primary" type="submit">Confirmar Baixa de Perda</button>
      </div>
    </form>`
  );
}

function paymentModal(id){
  const r=state.receivables.find(r=>r.id===id), b=E.balance(r);
  openModal(
    modalHead('RECEBIMENTOS & QUITAÇÕES',esc(customer(r.customerId).name))+
    `<p class="subtitle">Protocolo ${r.orderId} · Vencimento acordado: ${date(r.due)}</p>
    <div class="form-total">
      <span>Saldo em aberto a receber</span>
      <strong>${money(b)}</strong>
    </div>
    ${b>0?`
      <form id="payment-form" data-id="${id}">
        <div class="form-grid">
          <label>Valor a liquidar agora (R$)<input name="amount" type="number" min="0.01" max="${b}" step="0.01" value="${b}" required></label>
          <label>Meio de pagamento
            <select name="method">
              <option value="pix">Pix com comprovante</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão de Débito/Crédito</option>
              <option value="transferencia">Transferência Bancária</option>
            </select>
          </label>
        </div>
        <div class="form-error" role="alert"></div>
        <div class="modal-footer">
          <button class="btn primary" type="submit">Registrar Quitação</button>
        </div>
      </form>
    `:''}
    <div class="modal-section">
      <h3>Histórico de pagamentos desta conta</h3>
      ${r.payments.length?`
        <table>
          <thead><tr><th>Data</th><th>Meio</th><th>Valor</th></tr></thead>
          <tbody>
            ${r.payments.map(p=>`<tr><td>${date(p.date)}</td><td><span class="badge green">${p.method}</span></td><td><strong>${money(p.amount)}</strong></td></tr>`).join('')}
          </tbody>
        </table>
      `:'<div class="empty">Nenhum pagamento registrado até o momento.</div>'}
    </div>`
  );
}

function clientModal(id){
  const c=customer(id), orders=state.orders.filter(o=>o.customerId===id);
  openModal(
    modalHead('HISTÓRICO DO CLIENTE',esc(c.name))+
    `<div class="details-grid">
      <div><span class="field-label">Perfil comercial</span><div class="field-value">${c.type} · Canal: ${esc(c.channel)}</div></div>
      <div><span class="field-label">Cidade / Região</span><div class="field-value">${esc(c.city||'Minas Gerais')}</div></div>
      <div><span class="field-label">Contato cadastrado</span><div class="field-value">${esc(c.contact)}</div></div>
    </div>
    <div class="modal-section">
      <h3>Histórico de compras e recompras</h3>
      ${orders.length?orders.map(o=>`
        <div class="note">
          <div class="actions" style="justify-content:space-between">
            <strong>${o.id} · ${money(E.total(o))}</strong>
            ${badge(o.status)}
          </div>
          <p>${o.items.map(i=>`${i.qty}× ${esc(product(i.productId).name)}`).join(', ')}</p>
          <div class="actions">
            <button class="text-link" data-action="order" data-id="${o.id}">Ver pedido ${icon('arrow')}</button>
            ${c.type==='B2B'?`<button class="btn terracota" data-action="reorder" data-id="${o.id}">Recompra rápida</button>`:''}
          </div>
        </div>
      `).join(''):'<div class="empty">Nenhum pedido anterior localizado.</div>'}
    </div>`
  );
}

function newClient(){
  openModal(
    modalHead('CADASTRO DE CLIENTE','Novo Cliente ou Estabelecimento')+
    `<form id="client-form">
      <div class="form-grid">
        <label class="wide">Nome ou Razão Social<input name="name" required maxlength="100" placeholder="Ex: Empório Serra Viva ou Ana Maria"></label>
        <label>Perfil
          <select name="type">
            <option value="B2C">Consumidor Varejo (B2C)</option>
            <option value="B2B">Comercial / Lojista (B2B)</option>
          </select>
        </label>
        <label>Canal de Origem
          <select name="channel">
            <option>WhatsApp</option>
            <option>Instagram</option>
            <option>Formulário</option>
            <option>Presencial / Empório</option>
          </select>
        </label>
        <label class="wide">Contato de Retorno<input name="contact" required maxlength="100" placeholder="(31) 99999-9999"></label>
        <label class="wide">Cidade e Estado<input name="city" maxlength="100" placeholder="Ex: Belo Horizonte, MG"></label>
      </div>
      <div class="form-error" role="alert"></div>
      <div class="modal-footer">
        <button class="btn primary" type="submit">Cadastrar Cliente</button>
      </div>
    </form>`
  );
}

function publicPage(){
  let origin=new URLSearchParams(location.hash.split('?')[1]||'').get('origem')||'WhatsApp';
  if(!['WhatsApp','Instagram','Formulário'].includes(origin)) origin='WhatsApp';
  return `
  <main class="public">
    <header class="public-header">
      <a class="public-brand" href="#/visao-geral">
        ${officialLogo('public-logo')}
        <span>encantos da serra<small style="display:block;font-size:10px;color:var(--terracota);letter-spacing:1.5px">CIRCUITO ESTRADA REAL</small></span>
      </a>
      ${customerHeaderContacts()}
      <a class="text-link" href="#/pedidos">Área da Equipe ${icon('arrow')}</a>
    </header>

    <div class="public-content">
      <div class="eyebrow">DA NOSSA SERRA PARA SUA MESA</div>
      <h1>O seu próximo encanto começa aqui.</h1>
      <p class="subtitle">Escolha suas iguarias mineiras ou encomende uma cesta personalizada. Recebemos sua solicitação e combinamos os detalhes com você no canal preferido.</p>

      <form id="order-form" class="public-form">
        <div class="form-grid">
          <label class="wide">Seu nome ou razão social<input name="name" required maxlength="100" placeholder="Como podemos chamar você?"></label>
          <label>Contato para retorno<input name="contact" required maxlength="100" placeholder="(31) 99999-9999 ou e-mail"></label>
          <label>Tipo de compra
            <select name="type">
              <option value="B2C">Consumo ou presente (Varejo)</option>
              <option value="B2B">Para o meu negócio (Empório / Pousada)</option>
            </select>
          </label>
          <label>Canal de atendimento
            <select name="channel">
              ${['WhatsApp','Instagram','Formulário'].map(c=>`<option ${origin===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </label>
          <label>Data desejada para entrega<input type="date" name="delivery" min="${E.TODAY}" required></label>
          <label class="wide">Tipo de pedido
            <select name="kind" id="kind-select">
              <option value="padrao">Iguarias do catálogo oficial</option>
              <option value="personalizado">Cesta ou kit personalizado artesanal</option>
            </select>
          </label>
        </div>

        <div class="modal-section">
          <h3 style="margin-bottom:16px">Quais iguarias você deseja?</h3>
          <div id="form-items">${itemRow()}</div>
          <button type="button" class="text-link" data-action="add-item">${icon('plus')} Adicionar outro produto</button>
        </div>

        <div class="form-grid" style="margin-top:24px">
          <label class="wide" id="custom-field" hidden>
            Detalhes da personalização
            <textarea name="custom" maxlength="1000" placeholder="Conte-nos sobre a ocasião, tipos de embalagem, cartão manuscrito ou cuidados..."></textarea>
          </label>
          <label>Forma de pagamento sugerida
            <select name="payment" id="payment-select">
              <option value="pix">Pix (com desconto)</option>
              <option value="cartao">Cartão de Crédito</option>
              <option value="fiado">A prazo comercial (B2B sob aprovação)</option>
            </select>
          </label>
          <label id="due-field" hidden>
            Data pretendida para liquidação
            <input type="date" name="due" min="${E.TODAY}">
          </label>
          <label class="wide">Observações adicionais<textarea name="notes" maxlength="1000" placeholder="Detalhes para a entrega ou instruções especiais?"></textarea></label>
        </div>

        <div class="form-total">
          <span id="total-label">Subtotal estimado</span>
          <strong id="form-total">${money(state.products[0].price)}</strong>
        </div>

        <div class="form-error" role="alert"></div>
        <button class="btn primary" style="width:100%;margin-top:22px;padding:14px" type="submit">
          Enviar solicitação ao Empório ${icon('arrow')}
        </button>
      </form>
    </div>
  </main>`;
}

function itemRow(){
  const selected=new URLSearchParams(location.hash.split('?')[1]||'').get('produto');
  return `
  <div class="form-item">
    <label>Iguaria
      <select name="productId">
        ${state.products.map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)} · ${money(p.price)}</option>`).join('')}
      </select>
    </label>
    <label>Qtd.<input name="qty" type="number" min="1" max="9999" value="1" required step="1"></label>
    <button type="button" class="icon-button" data-action="remove-item" aria-label="Remover produto">${icon('close')}</button>
  </div>`;
}

function updateForm(){
  if(!$('#order-form')) return;
  const custom=$('#kind-select').value==='personalizado', fiado=$('#payment-select').value==='fiado';
  $('#custom-field').hidden=!custom;
  $('#custom-field textarea').required=custom;
  $('#due-field').hidden=!fiado;
  $('#due-field input').required=fiado;
  $('#form-total').textContent=money([...document.querySelectorAll('.form-item')].reduce((a,row)=>a+product(row.querySelector('select').value).price*(Number(row.querySelector('input').value)||0),0));
  $('#total-label').textContent=custom?'Iguarias · orçamento sujeito a confirmação':'Subtotal estimado';
}

const slides=[
  {title:'Encantos da Serra',sub:'ERP Integrado & Identidade Visual inspirada na Estrada Real.',detail:'Protótipo Acadêmico · Engenharia da Computação · 2026'},
  {title:'A Tradição da Estrada Real',sub:'Reconhecimento das origens artesanais: queijo Canastra, doces em tacho e cachaças históricas com processo rastreável.',list:['Design inspirado nos marcos de pedra, terracota de olaria e ouro colonial.','Reserva provisória de estoque (soft-lock) para evitar rupturas de atendimento.','Gestão clara de perfis: equipe interna, lojistas B2B e produtores rurais.']},
  {title:'Caminho do Pedido (Fluxo)',sub:'Do Marco Zero à Entrega com Encanto.',list:['Marco Zero: entrada omnichannel com identificação de canal.','Curadoria: triagem, aprovação de orçamento de personalizados e análise de crédito.','Na Tulha: separação técnica, controle térmico e alocação FEFO.','Na Porteira: expedição pronta para retirada ou frete.','Entregue: baixa definitiva e conciliação financeira.']},
  {title:'Sessões & Distribuição de Perfis',sub:'Arquitetura multicamada para segurança e governança.',list:['Administrador: visão executiva, auditoria e DRE.','Atendimento: quadro de pedidos, orçamentos e CRM de clientes.','Almoxarifado: FEFO, tolerância de pesagem de 5% e registro de perdas.','Financeiro: controle de fiado e quitações parciais.','Portal do Cliente B2B e Extranet do Produtor Rural.']}
];

function presentation(){
  const s=slides[currentSlide];
  return `
  <main class="slides-page">
    <div class="slide-count">CIRCUITO ESTRADA REAL · APRESENTAÇÃO &nbsp; / &nbsp; ${String(currentSlide+1).padStart(2,'0')} DE ${slides.length}</div>
    <div class="slide-frame">
      <h1>${s.title}</h1>
      <p>${s.sub}</p>
      ${s.list?`<ul class="slide-list">${s.list.map(t=>`<li>${t}</li>`).join('')}</ul>`:''}
      ${s.detail?`<p class="slide-detail">${s.detail}</p>`:''}
    </div>
    <div class="slides-controls">
      <a class="btn" href="#/visao-geral">Abrir painel da demonstração ${icon('arrow')}</a>
      <span class="hint">Navegue pelas setas do teclado</span>
      <div class="actions">
        <button class="btn" data-action="slide-prev" ${currentSlide===0?'disabled':''}>Anterior</button>
        <button class="btn" data-action="slide-next" ${currentSlide===slides.length-1?'disabled':''}>Próximo ${icon('arrow')}</button>
      </div>
    </div>
  </main>`;
}

function apiBase(){
  if(typeof window !== 'undefined' && window.location && window.location.protocol === 'file:'){
    return 'http://127.0.0.1:4173';
  }
  return '';
}

let apiLastResponse = null;
let apiLastEndpoint = '/health';
let apiLastStatus = 200;
let apiLastLatency = 12;

function apiConsolePage(){
  const endpoints = [
    { method: 'GET', path: '/health', desc: 'Health Check & Diagnóstico do Sistema', tag: 'Status' },
    { method: 'GET', path: '/api/routes', desc: 'Catálogo de Rotas e Discovery da API', tag: 'Discovery' },
    { method: 'GET', path: '/api/stats', desc: 'Estatísticas Globais (Produtos, Pedidos, Saldos)', tag: 'Métricas' },
    { method: 'GET', path: '/api/products?limit=5', desc: 'Produtos do Catálogo Oficial Paginado', tag: 'Produtos' },
    { method: 'GET', path: '/api/products/p1', desc: 'Ficha Completa do Queijo Provolone Recheado', tag: 'Produtos' },
    { method: 'GET', path: '/api/products/p1/price', desc: 'Preço e Simulação de Parcelamento em 3x/6x', tag: 'Preços' },
    { method: 'GET', path: '/api/categories', desc: 'Lista de Categorias e Contagens de Produtos', tag: 'Categorias' },
    { method: 'GET', path: '/api/prices', desc: 'Resumo Financeiro e Produtos com Desconto', tag: 'Preços' },
    { method: 'GET', path: '/api/orders', desc: 'Lista de Pedidos no Fluxo da Estrada Real', tag: 'Vendas' },
    { method: 'GET', path: '/api/lots', desc: 'Lotes de Estoque com Regra FEFO', tag: 'Estoque' },
    { method: 'GET', path: '/api/receivables', desc: 'Contas a Receber e Títulos de Fiado', tag: 'Financeiro' },
    { method: 'GET', path: '/api/profiles', desc: 'Matriz de Permissões e Perfis RBAC', tag: 'Segurança' },
    { method: 'POST', path: '/api/check-weight', body: JSON.stringify({ expectedGrams: 1000, actualGrams: 1045 }), desc: 'Conferência de Peso com Tolerância ±5%', tag: 'Qualidade' }
  ];

  const base = apiBase() || 'http://127.0.0.1:4173';

  return pageHeading(
    'INTEGRAÇÃO & SERVIÇOS RESTFUL',
    'Console & Rotas da API',
    'Execute chamadas em tempo real aos endpoints do ERP e catálogo oficial da Estrada Real.',
    `<div class="actions">
      <a class="btn" href="${base}/api/export/json" download="encantos_export.json">${icon('box')} Baixar JSON</a>
      <a class="btn" href="${base}/api/export/csv" download="encantos_produtos.csv">${icon('receipt')} Baixar CSV</a>
      <a class="btn primary" href="http://127.0.0.1:8000/docs" target="_blank" rel="noopener noreferrer">${icon('link')} Swagger OpenAPI ${icon('arrow')}</a>
    </div>`
  ) + `
  <div class="api-console-layout">
    <div class="panel">
      <div class="panel-head">
        <div>
          <h2>Endpoints RESTful Disponíveis</h2>
          <p class="subtitle">Clique em qualquer endpoint para testar a requisição ao vivo</p>
        </div>
        <span class="badge green">🟢 API Ativa</span>
      </div>
      <div class="api-endpoints-list">
        ${endpoints.map((ep, idx) => `
          <div class="api-endpoint-card">
            <div class="api-endpoint-info">
              <span class="badge ${ep.method === 'GET' ? 'blue' : 'amber'}">${ep.method}</span>
              <code>${esc(ep.path)}</code>
              <span class="badge gray">${ep.tag}</span>
            </div>
            <p class="api-endpoint-desc">${esc(ep.desc)}</p>
            <div class="api-endpoint-actions">
              <button class="btn soft small" data-action="run-api-test" data-idx="${idx}" data-method="${ep.method}" data-path="${esc(ep.path)}" ${ep.body ? `data-body='${esc(ep.body)}'` : ''}>
                ${icon('play')} Executar
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="panel api-result-panel">
      <div class="panel-head">
        <div>
          <h2>Resposta da API</h2>
          <p class="subtitle" id="api-result-sub">${apiLastEndpoint ? `Última chamada: <code>${esc(apiLastEndpoint)}</code>` : 'Nenhuma requisição executada ainda'}</p>
        </div>
        <div id="api-result-badge">
          ${apiLastStatus ? `<span class="badge ${apiLastStatus < 300 ? 'green' : 'red'}">${apiLastStatus} OK · ${apiLastLatency}ms</span>` : ''}
        </div>
      </div>
      <div class="api-terminal-window">
        <pre id="api-result-output" class="api-json-viewer">${esc(JSON.stringify(apiLastResponse || {
          message: 'Selecione um endpoint à esquerda e clique em "Executar" para testar ao vivo a rota!',
          status: 'pronto',
          rotas_disponiveis: endpoints.length
        }, null, 2))}</pre>
      </div>
    </div>
  </div>`;
}

function render(){
  const r=route();
  if(r==='solicitar') $('#app').innerHTML=publicPage();
  else if(r==='apresentacao') $('#app').innerHTML=presentation();
  else {
    const prof=currentProfile();
    // ROUTE GUARD: Verificação estrita de autorização de rota por perfil
    if(!E.canAccessRoute(prof, r)){
      $('#app').innerHTML=shell(forbiddenPage(prof, r), r);
      document.title='Encantos da Serra · Acesso Restrito';
      return;
    }

    const viewMap={
      pedidos:()=>board(false),
      personalizados:()=>board(true),
      clientes:clients,
      estoque:inventory,
      financeiro:finance,
      fornecedores:officialSuppliersPage,
      catalogo:officialCatalogPage,
      empresa:officialCompanyPage,
      api:apiConsolePage
    };
    $('#app').innerHTML=shell((viewMap[r]||dashboard)(),r);
  }
  document.title='Encantos da Serra · '+(r==='solicitar'?'Seu Pedido':r==='apresentacao'?'Apresentação Estrada Real':'Gestão');
  if(r==='solicitar') updateForm();
}

function nextId(){
  return 'ES-'+(Math.max(1048,...state.orders.map(o=>Number(o.id.split('-')[1])))+1);
}

function formError(form,e){ form.querySelector('.form-error').textContent=e.message; }

document.addEventListener('click',async ev=>{
  const moreOptions=$('.more-options[open]');
  if(moreOptions){
    const option=ev.target.closest('.more-options-panel .nav-item');
    if(option) moreOptions.querySelector('summary').focus();
    if(option||!moreOptions.contains(ev.target)) moreOptions.open=false;
  }
  const b=ev.target.closest('[data-action]');
  if(!b||b.disabled) return;
  const {action:a,id,profile:profId}=b.dataset;
  try{
    if(a==='close') closeModal();
    if(a==='navigate'){ closeModal(); go(b.dataset.route); }
    if(a==='menu'){
      const expanded=$('#main-menu').classList.toggle('open');
      b.setAttribute('aria-expanded', String(expanded));
    }
    if(a==='alerts'){ go('estoque'); toast('Verifique os lotes em atenção e bloqueados.'); }
    if(a==='public'||a==='new-order') go('solicitar?origem=WhatsApp');
    if(a==='switch-profile') switchProfileModal();
    if(a==='view-rbac') rbacModal();
    if(a==='set-profile'){
      state.currentProfile=profId;
      save();
      closeModal();
      go('visao-geral');
      render();
      toast('Perfil alternado para '+currentProfile().name+' com sucesso.');
    }
    if(a==='run-api-test'){
      const path=b.dataset.path;
      const method=b.dataset.method||'GET';
      const body=b.dataset.body;
      const subEl=$('#api-result-sub');
      const badgeEl=$('#api-result-badge');
      const outEl=$('#api-result-output');
      if(subEl) subEl.innerHTML=`Chamando <code>${esc(method)} ${esc(path)}</code>...`;
      if(outEl) outEl.textContent='Carregando resposta da API...';
      const t0=performance.now();
      try {
        const opts={ method, headers: { 'Content-Type': 'application/json' } };
        if(body) opts.body=body;
        const targetUrl = (path.startsWith('http://') || path.startsWith('https://')) ? path : (apiBase() + path);
        const res=await fetch(targetUrl, opts);
        const t1=performance.now();
        const latency=Math.round(t1-t0);
        const json=await res.json();
        apiLastResponse=json;
        apiLastEndpoint=path;
        apiLastStatus=res.status;
        apiLastLatency=latency;
        if(subEl) subEl.innerHTML=`Última chamada: <code>${esc(method)} ${esc(path)}</code>`;
        if(badgeEl) badgeEl.innerHTML=`<span class="badge ${res.ok?'green':'red'}">${res.status} ${res.statusText||'OK'} · ${latency}ms</span>`;
        if(outEl) outEl.textContent=JSON.stringify(json, null, 2);
        toast(`API: ${method} ${path} -> ${res.status} (${latency}ms)`);
      } catch(err) {
        if(subEl) subEl.innerHTML=`Erro na chamada: <code>${esc(path)}</code>`;
        if(badgeEl) badgeEl.innerHTML=`<span class="badge red">Falha de conexão</span>`;
        if(outEl) outEl.textContent='Erro ao comunicar com a API: '+err.message;
        toast('Erro de rede ao chamar a API');
      }
    }
    if(a==='filter'){ filter=b.dataset.filter; render(); }
    if(a==='finance-filter'){ financeFilter=b.dataset.filter; render(); }
    if(a==='official-product') officialProductModal(id);
    if(a==='request-product'){ closeModal(); go('solicitar?origem=Formulário&produto='+encodeURIComponent(id)); }
    if(a==='order') orderDetail(id);
    if(a==='stock-entry') stockModal(id);
    if(a==='loss') lossModal(id);
    if(a==='payment') paymentModal(id);
    if(a==='client') clientModal(id);
    if(a==='new-client') newClient();
    if(a==='approve'){
      const o=state.orders.find(o=>o.id===id);
      o.approved=true;
      save();
      render();
      orderDetail(id);
      toast('Aprovação do orçamento registrada na curadoria.');
    }
    if(a==='advance'){
      let o=state.orders.find(o=>o.id===id);
      if(o.status==='pronto'){
        state=E.complete(state,id);
        save();
        closeModal();
        render();
        toast('Pedido concluído e entregue com sucesso. Baixa final realizada!');
      } else {
        if(o.kind==='personalizado'&&!o.approved) throw Error('Aprove o orçamento com o cliente antes de prosseguir.');
        const stages=['novo','analise','separacao','pronto'];
        const nextStage=stages[stages.indexOf(o.status)+1];
        if(nextStage==='separacao'){
          state=E.reserve(state,id); // RESERVA PROVISÓRIA (SOFT-LOCK)
        }
        o.status=nextStage;
        save();
        render();
        orderDetail(id);
        toast(nextStage==='separacao'?'Pedido em separação: lote reservado (FEFO).':'Etapa avançada para '+statuses[nextStage][0]);
      }
    }
    if(a==='cancel-order'){
      const o=state.orders.find(o=>o.id===id);
      if(o.status==='concluido') throw Error('Pedidos concluídos exigem rotina de estorno formal.');
      openModal(
        modalHead('CANCELAMENTO DE PEDIDO',`Cancelar ${id}?`)+
        `<p class="subtitle">O pedido sairá do fluxo ativo. Quaisquer lotes que estejam em reserva temporária (soft-lock) serão liberados imediatamente para outros clientes.</p>
        <div class="modal-footer">
          <button class="btn" data-action="order" data-id="${id}">Voltar</button>
          <button class="btn danger" data-action="confirm-cancel" data-id="${id}">Confirmar Cancelamento</button>
        </div>`
      );
    }
    if(a==='confirm-cancel'){
      state=E.releaseReservation(state,id); // LIBERAÇÃO DA RESERVA
      state.orders.find(o=>o.id===id).status='cancelado';
      save();
      closeModal();
      render();
      toast('Pedido cancelado e reservas de lote devolvidas ao estoque.');
    }
    if(a==='add-item'){
      $('#form-items').insertAdjacentHTML('beforeend',itemRow());
      updateForm();
    }
    if(a==='remove-item'){
      if(document.querySelectorAll('.form-item').length<=1) throw Error('Mantenha pelo menos uma iguaria no pedido.');
      b.closest('.form-item').remove();
      updateForm();
    }
    if(a==='reorder'){
      const old=state.orders.find(o=>o.id===id);
      const n=E.clone(old);
      n.id=nextId();
      n.status='novo';
      n.date=E.TODAY;
      n.delivery='2026-11-10';
      n.due=n.payment==='fiado'?'2026-11-15':null;
      n.items=n.items.map(i=>({...i,price:product(i.productId).price}));
      delete n.completedAt;
      delete n.financeId;
      delete n.allocations;
      delete n.reservations;
      n.notes='Recompra B2B do pedido '+old.id+'. Confirmar lote e prazo com o empório.';
      if(n.kind==='personalizado') n.approved=false;
      state.orders.unshift(n);
      save();
      closeModal();
      go('pedidos');
      render();
      toast('Recompra registrada com sucesso no Marco Zero.');
    }
    if(a==='reset'){
      openModal(
        modalHead('REINICIAR DEMONSTRAÇÃO','Restaurar dados originais?')+
        '<p class="subtitle">Os pedidos, lotes e pagamentos criados no navegador serão redefinidos para os exemplos iniciais da Estrada Real.</p>'+
        '<div class="modal-footer"><button class="btn" data-action="close">Manter dados atuais</button><button class="btn primary" data-action="confirm-reset">Reiniciar dados</button></div>'
      );
    }
    if(a==='confirm-reset'){
      state=E.seed();
      save();
      closeModal();
      render();
      toast('Demonstração reiniciada com sucesso.');
    }
    if(a==='slide-prev'){ currentSlide=Math.max(0,currentSlide-1); render(); }
    if(a==='slide-next'){ currentSlide=Math.min(slides.length-1,currentSlide+1); render(); }
  }catch(e){
    toast(e.message);
  }
});

document.addEventListener('input',ev=>{
  if(ev.target.id==='catalog-search'){
    const at=ev.target.selectionStart;
    catalogSearch=ev.target.value;
    render();
    $('#catalog-search').focus();
    $('#catalog-search').setSelectionRange(at,at);
  }
  if(ev.target.id==='order-search'){
    const at=ev.target.selectionStart;
    query=ev.target.value;
    const active=route();
    $('#app').innerHTML=shell(board(active==='personalizados'),active);
    $('#order-search').focus();
    $('#order-search').setSelectionRange(at,at);
  }
  if(ev.target.closest('#order-form')) updateForm();
});

document.addEventListener('change',ev=>{
  if(ev.target.id==='catalog-category'){
    catalogFilter=ev.target.value;
    render();
  }
  if(ev.target.closest('#order-form')) updateForm();
});

document.addEventListener('submit',ev=>{
  const f=ev.target;
  if(!['order-form','stock-form','loss-form','payment-form','client-form'].includes(f.id)) return;
  ev.preventDefault();
  const v=Object.fromEntries(new FormData(f));
  try{
    if(f.id==='order-form'){
      if(!v.name.trim()||!v.contact.trim()) throw Error('Informe nome e contato de retorno.');
      if(!v.delivery||E.days(v.delivery)<0) throw Error('Escolha uma data válida para a entrega.');
      if(v.kind==='personalizado'&&!v.custom.trim()) throw Error('Descreva os detalhes da personalização.');
      if(v.payment==='fiado'&&(!v.due||E.days(v.due)<0)) throw Error('Informe a data acordada para o pagamento.');
      
      const items=[...f.querySelectorAll('.form-item')].map(row=>{
        const p=product(row.querySelector('select').value), qty=Number(row.querySelector('input').value);
        if(!Number.isInteger(qty)||qty<1||qty>9999) throw Error('Informe quantidades inteiras válidas.');
        return {productId:p.id,qty,price:p.price};
      });

      const cid='c-'+Date.now(), id=nextId();
      state.customers.push({id:cid,name:v.name.trim(),contact:v.contact.trim(),type:v.type,channel:v.channel,city:''});
      state.orders.unshift({
        id,
        customerId:cid,
        channel:v.channel,
        kind:v.kind,
        status:'novo',
        items,
        date:E.TODAY,
        delivery:v.delivery,
        payment:v.payment,
        due:v.payment==='fiado'?v.due:null,
        notes:v.notes.trim(),
        custom:v.kind==='personalizado'?v.custom.trim():'',
        approved:v.kind!=='personalizado'
      });
      state.activity.unshift({title:v.name.trim()+' enviou um pedido',detail:id+' · '+v.channel+' · Marco Zero',date:E.TODAY});
      save();

      $('.public-content').innerHTML=`
      <div class="success" style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:45px;margin-top:35px;text-align:center">
        ${icon('check')}
        <div class="eyebrow" style="margin-top:14px">SOLICITAÇÃO RECEBIDA COM SUCESSO</div>
        <h2>Seu encanto já está no Marco Zero.</h2>
        <p>O número de acompanhamento é <strong>${id}</strong>.<br>Nossa equipe vai conferir as iguarias e combinar os próximos passos com você.<br>${v.kind==='personalizado'?'Seu pedido de cesta personalizada passará por curadoria de orçamento.':''}</p>
        <div class="actions" style="justify-content:center;margin-top:25px">
          <a class="btn primary" href="#/pedidos">Acompanhar na Central ${icon('arrow')}</a>
          <button class="btn" data-action="public" onclick="render()">Nova solicitação</button>
        </div>
      </div>`;
      window.scrollTo(0,0);
    }

    if(f.id==='stock-form'){
      const qty=Number(v.qty), cost=Number(v.cost);
      if(!Number.isInteger(qty)||qty<1||!Number.isFinite(cost)||cost<=0) throw Error('Confira quantidade e custo unitário.');
      if(!v.expiry&&!product(v.productId).noExpiry) throw Error('Informe a validade desta iguaria.');
      if(v.expiry&&(v.manufactured>v.expiry||E.days(v.expiry)<0)) throw Error('Confira as datas de fabricação e validade.');
      if(state.lots.some(l=>l.productId===v.productId&&l.code===v.code.trim())) throw Error('Este código de lote já foi cadastrado para o produto.');
      if(!v.code.trim()||!v.location.trim()) throw Error('Informe lote e localização física.');
      
      // Verificação de pesagem se informada
      if(v.expectedWeight&&v.actualWeight){
        const tol=E.checkWeightTolerance(v.expectedWeight,v.actualWeight);
        if(!tol.valid){
          toast('Alerta: divergência de pesagem de '+tol.diffPercent+'% registrada para auditoria.');
        }
      }

      const id='l-'+Date.now();
      state.lots.push({
        id,
        productId:v.productId,
        code:v.code.trim(),
        qty,
        reserved:0,
        expiry:v.expiry||null,
        manufactured:v.manufactured,
        received:E.TODAY,
        location:v.location.trim(),
        cost
      });
      state.movements.push({id:'m-'+Date.now(),type:'entrada',lotId:id,productId:v.productId,qty,date:E.TODAY});
      save();
      closeModal();
      render();
      toast('Lote cadastrado e integrado ao algoritmo FEFO.');
    }

    if(f.id==='loss-form'){
      const l=state.lots.find(l=>l.id===f.dataset.id), qty=Number(v.qty);
      if(!Number.isInteger(qty)||qty<1||qty>l.qty||!v.notes.trim()) throw Error('Confira a quantidade e a justificativa técnica.');
      l.qty-=qty;
      state.movements.push({id:'m-'+Date.now(),type:'perda',lotId:l.id,productId:l.productId,qty,reason:v.reason+': '+v.notes.trim(),date:E.TODAY});
      save();
      closeModal();
      render();
      toast('Perda registrada e saldo auditado no estoque.');
    }

    if(f.id==='payment-form'){
      state=E.receive(state,f.dataset.id,v.amount,v.method);
      save();
      closeModal();
      render();
      toast('Recebimento liquidado e saldo atualizado.');
    }

    if(f.id==='client-form'){
      if(!v.name.trim()||!v.contact.trim()) throw Error('Informe o nome e o contato do cliente.');
      state.customers.push({
        id:'c-'+Date.now(),
        name:v.name.trim(),
        contact:v.contact.trim(),
        city:v.city.trim(),
        type:v.type,
        channel:v.channel
      });
      save();
      closeModal();
      render();
      toast('Cliente cadastrado com sucesso.');
    }
  }catch(e){
    formError(f,e);
  }
});

document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'){
    const moreOptions=$('.more-options[open]');
    if(moreOptions){
      moreOptions.open=false;
      moreOptions.querySelector('summary').focus();
    }
    closeModal();
  }
  if($('.modal')&&ev.key==='Tab'){
    const list=[...$('.modal').querySelectorAll('button,input,select,textarea,a')].filter(x=>!x.disabled&&x.offsetParent!==null);
    if(list.length){
      const first=list[0], last=list.at(-1);
      if(ev.shiftKey&&(document.activeElement===first||document.activeElement===$('.modal'))){
        ev.preventDefault();
        last.focus();
      }else if(!ev.shiftKey&&document.activeElement===last){
        ev.preventDefault();
        first.focus();
      }
    }
  }
  if(route()==='apresentacao'){
    if(ev.key==='ArrowRight'){ currentSlide=Math.min(slides.length-1,currentSlide+1); render(); }
    if(ev.key==='ArrowLeft'){ currentSlide=Math.max(0,currentSlide-1); render(); }
  }
});

window.addEventListener('hashchange',()=>{
  closeModal();
  query='';
  filter='todos';
  render();
  window.scrollTo(0,0);
});

render();
