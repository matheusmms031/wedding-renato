function Hero(){
const narrow=useNarrow(900);
return (<section style={{minHeight:narrow?'auto':'calc(100vh - 79px)',display:'flex',flexDirection:narrow?'column':'row',background:'var(--surface-page)'}}>
<div style={{width:narrow?'100%':'58%',height:narrow?'46vh':'100%',position:'relative'}}>
<image-slot id="hero-couple" shape="rect" placeholder="Foto do casal"></image-slot>
</div>
<div style={{width:narrow?'100%':'42%',flex:narrow?'none':undefined,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,padding:narrow?'56px 24px':'0 40px',textAlign:'center'}}>
<span style={{fontFamily:'var(--font-label)',fontSize:13,letterSpacing:'0.2em',color:'var(--text-secondary)'}}>VOCÊ ESTÁ CONVIDADO PARA A<br/>NOSSA CERIMÔNIA DE CASAMENTO</span>
<span style={{fontFamily:'var(--font-script)',fontSize:'clamp(48px,6vw,88px)',color:'var(--color-gold)',lineHeight:1}}>Renato &amp; Marília</span>
<div style={{display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:14,marginTop:8,fontFamily:'var(--font-label)'}}>
<span style={{fontSize:13,fontWeight:600,letterSpacing:'0.04em',borderTop:'1px solid var(--color-gold)',borderBottom:'1px solid var(--color-gold)',padding:'6px 12px',color:'var(--text-primary)'}}>DOMINGO</span>
<span style={{fontFamily:'var(--font-serif)',fontSize:28,color:'var(--color-gold-deep)'}}>20 DEZ</span>
<span style={{fontSize:13,fontWeight:600,letterSpacing:'0.04em',borderTop:'1px solid var(--color-gold)',borderBottom:'1px solid var(--color-gold)',padding:'6px 12px',color:'var(--text-primary)'}}>ÀS 11H</span>
</div>
</div>
</section>);
}
window.Hero=Hero;
