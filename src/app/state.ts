import { User, USER, Column, COLUMN,Marker,MARKER } from './class'
export interface State {
  user: User,
  columns: Array<Column>,
  marker:Marker,
  markers:Array<Marker>,
  home:number,
}
export const initialState = {
  user: USER,
  columns: [COLUMN],
  marker:MARKER,
  markers:[MARKER],
  home:1,
}