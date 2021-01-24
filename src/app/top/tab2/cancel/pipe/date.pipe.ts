import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {
  constructor() { }
  transform(date: Date | number, type: string = "book"): string {
    switch (type) {
      case 'book':
        const days = ['日', '月', '火', '水', '木', '金', '土'];
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
        return `${(date.getMonth() + 1)}月${date.getDate()}日（${days[date.getDay()]}）`;
      case 'cancel':
        if (date < 2) {
          if (date < 1) {
            return "当日";
          } else {
            return "前日";
          }
        }
        return `～${date}日`;
    }
  }
}