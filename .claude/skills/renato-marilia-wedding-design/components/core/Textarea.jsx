import React from 'react';
export function Textarea({label,placeholder,value,onChange,rows=4}){
return React.createElement('label',{style:{display:'flex',flexDirection:'column',gap:'6px',fontFamily:'var(--font-serif)'}},
label&&React.createElement('span',{style:{fontFamily:'var(--font-label)',fontSize:'11px',letterSpacing:'var(--tracking-label)',color:'var(--text-secondary)',textTransform:'uppercase'}},label),
React.createElement('textarea',{placeholder,value,onChange,rows,style:{fontFamily:'var(--font-serif)',fontSize:'17px',padding:'10px 4px',background:'transparent',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',outline:'none',resize:'vertical'}}));
}
