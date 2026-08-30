import React from 'react';
export function DateBlock({month='DEZEMBRO',day='20',weekday='DOMINGO',time='ÀS 11H',year='2026'}){
const label={fontFamily:'var(--font-label)',fontSize:'15px',fontWeight:600,letterSpacing:'.04em',color:'var(--text-primary)',borderTop:'1px solid var(--color-gold)',borderBottom:'1px solid var(--color-gold)',padding:'6px 14px'};
return React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',fontFamily:'var(--font-label)'}},
React.createElement('span',{style:{fontSize:'13px',letterSpacing:'var(--tracking-label)',color:'var(--text-secondary)'}},month),
React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'16px'}},
React.createElement('span',{style:label},weekday),
React.createElement('span',{style:{fontFamily:'var(--font-serif)',fontSize:'30px',color:'var(--color-gold-deep)'}},day),
React.createElement('span',{style:label},time)),
React.createElement('span',{style:{fontSize:'14px',color:'var(--text-secondary)',letterSpacing:'.08em'}},year));
}
