function RSVPCard(){
const [name,setName]=React.useState('');
const [guests,setGuests]=React.useState('1');
const [sent,setSent]=React.useState(false);
const field={fontFamily:'var(--font-serif)',fontSize:17,padding:'10px 4px',background:'transparent',border:'none',borderBottom:'1px solid var(--border-subtle)',color:'var(--text-primary)',outline:'none',width:'100%'};
const labelStyle={fontFamily:'var(--font-label)',fontSize:11,letterSpacing:'0.15em',color:'var(--text-secondary)',textTransform:'uppercase'};
return React.createElement('div',{style:{width:420,background:'var(--surface-card)',border:'1px solid var(--border-subtle)',boxShadow:'var(--shadow-card)',borderRadius:4,padding:36,fontFamily:'var(--font-serif)'}},
React.createElement('div',{style:{textAlign:'center',marginBottom:24}},
React.createElement('div',{style:labelStyle},'Confirme sua presença'),
React.createElement('div',{style:{fontFamily:'var(--font-script)',fontSize:44,color:'var(--color-gold)',marginTop:6}},'RSVP')),
sent?React.createElement('div',{style:{textAlign:'center',color:'var(--text-secondary)',fontSize:18,padding:'20px 0'}},'Obrigado! Sua presença foi confirmada.'):
React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:20}},
React.createElement('label',{style:{display:'flex',flexDirection:'column',gap:6}},React.createElement('span',{style:labelStyle},'Nome completo'),React.createElement('input',{style:field,value:name,onChange:e=>setName(e.target.value),placeholder:'Seu nome'})),
React.createElement('label',{style:{display:'flex',flexDirection:'column',gap:6}},React.createElement('span',{style:labelStyle},'Número de convidados'),React.createElement('input',{style:field,value:guests,onChange:e=>setGuests(e.target.value),type:'number',min:1})),
React.createElement('button',{onClick:()=>setSent(true),style:{marginTop:8,fontFamily:'var(--font-label)',letterSpacing:'0.18em',textTransform:'uppercase',fontWeight:600,fontSize:13,padding:'14px 0',background:'var(--color-gold)',color:'var(--color-ivory)',border:'1px solid var(--color-gold)',borderRadius:2,cursor:'pointer'}},'Confirmar')));
}
window.RSVPCard=RSVPCard;
