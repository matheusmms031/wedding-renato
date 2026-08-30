function SiteNavBar({active}){
const links=['Início','Nossa História','Presentes','RSVP'];
const narrow=useNarrow(760);
return (<nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',rowGap:14,padding:narrow?'18px 24px':'22px 56px',background:'var(--surface-page)',borderBottom:'1px solid var(--border-subtle)',position:'sticky',top:0,zIndex:10}}>
<div style={{display:'flex',alignItems:'center',gap:6}}>
<span style={{fontFamily:'var(--font-serif)',fontSize:24}}>R</span>
<span style={{fontFamily:'var(--font-script)',fontSize:20,color:'var(--color-gold-light)'}}>&amp;</span>
<span style={{fontFamily:'var(--font-serif)',fontSize:24}}>M</span>
</div>
<div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:narrow?18:36,width:narrow?'100%':'auto'}}>
{links.map(l=>(<a key={l} href={'#'+l} style={{fontFamily:'var(--font-label)',fontSize:12,letterSpacing:'0.16em',textTransform:'uppercase',textDecoration:'none',color:l===active?'var(--color-gold-deep)':'var(--text-secondary)'}}>{l}</a>))}
</div>
</nav>);
}
window.SiteNavBar=SiteNavBar;
