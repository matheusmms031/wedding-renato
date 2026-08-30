export interface InputProps{
label?:string;
placeholder?:string;
value?:string;
onChange?:(e:React.ChangeEvent<HTMLInputElement>)=>void;
type?:string;
required?:boolean;
}
