import React from 'react';
function NavMonogram({size=26}){
return React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-primary)'}},
React.createElement('span',{style:{fontFamily:'var(--font-serif)',fontSize:size}},'R'),
React.createElement('span',{style:{fontFamily:'var(--font-script)',fontSize:size*0.85,color:'var(--color-gold-light)'}},'&'),
React.createElement('span',{style:{fontFamily:'var(--font-serif)',fontSize:size}},'M'));
}
export function NavBar({links=[],active}){
return React.createElement('nav',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 40px',background:'var(--surface-page)',borderBottom:'1px solid var(--border-subtle)'}},
React.createElement(NavMonogram,{size:26}),
React.createElement('div',{style:{display:'flex',gap:'32px'}},
links.map((l,i)=>React.createElement('a',{key:i,href:l.href||'#',style:{fontFamily:'var(--font-label)',fontSize:'12px',letterSpacing:'var(--tracking-label)',textTransform:'uppercase',color:l.label===active?'var(--color-gold-deep)':'var(--text-secondary)',textDecoration:'none'}},l.label))));
}
