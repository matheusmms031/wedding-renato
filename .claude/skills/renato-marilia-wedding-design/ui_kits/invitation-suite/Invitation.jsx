function Invitation(){
const label={fontFamily:'var(--font-label)',fontWeight:600,fontSize:15,letterSpacing:'0.04em',borderTop:'1px solid var(--color-gold)',borderBottom:'1px solid var(--color-gold)',padding:'6px 14px'};
return React.createElement('div',{style:{width:600,background:'var(--surface-page)',border:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column',alignItems:'center',padding:'64px 56px',textAlign:'center',fontFamily:'var(--font-serif)',gap:22}},
React.createElement('span',{style:{fontFamily:'var(--font-label)',fontSize:14,letterSpacing:'0.14em',color:'var(--text-secondary)',lineHeight:1.8}},'VOCÊ ESTÁ CONVIDADO PARA A',React.createElement('br'),'NOSSA CERIMÔNIA DE CASAMENTO!'),
React.createElement('span',{style:{fontFamily:'var(--font-script)',fontSize:96,color:'var(--color-gold)',lineHeight:1,margin:'8px 0'}},'Renato e Marília'),
React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6}},
React.createElement('span',{style:{fontSize:18,fontWeight:600}},'1 Coríntios 13'),
React.createElement('span',{style:{fontSize:19,lineHeight:1.6,color:'var(--text-secondary)',maxWidth:440}},'12 Porque agora vemos por espelho em enigma, mas então veremos face a face.')),
React.createElement('div',{style:{fontFamily:'var(--font-label)',display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginTop:8}},
React.createElement('span',{style:{fontSize:14,letterSpacing:'0.2em',color:'var(--text-secondary)'}},'DEZEMBRO'),
React.createElement('div',{style:{display:'flex',alignItems:'center',gap:16}},
React.createElement('span',{style:label},'DOMINGO'),
React.createElement('span',{style:{fontFamily:'var(--font-serif)',fontSize:32,color:'var(--color-gold-deep)'}},'20'),
React.createElement('span',{style:label},'ÀS 11H')),
React.createElement('span',{style:{fontSize:14,letterSpacing:'0.1em',color:'var(--text-secondary)'}},'2026')),
React.createElement('div',{style:{fontSize:17,lineHeight:1.6,color:'var(--text-secondary)'}},
'Condomínio Mirante do Lago — Salão de Festas',React.createElement('br'),'Palmas TO CEP: 77019-870'));
}
window.Invitation=Invitation;
