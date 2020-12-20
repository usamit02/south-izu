import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {
  constructor() { }
  transform(date: Date | number, type: string = "remain"): string {
    date = new Date(date);
    let todate = new Date();
    let nextdate = new Date();
    todate.setHours(0, 0, 24, 0);//今日の24時  
    nextdate.setDate(todate.getDate() + 1);
    if (date < nextdate) {
      if (date < todate) {
        return "今日";
      } else {
        return "明日";
      }
    }
    const weeks=["日","月","火","水","木","金","土"];
    return `${date.getMonth() + 1}月${date.getDate()}日（${weeks[date.getDay()]}）` ;
  }
}