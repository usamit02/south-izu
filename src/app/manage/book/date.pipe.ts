import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer,SafeHtml } from '@angular/platform-browser'
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {
  constructor(private sanitized: DomSanitizer) { }
  transform(date: Date | number, type: string = "remain"): string|SafeHtml {
    const days=['日','月','火','水','木','金','土'];
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
        let html=`<span style='color:gray'>${(date.getMonth() + 1)}月${date.getDate()}日（${days[date.getDay()]}）</span>`;
        return this.sanitized.bypassSecurityTrustHtml(html);
      } else {
        return "明日";
      }
    }
    return `${(date.getMonth() + 1)}月${date.getDate()}日（${days[date.getDay()]}）`;
  }
}