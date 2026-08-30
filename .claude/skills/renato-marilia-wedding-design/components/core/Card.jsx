import React from 'react';
export function Card({children,padding='32px'}){
return React.createElement('div',{style:{background:'var(--surface-card)',border:'1px solid var(--border-subtle)',boxShadow:'var(--shadow-card)',borderRadius:'var(--radius-md)',padding}},children);
}
