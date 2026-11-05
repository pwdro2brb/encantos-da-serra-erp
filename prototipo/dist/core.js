(function(root){
  'use strict';
  const official=typeof module==='object'&&module.exports?require('./official.js'):root.ERP_OFFICIAL;
  const TODAY='2026-11-03';
  const days=(date)=>date?Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(TODAY+'T12:00:00Z'))/86400000):Infinity;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const products=clone(official.products);

  const PROFILES=[
    {
      id:'admin',
      name:'Administrador Geral',
      role:'Equipe Encantos',
      type:'internal',
      initials:'AD',
      avatarBg:'#1a382b',
      avatarColor:'#fbf9f4',
      description:'Visão executiva total, relatórios gerenciais e auditoria completa',
      atribuicoes:[
        'Supervisão geral das operações, vendas e suprimentos do empório',
        'Parametrização de limites de crédito para vendas a prazo (fiado)',
        'Auditoria de registros de perdas, estornos e histórico de conformidade',
        'Gestão de acessos, papéis de usuário e segurança do sistema'
      ],
      permissoes:[
        'Acesso irrestrito a todos os módulos e visões operacionais',
        'Visualização de custos unitários de compra, margem líquida e faturamento global',
        'Autorização de pedidos em todas as etapas (análise, separação, conclusão)',
        'Registro de entradas de estoque, perdas justificadas e baixa de quitações'
      ],
      restricoes:[
        'Nenhuma restrição de visualização ou operação (superusuário)',
        'Exige registro de auditoria em ações críticas e estornos'
      ],
      allowedRoutes:['visao-geral','catalogo','pedidos','personalizados','clientes','estoque','financeiro','fornecedores','empresa','apresentacao']
    },
    {
      id:'atendimento',
      name:'Atendimento & Comercial',
      role:'Equipe Encantos',
      type:'internal',
      initials:'AT',
      avatarBg:'#94442a',
      avatarColor:'#fbf9f4',
      description:'Gestão do quadro de pedidos, orçamentos e CRM de clientes',
      atribuicoes:[
        'Recepção de novos pedidos nos canais omnichannel (WhatsApp, Instagram, Loja)',
        'Elaboração e registro de orçamentos para cestas e kits personalizados',
        'Cadastro e manutenção da carteira de clientes de varejo e parceiros B2B',
        'Acompanhamento do cliente até a entrega satisfatória'
      ],
      permissoes:[
        'Criação, edição e avanço de pedidos no quadro até a etapa de separação',
        'Aprovação formal de orçamento para pedidos personalizados',
        'Cadastro e atualização de clientes no módulo de relacionamento',
        'Consulta ao catálogo oficial com preços de venda ao consumidor'
      ],
      restricoes:[
        'PROIBIDO acesso ao módulo financeiro global e contas a pagar',
        'PROIBIDO alteração manual de saldo de estoque físico ou registro de perdas',
        'PROIBIDO concessão de crédito fiado acima da política comercial sem autorização'
      ],
      allowedRoutes:['visao-geral','catalogo','pedidos','personalizados','clientes','empresa','apresentacao']
    },
    {
      id:'estoque',
      name:'Almoxarifado & Expedição',
      role:'Equipe Encantos',
      type:'internal',
      initials:'ES',
      avatarBg:'#48524f',
      avatarColor:'#fbf9f4',
      description:'Lotes FEFO, pesagem, perdas e separação de mercadorias',
      atribuicoes:[
        'Recebimento físico de remessas e conferência de pesagem (tolerância ±5%)',
        'Armazenamento técnico adequado (câmaras frias e prateleiras climatizadas)',
        'Separação de pedidos (picking & packing) seguindo a menor validade (FEFO)',
        'Controle rigoroso do ponto de corte de 7 dias de validade'
      ],
      permissoes:[
        'Acesso completo ao inventário de lotes e movimentações de estoque',
        'Registro de entrada de novos lotes e conferência de peso de queijos',
        'Registro de perdas justificadas por avaria, transporte ou expiração',
        'Visualização das guias de separação técnica e embalagem dos pedidos'
      ],
      restricoes:[
        'PROIBIDO acesso ao módulo financeiro, faturamento global e contas a receber',
        'PROIBIDO acesso aos dados cadastrais e histórico financeiro de clientes',
        'PROIBIDO precificação de venda ou alteração de tabelas comerciais'
      ],
      allowedRoutes:['visao-geral','estoque','pedidos','fornecedores','empresa','apresentacao']
    },
    {
      id:'financeiro',
      name:'Gestão Financeira',
      role:'Equipe Encantos',
      type:'internal',
      initials:'FI',
      avatarBg:'#c39943',
      avatarColor:'#1a382b',
      description:'Contas a receber, vendas a prazo (fiado) e conciliação',
      atribuicoes:[
        'Acompanhamento de liquidações à vista (Pix e Cartão)',
        'Gestão da carteira de vendas a prazo e monitoramento de vencimentos',
        'Registro de recebimentos parciais e emissão de recibos de quitação',
        'Análise de adimplência e histórico de crédito de parceiros B2B'
      ],
      permissoes:[
        'Acesso completo ao módulo financeiro de contas a receber e faturamento',
        'Registro de pagamentos totais ou parciais vinculados aos pedidos',
        'Consulta de pedidos e histórico de faturamento por cliente',
        'Acompanhamento de contas vencidas e cobrança preventiva'
      ],
      restricoes:[
        'PROIBIDO movimentação física de lotes ou descarte de estoque',
        'PROIBIDO alteração do status de separação física sem conferência da expedição',
        'PROIBIDO estorno de pagamentos sem justificativa auditada'
      ],
      allowedRoutes:['visao-geral','financeiro','pedidos','clientes','empresa','apresentacao']
    },
    {
      id:'compras',
      name:'Suprimentos & Produtores',
      role:'Equipe Encantos',
      type:'internal',
      initials:'CP',
      avatarBg:'#213c53',
      avatarColor:'#fbf9f4',
      description:'Ordens de compra e relação com queijarias da Canastra',
      atribuicoes:[
        'Homologação de pequenos produtores rurais e queijarias artesanais',
        'Verificação de laudos sanitários (SIM/SIF/IMA) e certificações',
        'Monitoramento de capacidade de fornecimento mensal e quebra de safra',
        'Programação de reposição de itens próximos do estoque mínimo'
      ],
      permissoes:[
        'Acesso ao módulo de produtores e capacidade comprometida',
        'Consulta de saldos de estoque para planejamento de reposição',
        'Consulta ao catálogo oficial e fichas de produtos'
      ],
      restricoes:[
        'PROIBIDO acesso a contas a receber de clientes e controle de fiado varejo',
        'PROIBIDO alteração de preços de venda ao consumidor final'
      ],
      allowedRoutes:['visao-geral','fornecedores','estoque','catalogo','empresa','apresentacao']
    },
    {
      id:'cliente_b2b',
      name:'Empório Raízes',
      role:'Cliente Comercial (B2B)',
      type:'client',
      customerId:'c2',
      initials:'ER',
      avatarBg:'#94442a',
      avatarColor:'#fbf9f4',
      description:'Portal B2B: pedidos, recompra em 1 clique e faturas a prazo',
      atribuicoes:[
        'Abastecimento do estoque do empório parceiro com iguarias da serra',
        'Acompanhamento de remessas a caminho e datas acordadas para pagamento',
        'Recompra ágil com base no giro de produtos artesanais'
      ],
      permissoes:[
        'Visualização estrita dos PRÓPRIOS pedidos (Empório Raízes)',
        'Visualização estrita das PRÓPRIAS faturas a prazo e saldo em aberto',
        'Consulta ao catálogo público de produtos e botão de recompra rápida'
      ],
      restricoes:[
        'PROIBIDO acesso ao estoque geral do empório, câmaras e custos de compra de fornecedores',
        'PROIBIDO acesso a dados financeiros globais, faturamento da loja ou outros clientes',
        'PROIBIDO acesso a cadastros de clientes concorrentes ou listas de contatos',
        'PROIBIDO acesso a ordens de compra e margens de revenda do empório'
      ],
      allowedRoutes:['visao-geral','pedidos','catalogo','financeiro','empresa','apresentacao']
    },
    {
      id:'produtor',
      name:'Família Oliveira',
      role:'Produtor Canastra',
      type:'supplier',
      producerIndex:0,
      producerName:'Família Oliveira',
      associatedProductIds:['p1'], // Queijo Minas Artesanal Canastra
      initials:'FO',
      avatarBg:'#346e4b',
      avatarColor:'#fbf9f4',
      description:'Portal do Produtor: remessas de queijo, laudos e capacidade',
      atribuicoes:[
        'Produção artesanal de queijo Canastra com leite cru de pasto nativo',
        'Envio de remessas com lote, data de fabricação e pesagem aferida',
        'Manutenção e envio periódico dos laudos sanitários da queijaria'
      ],
      permissoes:[
        'Visualização estrita dos lotes de queijo fornecidos pela Família Oliveira (p1)',
        'Acompanhamento da capacidade mensal e saldo entregue da sua queijaria',
        'Consulta ao catálogo público e informações institucionais'
      ],
      restricoes:[
        'PROIBIDO acesso ao estoque geral de outros produtores (doces, embutidos, cachaças)',
        'PROIBIDO acesso a dados financeiros do empório, faturamento e contas a receber',
        'PROIBIDO acesso a dados de clientes finais, fiado de varejo e margens da loja',
        'PROIBIDO alteração ou baixa manual de lotes de terceiros'
      ],
      allowedRoutes:['visao-geral','estoque','fornecedores','catalogo','empresa','apresentacao']
    }
  ];

  function getProfile(idOrProf){
    if(typeof idOrProf==='object'&&idOrProf?.id) return idOrProf;
    return PROFILES.find(p=>p.id===idOrProf)||PROFILES[0];
  }

  function canAccessRoute(idOrProf, routeName){
    const prof=getProfile(idOrProf);
    if(prof.id==='admin') return true;
    return prof.allowedRoutes.includes(routeName);
  }

  function filterLotsForProfile(state, idOrProf){
    const prof=getProfile(idOrProf);
    if(prof.type==='supplier'&&prof.associatedProductIds?.length){
      return state.lots.filter(l=>prof.associatedProductIds.includes(l.productId));
    }
    if(prof.type==='client'){
      return []; // Clientes não têm acesso a lotes físicos internos
    }
    return state.lots;
  }

  function filterReceivablesForProfile(state, idOrProf){
    const prof=getProfile(idOrProf);
    if(prof.type==='client'&&prof.customerId){
      return state.receivables.filter(r=>r.customerId===prof.customerId);
    }
    if(prof.type==='supplier'||prof.id==='estoque'||prof.id==='atendimento'){
      return []; // Produtor e equipe operacional não têm acesso ao financeiro geral do empório
    }
    return state.receivables;
  }

  function filterOrdersForProfile(state, idOrProf){
    const prof=getProfile(idOrProf);
    if(prof.type==='client'&&prof.customerId){
      return state.orders.filter(o=>o.customerId===prof.customerId);
    }
    if(prof.type==='supplier'&&prof.associatedProductIds?.length){
      // Produtor só visualiza pedidos que contenham seus produtos
      return state.orders.filter(o=>o.items.some(i=>prof.associatedProductIds.includes(i.productId)));
    }
    return state.orders;
  }

  function applyOfficialCatalog(state){
    const next=clone(state);
    next.products=[...clone(products),...next.products.filter(p=>!products.some(o=>o.id===p.id))];
    next.catalogRevision=official.revision;
    return next;
  }

  const customers=[
    {id:'c1',name:'Marina Costa',type:'B2C',channel:'WhatsApp',contact:'(31) 99123-4567',city:'Belo Horizonte, MG'},
    {id:'c2',name:'Empório Raízes',type:'B2B',channel:'WhatsApp',contact:'(31) 98765-4321',city:'Lagoa Santa, MG'},
    {id:'c3',name:'Clara Almeida',type:'B2C',channel:'Instagram',contact:'clara.almeida@email.com',city:'Belo Horizonte, MG'},
    {id:'c4',name:'Pousada Ipê',type:'B2B',channel:'WhatsApp',contact:'(31) 99888-7766',city:'Serra do Cipó, MG'},
    {id:'c5',name:'Rafael Nunes',type:'B2C',channel:'Formulário',contact:'(31) 99555-1122',city:'Contagem, MG'},
    {id:'c6',name:'Luiza Ferreira',type:'B2C',channel:'Instagram',contact:'luiza.ferreira@email.com',city:'Belo Horizonte, MG'}
  ];

  function seed(){
    return {
      version:1,
      currentProfile:'admin',
      catalogRevision:official.revision,
      products:clone(products),
      customers:clone(customers),
      lots:[
        {id:'l1',productId:'p1',code:'QMC-1026',qty:8,reserved:0,expiry:'2026-11-08',received:'2026-10-25',location:'Câmara A · 01',cost:29},
        {id:'l2',productId:'p1',code:'QMC-1101',qty:26,reserved:0,expiry:'2026-11-24',received:'2026-11-01',location:'Câmara A · 02',cost:29},
        {id:'l3',productId:'p2',code:'DDL-1028',qty:42,reserved:0,expiry:'2026-12-28',received:'2026-10-28',location:'Prateleira B · 01',cost:18},
        {id:'l4',productId:'p3',code:'CAC-0901',qty:19,reserved:0,expiry:null,received:'2026-09-01',location:'Prateleira C · 02',cost:38},
        {id:'l5',productId:'p4',code:'GJB-1020',qty:9,reserved:0,expiry:'2026-11-16',received:'2026-10-20',location:'Prateleira B · 03',cost:15},
        {id:'l6',productId:'p5',code:'SAL-1029',qty:17,reserved:0,expiry:'2026-11-27',received:'2026-10-29',location:'Câmara A · 03',cost:25}
      ],
      orders:[
        {id:'ES-1048',customerId:'c1',channel:'WhatsApp',kind:'padrao',status:'novo',items:[{productId:'p1',qty:2,price:48},{productId:'p2',qty:1,price:32}],date:TODAY,delivery:'2026-11-05',payment:'pix',due:null,notes:'Retirada na loja, no período da tarde.',custom:'',approved:true},
        {id:'ES-1047',customerId:'c2',channel:'WhatsApp',kind:'padrao',status:'separacao',items:[{productId:'p1',qty:6,price:48},{productId:'p3',qty:2,price:65}],date:'2026-11-02',delivery:'2026-11-04',payment:'fiado',due:'2026-11-15',notes:'Entrega no empório parceiro da Estrada Real.',custom:'',approved:true,reservations:[{lotId:'l2',productId:'p1',qty:6,cost:29},{lotId:'l4',productId:'p3',qty:2,cost:38}]},
        {id:'ES-1046',customerId:'c3',channel:'Instagram',kind:'personalizado',status:'analise',items:[{productId:'p2',qty:3,price:32},{productId:'p4',qty:3,price:28}],date:'2026-11-02',delivery:'2026-11-10',payment:'pix',due:null,notes:'Presente de aniversário com toque mineiro.',custom:'3 kits com doces, cartão manuscrito e laço em fita artesanal.',approved:false},
        {id:'ES-1045',customerId:'c4',channel:'WhatsApp',kind:'padrao',status:'pronto',items:[{productId:'p1',qty:4,price:48},{productId:'p5',qty:2,price:42}],date:'2026-11-01',delivery:TODAY,payment:'fiado',due:'2026-11-12',notes:'Recepção da pousada até 17h.',custom:'',approved:true},
        {id:'ES-1044',customerId:'c5',channel:'Formulário',kind:'padrao',status:'novo',items:[{productId:'p3',qty:1,price:65}],date:TODAY,delivery:'2026-11-06',payment:'cartao',due:null,notes:'Retirada na loja.',custom:'',approved:true},
        {id:'ES-1043',customerId:'c6',channel:'Instagram',kind:'personalizado',status:'separacao',items:[{productId:'p1',qty:2,price:48},{productId:'p2',qty:2,price:32},{productId:'p4',qty:2,price:28}],date:'2026-11-01',delivery:'2026-11-06',payment:'pix',due:null,notes:'Montar em cesta rústica da Estrada Real.',custom:'Cesta de boas-vindas com cartão personalizado.',approved:true,reservations:[{lotId:'l2',productId:'p1',qty:2,cost:29},{lotId:'l3',productId:'p2',qty:2,cost:18},{lotId:'l5',productId:'p4',qty:2,cost:15}]},
        {id:'ES-1042',customerId:'c2',channel:'WhatsApp',kind:'padrao',status:'concluido',items:[{productId:'p2',qty:10,price:32}],date:'2026-10-25',delivery:'2026-10-27',payment:'fiado',due:'2026-10-31',notes:'Pedido anterior de demonstração.',custom:'',approved:true,completedAt:'2026-10-27',financeId:'r1',allocations:[]},
        {id:'ES-1041',customerId:'c4',channel:'WhatsApp',kind:'padrao',status:'concluido',items:[{productId:'p3',qty:4,price:65}],date:'2026-10-28',delivery:'2026-10-29',payment:'fiado',due:'2026-11-08',notes:'Pedido anterior de demonstração.',custom:'',approved:true,completedAt:'2026-10-29',financeId:'r2',allocations:[]}
      ],
      receivables:[
        {id:'r1',orderId:'ES-1042',customerId:'c2',total:320,due:'2026-10-31',payments:[{id:'pg1',amount:100,date:'2026-10-30',method:'pix'}]},
        {id:'r2',orderId:'ES-1041',customerId:'c4',total:260,due:'2026-11-08',payments:[]}
      ],
      movements:[],
      activity:[
        {title:'Marina enviou um novo pedido',detail:'ES-1048 · WhatsApp · Marco Zero',date:TODAY},
        {title:'Clara solicitou um kit personalizado',detail:'ES-1046 · Curadoria & Orçamento',date:'2026-11-02'}
      ]
    };
  }

  const total=o=>Math.round(o.items.reduce((a,i)=>a+i.qty*i.price,0)*100)/100;
  const balance=r=>Math.round((r.total-r.payments.reduce((a,p)=>a+p.amount,0))*100)/100;
  
  const stock=(s,p,eligible=false)=>{
    return s.lots
      .filter(l=>l.productId===p&&(!eligible||days(l.expiry)>7))
      .reduce((a,l)=>a+l.qty,0);
  };

  const availableStock=(s,p,excludeOrderId=null)=>{
    const order=excludeOrderId?s.orders.find(o=>o.id===excludeOrderId):null;
    const selfReserved=(order?.reservations||[]).filter(r=>r.productId===p);
    return s.lots
      .filter(l=>l.productId===p&&days(l.expiry)>7)
      .reduce((acc,l)=>{
        const selfQty=selfReserved.find(r=>r.lotId===l.id)?.qty||0;
        const netReserved=Math.max(0,(l.reserved||0)-selfQty);
        return acc+Math.max(0,l.qty-netReserved);
      },0);
  };

  function plan(s,o){
    const needs={};
    for(const i of o.items) needs[i.productId]=(needs[i.productId]||0)+i.qty;
    const allocations=[];
    const selfReserved=o.reservations||[];

    for(const [pid,qty] of Object.entries(needs)){
      let rest=qty;
      const lots=s.lots
        .filter(l=>{
          if(l.productId!==pid||days(l.expiry)<=7) return false;
          const myReserved=selfReserved.find(r=>r.lotId===l.id&&r.productId===pid)?.qty||0;
          const otherReserved=Math.max(0,(l.reserved||0)-myReserved);
          return (l.qty-otherReserved)>0;
        })
        .sort((a,b)=>(a.expiry||'9999-12-31').localeCompare(b.expiry||'9999-12-31')||a.received.localeCompare(b.received));

      for(const l of lots){
        const myReserved=selfReserved.find(r=>r.lotId===l.id&&r.productId===pid)?.qty||0;
        const otherReserved=Math.max(0,(l.reserved||0)-myReserved);
        const avail=l.qty-otherReserved;
        const take=Math.min(rest,avail);
        if(take>0) allocations.push({lotId:l.id,productId:pid,qty:take,cost:l.cost});
        rest-=take;
        if(!rest) break;
      }
      if(rest>0) throw Error('Estoque liberado insuficiente para '+s.products.find(p=>p.id===pid).name+'.');
    }
    return allocations;
  }

  function reserve(state,id){
    const s=clone(state),o=s.orders.find(o=>o.id===id);
    if(!o) throw Error('Pedido não encontrado.');
    if(o.reservations&&o.reservations.length) return s;
    const allocations=plan(s,o);
    allocations.forEach(a=>{
      const l=s.lots.find(l=>l.id===a.lotId);
      if(l) l.reserved=(l.reserved||0)+a.qty;
    });
    o.reservations=allocations;
    return s;
  }

  function releaseReservation(state,id){
    const s=clone(state),o=s.orders.find(o=>o.id===id);
    if(!o||!o.reservations||!o.reservations.length) return s;
    o.reservations.forEach(a=>{
      const l=s.lots.find(l=>l.id===a.lotId);
      if(l) l.reserved=Math.max(0,(l.reserved||0)-a.qty);
    });
    delete o.reservations;
    return s;
  }

  function complete(state,id){
    const s=clone(state),o=s.orders.find(o=>o.id===id);
    if(!o) throw Error('Pedido não encontrado.');
    if(o.status==='concluido') return s;
    if(o.status!=='pronto') throw Error('O pedido precisa estar pronto para concluir.');
    if(o.kind==='personalizado'&&!o.approved) throw Error('Aprove o orçamento do pedido personalizado primeiro.');
    if(o.payment==='fiado'&&(!o.due||days(o.due)<0)) throw Error('Informe um vencimento válido para a venda a prazo.');
    
    const allocations=(o.reservations&&o.reservations.length)?o.reservations:plan(s,o);
    allocations.forEach(a=>{
      const l=s.lots.find(l=>l.id===a.lotId);
      if(l){
        l.qty-=a.qty;
        if(l.reserved) l.reserved=Math.max(0,l.reserved-a.qty);
      }
      s.movements.push({id:'m'+(s.movements.length+1),type:'venda',orderId:id,...a,date:TODAY});
    });
    delete o.reservations;
    o.allocations=allocations;
    o.status='concluido';
    o.completedAt=TODAY;
    const rid='r-'+id;
    o.financeId=rid;
    s.receivables.push({
      id:rid,
      orderId:id,
      customerId:o.customerId,
      total:total(o),
      due:o.payment==='fiado'?o.due:TODAY,
      payments:o.payment==='fiado'?[]:[{id:'pg-'+id,amount:total(o),date:TODAY,method:o.payment}]
    });
    s.activity.unshift({
      title:'Pedido '+id+' concluído',
      detail:'Estoque atualizado · '+(o.payment==='fiado'?'conta a receber criada':'recebimento registrado'),
      date:TODAY
    });
    return s;
  }

  function receive(state,id,amount,method){
    const s=clone(state),r=s.receivables.find(r=>r.id===id);
    if(!r) throw Error('Conta não encontrada.');
    const cents=Math.round(Number(amount)*100);
    if(!Number.isFinite(Number(amount))||cents<=0||cents>Math.round(balance(r)*100)) throw Error('Informe um valor maior que zero e até o saldo em aberto.');
    r.payments.push({id:'pg-'+Date.now(),amount:cents/100,date:TODAY,method});
    return s;
  }

  function checkWeightTolerance(expectedGrams, actualGrams){
    const exp=Number(expectedGrams), act=Number(actualGrams);
    if(!exp||!act||exp<=0||act<=0) return {valid:false,diffPercent:0,message:'Pesos inválidos'};
    const diffPercent=Math.abs(act-exp)/exp;
    const withinTolerance=diffPercent<=0.05001;
    return {
      valid:withinTolerance,
      diffPercent:Math.round(diffPercent*1000)/10,
      divergenceGrams:act-exp,
      message:withinTolerance?'Pesagem dentro da tolerância de ±5%':'Divergência de pesagem acima de ±5% (exige justificativa)'
    };
  }

  const api={
    TODAY,
    PROFILES,
    days,
    clone,
    seed,
    total,
    balance,
    stock,
    availableStock,
    plan,
    reserve,
    releaseReservation,
    complete,
    receive,
    checkWeightTolerance,
    applyOfficialCatalog,
    getProfile,
    canAccessRoute,
    filterLotsForProfile,
    filterReceivablesForProfile,
    filterOrdersForProfile
  };

  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.ERP=api;
})(typeof globalThis!=='undefined'?globalThis:this);
