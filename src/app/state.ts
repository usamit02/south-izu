import { User, USER, Column, COLUMN,Marker,MARKER } from './class'
export interface State {
  user: User,
  columns: Array<Column>,
  marker:Marker,
  markers:Array<Marker>,
}
export const initialState = {
  user: USER,
  columns: [COLUMN],
  marker:MARKER,
  markers:[MARKER]
}