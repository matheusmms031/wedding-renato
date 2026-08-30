const GIFTS=[
{id:'lua-de-mel',name:'Cota Lua de Mel',price:'R$ 200',desc:'Contribua com a viagem dos noivos'},
{id:'jantar',name:'Jantar Romântico',price:'R$ 150',desc:'Uma noite especial para o casal'},
{id:'eletro',name:'Eletrodoméstico',price:'R$ 350',desc:'Ajude a equipar a nova casa'},
{id:'decoracao',name:'Decoração da Casa',price:'R$ 120',desc:'Um toque especial para o novo lar'},
];
function GiftCard({gift,onGive}){
const [state,setState]=React.useState('idle');
return (<div style={{background:'var(--surface-card)',border:'1px solid var(--border-subtle)',boxShadow:'var(--shadow-card)',borderRadius:4,overflow:'hidden',display:'flex',flexDirection:'column'}}>
<image-slot id={'gift-'+gift.id} shape="rect" placeholder={gift.name} style={{width:'100%',height:180}}></image-slot>
<div style={{padding:20,display:'flex',flexDirection:'column',gap:8,flex:1}}>
<span style={{fontFamily:'var(--font-serif)',fontSize:20,color:'var(--text-primary)'}}>{gift.name}</span>
<span style={{fontFamily:'var(--font-serif)',fontSize:15,color:'var(--text-secondary)',flex:1}}>{gift.desc}</span>
<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
<span style={{fontFamily:'var(--font-label)',fontSize:16,color:'var(--color-gold-deep)',fontWeight:600}}>{gift.price}</span>
{state==='idle'&&<button onClick={()=>{setState('loading');setTimeout(()=>{setState('done');onGive&&onGive(gift);},900);}} style={{fontFamily:'var(--font-label)',letterSpacing:'0.14em',textTransform:'uppercase',fontWeight:600,fontSize:12,padding:'10px 18px',background:'var(--color-gold)',color:'var(--color-ivory)',border:'1px solid var(--color-gold)',borderRadius:2,cursor:'pointer'}}>Presentear</button>}
{state==='loading'&&<span style={{fontFamily:'var(--font-label)',fontSize:12,color:'var(--text-secondary)'}}>Redirecionando…</span>}
{state==='done'&&<span style={{fontFamily:'var(--font-label)',fontSize:12,color:'var(--color-gold-deep)'}}>Obrigado!</span>}
</div>
</div>
</div>);
}
function GiftsSection(){
return (<section id="Presentes" style={{padding:'80px 24px',background:'var(--surface-alt)'}}>
<div style={{textAlign:'center',marginBottom:56}}>
<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,fontFamily:'var(--font-label)',fontSize:12,letterSpacing:'0.18em',color:'var(--text-secondary)',marginBottom:16}}>
<span style={{width:56,height:1,background:'var(--color-gold)'}}></span>LISTA DE PRESENTES<span style={{width:56,height:1,background:'var(--color-gold)'}}></span>
</div>
<span style={{fontFamily:'var(--font-script)',fontSize:48,color:'var(--color-gold)'}}>Presentes</span>
<p style={{fontFamily:'var(--font-serif)',fontSize:17,color:'var(--text-secondary)',maxWidth:520,margin:'16px auto 0'}}>Sua presença é o maior presente. Se desejar nos presentear, o pagamento é processado de forma segura via Stripe.</p>
</div>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:28,maxWidth:1100,margin:'0 auto'}}>
{GIFTS.map(g=><GiftCard key={g.id} gift={g}/>)}
</div>
</section>);
}
window.GiftsSection=GiftsSection;
