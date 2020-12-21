import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {
  constructor(protected sanitizer: DomSanitizer) { }
  transform(value: any,type: string = "url"): SafeHtml {
    switch(type){
      case "html":
        return this.sanitizer.bypassSecurityTrustHtml(value);
      case "url":
        return this.sanitizer.bypassSecurityTrustUrl(value);//data:image/png;base64,
      default: throw new Error(`Invalid safe type specified: ${type}`);  
    }
    
  }
}

