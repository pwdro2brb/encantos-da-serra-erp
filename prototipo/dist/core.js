(function(root){
  'use strict';
  const official=typeof module==='object'&&module.exports?require('./official.js'):root.ERP_OFFICIAL;
  const TODAY='2026-11-03';
  const days=(date)=>date?Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(TODAY+'T12:00:00Z'))/86400000):Infinity;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const products=clone(official.products);
  function applyOfficialCatalog(state){const next=clone(state);next.products=[...clone(products),...next.products.filter(p=>!products.some(o=>o.id===p.id))];next.catalogRevision=official.revision;return next;}
  const customers=[
    {id:'c1',name:'Marina Costa',type:'B2C',channel:'WhatsApp',contact:'Contato demonstrativo',city:'Belo Horizonte, MG'},
    {id:'c2',name:'Empório Raízes',type:'B2B',channel:'WhatsApp',contact:'Contato demonstrativo',city:'Lagoa Santa, MG'},
    {id:'c3',name:'Clara Almeida',type:'B2C',channel:'Instagram',contact:'Contato demonstrativo',city:'Belo Horizonte, MG'},
    {id:'c4',name:'Pousada Ipê',type:'B2B',channel:'WhatsApp',contact:'Contato demonstrativo',city:'Serra do Cipó, MG'},
    {id:'c5',name:'Rafael Nunes',type:'B2C',channel:'Formulário',contact:'Contato demonstrativo',city:'Contagem, MG'},
    {id:'c6',name:'Luiza Ferreira',type:'B2C',channel:'Instagram',contact:'Contato demonstrativo',city:'Belo Horizonte, MG'}
  ];
  function seed(){return {version:1,catalogRevision:official.revision,products:clone(products),customers:clone(customers),lots:[
    {id:'l1',productId:'p1',code:'QMC-1026',qty:8,expiry:'2026-11-08',received:'2026-10-25',location:'Câmara A · 01',cost:29},
    {id:'l2',productId:'p1',code:'QMC-1101',qty:26,expiry:'2026-11-24',received:'2026-11-01',location:'Câmara A · 02',cost:29},
    {id:'l3',productId:'p2',code:'DDL-1028',qty:42,expiry:'2026-12-28',received:'2026-10-28',location:'Prateleira B · 01',cost:18},
    {id:'l4',productId:'p3',code:'CAC-0901',qty:19,expiry:null,received:'2026-09-01',location:'Prateleira C · 02',cost:38},
    {id:'l5',productId:'p4',code:'GJB-1020',qty:9,expiry:'2026-11-16',received:'2026-10-20',location:'Prateleira B · 03',cost:15},
    {id:'l6',productId:'p5',code:'SAL-1029',qty:17,expiry:'2026-11-27',received:'2026-10-29',location:'Câmara A · 03',cost:25}
  ],orders:[
    {id:'ES-1048',customerId:'c1',channel:'WhatsApp',kind:'padrao',status:'novo',items:[{productId:'p1',qty:2,price:48},{productId:'p2',qty:1,price:32}],date:TODAY,delivery:'2026-11-05',payment:'pix',due:null,notes:'Retirada na loja, no período da tarde.',custom:'',approved:true},
    {id:'ES-1047',customerId:'c2',channel:'WhatsApp',kind:'padrao',status:'separacao',items:[{productId:'p1',qty:6,price:48},{productId:'p3',qty:2,price:65}],date:'2026-11-02',delivery:'2026-11-04',payment:'fiado',due:'2026-11-15',notes:'Entrega no empório. Preços de demonstração.',custom:'',approved:true},
    {id:'ES-1046',customerId:'c3',channel:'Instagram',kind:'personalizado',status:'analise',items:[{productId:'p2',qty:3,price:32},{productId:'p4',qty:3,price:28}],date:'2026-11-02',delivery:'2026-11-10',payment:'pix',due:null,notes:'Presente de aniversário.',custom:'3 kits com doces, cartão escrito à mão e laço verde.',approved:false},
    {id:'ES-1045',customerId:'c4',channel:'WhatsApp',kind:'padrao',status:'pronto',items:[{productId:'p1',qty:4,price:48},{productId:'p5',qty:2,price:42}],date:'2026-11-01',delivery:TODAY,payment:'fiado',due:'2026-11-12',notes:'Recepção da pousada até 17h.',custom:'',approved:true},
    {id:'ES-1044',customerId:'c5',channel:'Formulário',kind:'padrao',status:'novo',items:[{productId:'p3',qty:1,price:65}],date:TODAY,delivery:'2026-11-06',payment:'cartao',due:null,notes:'Retirada na loja.',custom:'',approved:true},
    {id:'ES-1043',customerId:'c6',channel:'Instagram',kind:'personalizado',status:'separacao',items:[{productId:'p1',qty:2,price:48},{productId:'p2',qty:2,price:32},{productId:'p4',qty:2,price:28}],date:'2026-11-01',delivery:'2026-11-06',payment:'pix',due:null,notes:'Montar em uma única cesta.',custom:'Cesta de boas-vindas com cartão personalizado.',approved:true},
    {id:'ES-1042',customerId:'c2',channel:'WhatsApp',kind:'padrao',status:'concluido',items:[{productId:'p2',qty:10,price:32}],date:'2026-10-25',delivery:'2026-10-27',payment:'fiado',due:'2026-10-31',notes:'Pedido anterior de demonstração.',custom:'',approved:true,completedAt:'2026-10-27',financeId:'r1',allocations:[]},
    {id:'ES-1041',customerId:'c4',channel:'WhatsApp',kind:'padrao',status:'concluido',items:[{productId:'p3',qty:4,price:65}],date:'2026-10-28',delivery:'2026-10-29',payment:'fiado',due:'2026-11-08',notes:'Pedido anterior de demonstração.',custom:'',approved:true,completedAt:'2026-10-29',financeId:'r2',allocations:[]}
  ],receivables:[
    {id:'r1',orderId:'ES-1042',customerId:'c2',total:320,due:'2026-10-31',payments:[{id:'pg1',amount:100,date:'2026-10-30',method:'pix'}]},
    {id:'r2',orderId:'ES-1041',customerId:'c4',total:260,due:'2026-11-08',payments:[]}
  ],movements:[],activity:[{title:'Marina enviou um novo pedido',detail:'ES-1048 · WhatsApp',date:TODAY},{title:'Clara solicitou um kit personalizado',detail:'ES-1046 · aguardando orçamento',date:'2026-11-02'}]};}
  const total=o=>Math.round(o.items.reduce((a,i)=>a+i.qty*i.price,0)*100)/100;
  const balance=r=>Math.round((r.total-r.payments.reduce((a,p)=>a+p.amount,0))*100)/100;
  const stock=(s,p,eligible=false)=>s.lots.filter(l=>l.productId===p&&(!eligible||days(l.expiry)>7)).reduce((a,l)=>a+l.qty,0);
  function plan(s,o){
    const needs={};for(const i of o.items)needs[i.productId]=(needs[i.productId]||0)+i.qty;
    const allocations=[];
    for(const [pid,qty] of Object.entries(needs)){
      let rest=qty;
      const lots=s.lots.filter(l=>l.productId===pid&&l.qty>0&&days(l.expiry)>7).sort((a,b)=>(a.expiry||'9999-12-31').localeCompare(b.expiry||'9999-12-31')||a.received.localeCompare(b.received));
      for(const l of lots){const take=Math.min(rest,l.qty);if(take>0)allocations.push({lotId:l.id,productId:pid,qty:take,cost:l.cost});rest-=take;if(!rest)break;}
      if(rest>0)throw Error('Estoque liberado insuficiente para '+s.products.find(p=>p.id===pid).name+'.');
    }return allocations;
  }
  function complete(state,id){
    const s=clone(state),o=s.orders.find(o=>o.id===id);if(!o)throw Error('Pedido não encontrado.');
    if(o.status==='concluido')return s;
    if(o.status!=='pronto')throw Error('O pedido precisa estar pronto para concluir.');
    if(o.kind==='personalizado'&&!o.approved)throw Error('Aprove o orçamento do pedido personalizado primeiro.');
    if(o.payment==='fiado'&&(!o.due||days(o.due)<0))throw Error('Informe um vencimento válido para a venda a prazo.');
    const allocations=plan(s,o);
    allocations.forEach(a=>{s.lots.find(l=>l.id===a.lotId).qty-=a.qty;s.movements.push({id:'m'+(s.movements.length+1),type:'venda',orderId:id,...a,date:TODAY});});
    o.allocations=allocations;o.status='concluido';o.completedAt=TODAY;
    const rid='r-'+id;o.financeId=rid;
    s.receivables.push({id:rid,orderId:id,customerId:o.customerId,total:total(o),due:o.payment==='fiado'?o.due:TODAY,payments:o.payment==='fiado'?[]:[{id:'pg-'+id,amount:total(o),date:TODAY,method:o.payment}]});
    s.activity.unshift({title:'Pedido '+id+' concluído',detail:'Estoque atualizado · '+(o.payment==='fiado'?'conta a receber criada':'recebimento registrado'),date:TODAY});return s;
  }
  function receive(state,id,amount,method){const s=clone(state),r=s.receivables.find(r=>r.id===id);if(!r)throw Error('Conta não encontrada.');const cents=Math.round(Number(amount)*100);if(!Number.isFinite(Number(amount))||cents<=0||cents>Math.round(balance(r)*100))throw Error('Informe um valor maior que zero e até o saldo em aberto.');r.payments.push({id:'pg-'+Date.now(),amount:cents/100,date:TODAY,method});return s;}
  const api={TODAY,days,clone,seed,total,balance,stock,plan,complete,receive,applyOfficialCatalog};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ERP=api;
})(typeof globalThis!=='undefined'?globalThis:this);
