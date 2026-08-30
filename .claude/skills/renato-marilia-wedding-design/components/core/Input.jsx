import React from 'react';
export function Input({label,placeholder,value,onChange,type='text',required}){
return React.createElement('label',{style:{display:'flex',flexDirection:'column',gap:'6px',fontFamily:'var(--font-serif)'}},
label&&React.createElement('span',{style:{fontFamily:'var(--font-label)',fontSize:'11px',letterSpacing:'var(--tracking-label)',color:'var(--text-secondary)',textTransform:'uppercase'}},label,required?' *':''),
React.createElement('input',{type,placeholder,value,onChange,required,style:{fontFamily:'var(--font-serif)',fontSize:'17px',padding:'10px 4px',background:'transparent',border:'none',borderBottom:'1px solid var(--border-subtle)',color:'var(--text-primary)',outline:'none'},onFocus:e=>e.target.style.borderBottomColor='var(--color-gold)',onBlur:e=>e.target.style.borderBottomColor='var(--border-subtle)'}));
}
