function LoginScreen({onLogin}){
const [user,setUser]=React.useState('');
const [pass,setPass]=React.useState('');
const field={fontFamily:'var(--font-serif)',fontSize:17,padding:'10px 4px',background:'transparent',border:'none',borderBottom:'1px solid var(--border-subtle)',color:'var(--text-primary)',outline:'none',width:'100%'};
const labelStyle={fontFamily:'var(--font-label)',fontSize:11,letterSpacing:'0.15em',color:'var(--text-secondary)',textTransform:'uppercase'};
return (<section style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--surface-alt)',padding:24}}>
<div style={{width:'100%',maxWidth:400,background:'var(--surface-card)',border:'1px solid var(--border-subtle)',boxShadow:'var(--shadow-card)',borderRadius:4,padding:40,display:'flex',flexDirection:'column',gap:28}}>
<div style={{textAlign:'center',display:'flex',flexDirection:'column',gap:10}}>
<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,color:'var(--text-primary)'}}>
<span style={{fontFamily:'var(--font-serif)',fontSize:30}}>R</span>
<span style={{fontFamily:'var(--font-script)',fontSize:26,color:'var(--color-gold-light)'}}>&amp;</span>
<span style={{fontFamily:'var(--font-serif)',fontSize:30}}>M</span>
</div>
<span style={labelStyle}>Área dos convidados</span>
</div>
<div style={{display:'flex',flexDirection:'column',gap:22}}>
<label style={{display:'flex',flexDirection:'column',gap:6}}><span style={labelStyle}>Nome de usuário</span><input style={field} value={user} onChange={e=>setUser(e.target.value)} placeholder="Seu usuário"/></label>
<label style={{display:'flex',flexDirection:'column',gap:6}}><span style={labelStyle}>Senha</span><input style={field} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/></label>
</div>
<button onClick={()=>onLogin&&onLogin(user)} style={{fontFamily:'var(--font-label)',letterSpacing:'0.18em',textTransform:'uppercase',fontWeight:600,fontSize:13,padding:'14px 0',background:'var(--color-gold)',color:'var(--color-ivory)',border:'1px solid var(--color-gold)',borderRadius:2,cursor:'pointer'}}>Entrar</button>
</div>
</section>);
}
window.LoginScreen=LoginScreen;
