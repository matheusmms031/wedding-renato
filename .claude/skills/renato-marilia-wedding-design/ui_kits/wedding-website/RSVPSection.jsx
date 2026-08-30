function RSVPSection(){
const [name,setName]=React.useState('');
const [sent,setSent]=React.useState(false);
const field={fontFamily:'var(--font-serif)',fontSize:17,padding:'10px 4px',background:'transparent',border:'none',borderBottom:'1px solid var(--border-subtle)',color:'var(--text-primary)',outline:'none',width:'100%'};
const labelStyle={fontFamily:'var(--font-label)',fontSize:11,letterSpacing:'0.15em',color:'var(--text-secondary)',textTransform:'uppercase'};
return (<section id="RSVP" style={{padding:'96px 24px',background:'var(--surface-page)',display:'flex',flexDirection:'column',alignItems:'center',gap:32}}>
<div style={{textAlign:'center'}}>
<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,fontFamily:'var(--font-label)',fontSize:12,letterSpacing:'0.18em',color:'var(--text-secondary)',marginBottom:16}}>
<span style={{width:56,height:1,background:'var(--color-gold)'}}></span>CONFIRME SUA PRESENÇA<span style={{width:56,height:1,background:'var(--color-gold)'}}></span>
</div>
<span style={{fontFamily:'var(--font-script)',fontSize:56,color:'var(--color-gold)'}}>RSVP</span>
</div>
<div style={{width:'100%',maxWidth:400,background:'var(--surface-card)',border:'1px solid var(--border-subtle)',boxShadow:'var(--shadow-card)',borderRadius:4,padding:32}}>
{sent?(<div style={{textAlign:'center',fontFamily:'var(--font-serif)',fontSize:18,color:'var(--text-secondary)'}}>Obrigado, {name||'convidado'}! Presença confirmada.</div>):(
<div style={{display:'flex',flexDirection:'column',gap:20}}>
<label style={{display:'flex',flexDirection:'column',gap:6}}><span style={labelStyle}>Nome completo</span><input style={field} value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/></label>
<label style={{display:'flex',flexDirection:'column',gap:6}}><span style={labelStyle}>Número de convidados</span><input style={field} type="number" defaultValue={1} min={1}/></label>
<button onClick={()=>setSent(true)} style={{marginTop:8,fontFamily:'var(--font-label)',letterSpacing:'0.18em',textTransform:'uppercase',fontWeight:600,fontSize:13,padding:'14px 0',background:'var(--color-gold)',color:'var(--color-ivory)',border:'1px solid var(--color-gold)',borderRadius:2,cursor:'pointer'}}>Confirmar</button>
</div>)}
</div>
</section>);
}
window.RSVPSection=RSVPSection;
