import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {
  constructor() { }
  transform(date: Date): string {
    date = new Date(date);
    let todate = new Date();
    let nextdate = new Date();
    const diff = new Date().getTime() - date.getTime();
    if (diff < 60000) {//1分以内
      return "今";
    } else if (diff < 600000) {//10分以内
      return Math.floor(diff / 60000) + "分前";
    }
    const h = date.getHours();
    const m = date.getMinutes();
    todate.setHours(0, 0, 0, 0);//今日の0時  
    nextdate.setDate(todate.getDate() - 1);
    if (date > nextdate) {
      if (date > todate) {
        return "今日 " + h + "時" + m + "分";
      } else {
        return "昨日 " + h + "時" + m + "分";
      }
    }
    return (date.getMonth() + 1) + "月" + date.getDate() + "日 " + h + "時" + m + "分";
  }
}
