export interface TextareaProps{
label?:string;
placeholder?:string;
value?:string;
onChange?:(e:React.ChangeEvent<HTMLTextAreaElement>)=>void;
rows?:number;
}
