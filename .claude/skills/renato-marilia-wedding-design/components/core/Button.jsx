import React from 'react';
export function Button({children,variant='primary',size='md',onClick,type='button',disabled}){
const base={fontFamily:'var(--font-label)',letterSpacing:'var(--tracking-label)',textTransform:'uppercase',fontWeight:600,border:'1px solid var(--color-gold)',cursor:disabled?'default':'pointer',opacity:disabled?0.5:1,transition:'background .2s ease,color .2s ease,border-color .2s ease',background:'transparent',borderRadius:'var(--radius-sm)'};
const sizes={sm:{fontSize:'11px',padding:'8px 16px'},md:{fontSize:'13px',padding:'12px 28px'},lg:{fontSize:'14px',padding:'16px 40px'}};
const variants={
primary:{background:'var(--color-gold)',color:'var(--color-ivory)',borderColor:'var(--color-gold)'},
secondary:{background:'transparent',color:'var(--color-gold-deep)',borderColor:'var(--color-gold)'},
ghost:{background:'transparent',color:'var(--text-primary)',borderColor:'transparent'}
};
const hover={
primary:{background:'var(--color-gold-deep)',borderColor:'var(--color-gold-deep)'},
secondary:{background:'var(--color-gold)',color:'var(--color-ivory)'},
ghost:{color:'var(--color-gold-deep)'}
};
const [isHover,setHover]=React.useState(false);
const style={...base,...sizes[size],...variants[variant],...(isHover&&!disabled?hover[variant]:{})};
return React.createElement('button',{type,onClick,disabled,style,onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false)},children);
}
