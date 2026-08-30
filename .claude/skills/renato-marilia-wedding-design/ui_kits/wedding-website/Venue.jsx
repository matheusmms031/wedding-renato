function Venue(){
return (<section style={{padding:'72px 24px',background:'var(--surface-alt)',display:'flex',flexDirection:'column',alignItems:'center',gap:16,textAlign:'center'}}>
<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,fontFamily:'var(--font-label)',fontSize:12,letterSpacing:'0.18em',color:'var(--text-secondary)'}}>
<span style={{width:56,height:1,background:'var(--color-gold)'}}></span>LOCAL<span style={{width:56,height:1,background:'var(--color-gold)'}}></span>
</div>
<div style={{fontFamily:'var(--font-serif)',fontSize:26}}>Condomínio Mirante do Lago — Salão de Festas</div>
<div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--text-secondary)'}}>Palmas TO, CEP: 77019-870</div>
</section>);
}
window.Venue=Venue;
