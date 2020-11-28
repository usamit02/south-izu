import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {
  constructor() { }
  transform(date: Date, type: string = "chat"): string {
    date = new Date(date);
    let todate = new Date();
    let nextdate = new Date();
    const diff = new Date().getTime() - date.getTime();
    switch (type) {
      case 'chat':
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
        let nowYear1 = new Date(todate.getFullYear(), 0, 1);
        if (date > nowYear1) {
          return (date.getMonth() + 1) + "月" + date.getDate() + "日" + h + "時" + m + "分";
        } else {
          return date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日";
        }
      case 'day':
        todate.setHours(0, 0, 0, 0);//今日の0時  
        nextdate.setDate(todate.getDate() - 1);
        if (date > nextdate) {
          if (date > todate) {
            return "今日 ";
          } else {
            return "昨日 ";
          }
        }
        let nowYear = new Date(todate.getFullYear(), 0, 1);
        if (date > nowYear) {
          return (date.getMonth() + 1) + "月" + date.getDate() + "日";
        } else {
          return date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日";
        }
      case 'last':
        if (diff < 0) {
          let str: string;
          if (diff > -1 * 8640000) {
            str = "";
          } else {
            str = Math.floor(-diff / 86400000).toString() + "日と";
          }
          const time = -diff % 8640000;
          const h = Math.floor(time / 360000);
          const ms = time % 360000;
          const m = Math.floor(ms / 60000);
          //const s = Math.floor(ms % 60000 / 1000);
          return str += `${h}時間${m}分`;//${s}秒`;
        } else {
          return "期限経過済";
        }
      default: throw new Error(`Invalid safe type specified: ${type}`);
    }
  }

}