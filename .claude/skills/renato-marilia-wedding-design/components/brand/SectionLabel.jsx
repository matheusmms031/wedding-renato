import React from 'react';
export function SectionLabel({children}){
return React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',gap:'14px',fontFamily:'var(--font-label)',fontSize:'12px',letterSpacing:'var(--tracking-label)',color:'var(--text-secondary)',textTransform:'uppercase'}},
React.createElement('span',{style:{width:'56px',height:'1px',background:'var(--color-gold)'}}),
React.createElement('span',null,children),
React.createElement('span',{style:{width:'56px',height:'1px',background:'var(--color-gold)'}}));
}
