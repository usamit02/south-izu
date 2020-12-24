export interface User {
  id: string;
  na: string;
  displayName: string;
  photoURL: string;
  avatar: string;
  image: string;
  token: string;
  admin: number;
  direct: string;
  p?: number;
  plan?: string;
  trial?: string;
  bank?: string;
}
export const USER = { id: "", na: "ゲスト", displayName: "", photoURL: "", avatar: "https://bloggersguild.cf/img/avatar.jpg", image: "https://bloggersguild.cf/img/avatar.jpg", token: "", admin: 0, direct: 'block' };

export interface Column {
  parent: number;
  id: number;
  na: string;
  kana: string;
  image: string;
  description: string;
  user?: string;
  acked?: Date;
  idx?: number;
  lock?: number;
}
export const COLUMN = { parent: 0, id: 0, na: "新しいコラムを追加", kana: "", image: "", description: "" };

export interface Marker {
  lat: number;
  lng: number;
  len?:number;
  label?: string;
  id:number;
  na: string;
  kana:string;
  txt: string;
  img: string;
  simg:string;
  url:string;
  phone:string;
  icon:string|number;
  iconurl?:string;
  user:string;
  user$?:Object;
  author?:Object;
  created?:Date|string;
  ack?:number;
  ackuser?:string;
  acked?:Date|string;
  rest?:number;
  chat?:number;
  distance?:string;
}
export const MARKER={id:0,na:"",kana:"",txt:"",lat:34.68503331,lng:138.85154339,url:"",phone:"",user:"",user$:{},img:"",simg:"",icon:0};