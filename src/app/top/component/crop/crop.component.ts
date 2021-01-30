import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ImageCroppedEvent } from 'ngx-image-cropper';
@Component({
  selector: 'app-crop',
  templateUrl: './crop.component.html',
  styleUrls: ['./crop.component.scss'],
})
export class CropComponent implements OnInit, AfterViewInit {
  @ViewChild('inputFile', { read: ElementRef, static: false }) inputFile: ElementRef;
  @Input() prop;
  rid: number;
  no: number;
  typ: string;
  inputEvent;
  imageChangedEvent: any = '';
  croppedImage: any = '';
  cripping: boolean = false;
  aspect: number;
  width: number;
  constructor(public pop: PopoverController, ) { }
  ngOnInit() {
    if (this.prop.typ === "avatar") {
      this.aspect = 1; this.width = 320;
    } else if (this.prop.typ === "shop") {
      this.aspect = 4 / 1; this.width = 480;
    } else {
      this.aspect = 16 / 9; this.width = 480;
    }
  }
  ngOnChanges(e) {
    //this.imageChangedEvent = this.inputEvent;
  }
  ngAfterViewInit() {
    if (!HTMLCanvasElement.prototype.toBlob) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value: function (callback, type, quality) {
          var dataURL = this.toDataURL(type, quality).split(',')[1];
          setTimeout(function () {
            var binStr = atob(dataURL),
              len = binStr.length,
              arr = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
              arr[i] = binStr.charCodeAt(i);
            }
            callback(new Blob([arr], { type: type || 'image/png' }));
          });
        }
      });
    }
    this.inputFile.nativeElement.click();
  }
  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
    this.croppedImage = "";
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
    this.cripping = true;
  }
  imageLoaded() {

  }
  cropperReady() {
  }
  loadImageFailed() {
    alert("画像のロードに失敗しました。");
  }
  end() {
    let bin = atob(this.croppedImage.replace(/^.*,/, ''));
    let buffer = new Uint8Array(bin.length);
    let blob: Blob;
    for (var i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
    }
    try {
      blob = new Blob([buffer.buffer], { type: 'image/jpeg' });
    } catch (e) {
      alert("ブロッブデータの作成に失敗しました。");
      return;
    }
    this.pop.dismiss(blob)
  }
}
/*

let bin = atob(this.croppedImage.replace(/^.*,/, ''));
    let buffer = new Uint8Array(bin.length);
    let blob: Blob;
    for (var i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
    }
    try {
      blob = new Blob([buffer.buffer], { type: 'image/jpeg' });
    } catch (e) {
      alert("ブロッブデータの作成に失敗しました。");
      return;
    }



*/