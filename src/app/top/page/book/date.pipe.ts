import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {
  constructor() { }
  transform(date: Date | number, type: string = "remain"): string {
    date = new Date(date);
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let d = new Date();
    let todate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let nextdate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    nextdate.setDate(todate.getDate() + 1);
    if (date < nextdate) {
      if (date.getTime() === todate.getTime()) {
        return "今日";
      } else if(date<todate){
        return "-";
      } else {
        return "明日";
      }
    }
    return (date.getMonth() + 1) + "月" + date.getDate() + "日";
  }
}