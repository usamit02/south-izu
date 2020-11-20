import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'media'
})
export class MediaPipe implements PipeTransform {
  constructor() { }
  transform(value: any, type: string): string {
    switch (type) {
      case 'react':
        let html: string = "";
        Object.keys(value).forEach(id => {
          html += '<span class="react" title="' + value[id].na + '">' + value[id].emoji + '<span style="display:none;">' + value[id].na + '</span></span>';
        });
        return html;
      default: throw new Error(`Invalid safe type specified: ${type}`);
    }
  }

}