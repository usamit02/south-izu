import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {
  constructor() { }
  transform(date: Date | number | string, type: string = "remain"): string {
    date = new Date(date);    
    return (date.getMonth() + 1) + "月" + date.getDate() + "日";
  }
}