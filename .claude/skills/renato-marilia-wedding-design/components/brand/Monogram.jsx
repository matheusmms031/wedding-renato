import React from 'react';
export function Monogram({size=40,inverted=false}){
const color=inverted?'var(--color-ivory)':'var(--text-primary)';
return React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'8px',color}},
React.createElement('span',{style:{fontFamily:'var(--font-serif)',fontSize:size}},'R'),
React.createElement('span',{style:{fontFamily:'var(--font-script)',fontSize:size*0.85,color:'var(--color-gold-light)'}},'&'),
React.createElement('span',{style:{fontFamily:'var(--font-serif)',fontSize:size}},'M'));
}
