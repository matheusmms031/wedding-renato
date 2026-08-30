import React from 'react';
export interface ButtonProps{
children:React.ReactNode;
variant?:'primary'|'secondary'|'ghost';
size?:'sm'|'md'|'lg';
onClick?:()=>void;
type?:'button'|'submit';
disabled?:boolean;
}
