import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {
  constructor() { }
  transform(date: number, type: string = "remain"): string {
    if (date > 30 * 24 * 60 * 60 * 1000) {
      return "∞";
    }
    let dat = new Date(date);
    const d = dat.getUTCDate() - 1;
    const h = dat.getUTCHours();
    const m = dat.getUTCMinutes();

    let text = d ? `${d}日と\n` : "";
    text += h ? `${h}時間` : "";
    text += m ? `${m}分` : "1分以内";
    return text;
  }

}