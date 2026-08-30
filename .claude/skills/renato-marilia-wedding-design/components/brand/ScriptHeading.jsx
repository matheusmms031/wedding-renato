import React from 'react';
export function ScriptHeading({children,size='md',color}){
const sizes={md:'var(--text-script-md)',lg:'var(--text-script-hero)'};
return React.createElement('span',{style:{fontFamily:'var(--font-script)',fontSize:sizes[size],color:color||'var(--color-gold)',lineHeight:1}},children);
}
