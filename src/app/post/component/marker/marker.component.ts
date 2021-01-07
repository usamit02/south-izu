import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { ModalController, MenuController } from '@ionic/angular';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/storage';
import * as EXIF from 'exif-js'
import { Story } from '../story/story.component';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { APIURL } from '../../../../environments/environment';
import { MARKERICON } from '../../../config';
@Component({
  selector: 'app-marker',
  templateUrl: './marker.component.html',
  styleUrls: ['./marker.component.scss'],
})
export class MarkerComponent implements OnInit {
  @Input() typ: string;
  @Input() parent: number;
  @Input() markers: Array<Marker>;
  @Input() story: Story;
  @ViewChild('upImg', { read: ElementRef, static: false }) upImg: ElementRef;//メディアファイル選択 
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]);
  txt = new FormControl("", [Validators.minLength(2), Validators.maxLength(500), Validators.required]);
  img = new FormControl("");
  latlng = new FormControl("", [Validators.required]);
  icon = new FormControl(0, [Validators.required]);
  markerForm = this.builder.group({ na: this.na, txt: this.txt, img: this.img, latlng: this.latlng, icon: this.icon, });
  lat: number = 34;
  lng: number = 138;
  openedWindow: number = 1;
  marker: Marker = MARKER;
  markericon = MARKERICON;
  icons = [];
  imgData;
  noimgUrl = APIURL + 'img/noimg.jpg';
  isReordered=false;
  constructor(private api: ApiService, public modal: ModalController, public menu: MenuController, private builder: FormBuilder, private ui: UiService,
    private storage: AngularFireStorage,) { }
  async ngOnInit() {
    let marker: Marker;
    Object.keys(this.markericon).forEach(key => {
      this.icons.push({ ...this.markericon[key], id: key });
    });
    if (!this.markers.length) {
      const res = await this.api.get('query', { select: ['id', 'latlng', 'na', 'txt', 'img', 'icon', 'idx'], table: 'story_marker', where: { typ: this.typ, parent: this.parent } });
      this.markers = res.story_markers
    }
    let markers = this.markers.filter(marker => { return marker.id === this.story.id; });
    if (markers.length) {
      marker = markers[0];
    } else {
      let lat = this.story.lat ? this.story.lat : this.lat;
      let lng = this.story.lng ? this.story.lng : this.lng;
      let dummy = document.createElement('div');
      let txt = this.story.txt == null ? "" : this.story.txt;
      dummy.innerHTML = txt;
      let na = "";
      const removeTag = new RegExp("<(\"[^\"]*\"|'[^']*'|[^'\">])*>", "g");
      for (let i = 6; i > 0; i--) {
        let h = dummy.querySelector(`h${i}`);
        if (h) {
          na = h.innerHTML.replace(removeTag, "");
          const removeH = new RegExp(`<h${i}(?: .+?)?>.*?<\/h${i}>`, "g");
          txt = txt.replace(removeH, "");
        }
      }
      txt = `${txt.replace(removeTag, "").replace("\n", "").slice(0, 100)}${txt.length > 100 ? '...' : ""}`;
      dummy.innerHTML = this.story.media;
      const img = dummy.querySelector('img');
      if (img.tagName === 'img' || img.tagName === 'IMG') {
        let image = new Image;
        image.crossOrigin = "Anonymous";
        image.onload = () => {
          let canvas: HTMLCanvasElement = this.canvas.nativeElement;
          canvas.width = image.width;
          canvas.height = image.height;
          canvas.getContext('2d').drawImage(image, 0, 0);
          this.imgData = canvas.toDataURL("image/jpeg");
        }
        image.src = img.src;
      }
      marker = { id: this.story.id, na: na, txt: txt, img: "", icon: 1, lat: lat, lng: lng, idx: this.story.idx };
      this.markers.push(marker);
    }
    this.undo(marker);
  }
  async mapRightClick(lat: number, lng: number) {
    const confirm = await this.ui.confirm('マーカー位置', '変更しますか');
    if (confirm) {
      this.latlng.setValue(`POINT(${lng} ${lat})`);
      this.markerForm.markAsDirty();
      this.markers = this.markers.map((marker: Marker) => {
        if (marker.id === this.marker.id) {
          marker.lat = lat; marker.lng = lng;
        }
        return marker
      });
    }
  }
  markerClick(marker) {

  }
  markerRightClick(marker) {

  }
  openWindow(id) {
    this.openedWindow = id;
  }
  isInfoWindowOpen(id) {
    return this.openedWindow == id;
  }
  undo(marker: Marker) {
    const controls = this.markerForm.controls
    for (let key of Object.keys(controls)) {
      if (key !== "lat" && key !== "lng") {
        controls[key].setValue(marker[key]);
      }
    }
    if (marker.img) {
      if (this.marker.img !== marker.img) {
        let image = new Image;
        image.crossOrigin = "Anonymous";
        image.onload = () => {
          let canvas: HTMLCanvasElement = this.canvas.nativeElement;
          canvas.width = image.width;
          canvas.height = image.height;
          canvas.getContext('2d').drawImage(image, 0, 0);
          this.imgData = canvas.toDataURL("image/jpeg");
        }
        image.src = marker.img;
      }
    } else {
      this.imgData = "";
    }
    this.latlng.setValue(`POINT(${marker.lng} ${marker.lat})`);
    setTimeout(() => { this.lat = marker.lat; this.lng = marker.lng; }, 3000);
    this.markerForm.markAsPristine();
    this.marker = marker;
  }
  imgChange(e) {
    if (e.target.files[0].type.match(/image.*/)) {
      this.imgData = window.URL.createObjectURL(e.target.files[0]);
      this.markerForm.markAsDirty();
      EXIF.getData(e.target.files[0], async () => {
        let gpsLat = EXIF.getTag(e.target.files[0], "GPSLatitude");
        let gpsLng = EXIF.getTag(e.target.files[0], "GPSLongitude");
        if (gpsLat && gpsLng) {
          const lat = gpsLat[0] + gpsLat[1] / 60 + gpsLat[2] / 3600;
          const lng = gpsLng[0] + gpsLng[1] / 60 + gpsLng[2] / 3600;
          console.log(`lat:${lat} lng:${lng}`);
          if (!(this.marker.lat === lat && this.marker.lng === lng)) {
            if (await this.ui.confirm('マーカー位置', '写真に記録されたGPSデータに変更しますか。')) {
              this.latlng.setValue(`POINT(${lng} ${lat})`);
              this.marker.lat = lat; this.marker.lng = lng;
              this.markers = this.markers.map(marker => {
                if (marker.id === this.marker.id) {
                  marker.lat = lat; marker.lng = lng;
                }
                return marker;
              })
            }
          }
        }
      })
    } else {
      this.ui.pop("画像ファイルjpgまたはpngを選択してください。");
    }
  }
  imgDel() {
    if (this.imgData) {
      this.imgData = "";
    } else if (this.img.value) {
      this.img.setValue("");
      this.markerForm.markAsDirty();
    }
  }
  reorder(e){
    let temp = this.markers[e.detail.from];
    this.markers[e.detail.from] = this.markers[e.detail.to];
    this.markers[e.detail.to] = temp;
    let idx=this.markers[e.detail.from].idx;
    this.markers[e.detail.from].idx=this.markers[e.detail.to].idx;
    this.markers[e.detail.to].idx=idx;
    e.detail.complete(true);
    this.isReordered=true;
  }
  orderSave(){
    let updates=[];
    for(let marker of this.markers){
      updates.push({update:{idx:marker.idx},where:{id:marker.id}});
    }
    this.api.post('querys',{table:"story_marker",updates:updates}).then(res=>{
      this.menu.close();
    });
  }
  async save() {
    this.ui.loading('保存中');
    if (!HTMLCanvasElement.prototype.toBlob) {//edge対策
      Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value: function (callback, type, quality) {
          let canvas = this;
          setTimeout(function () {
            var binStr = atob(canvas.toDataURL(type, quality).split(',')[1]),
              len = binStr.length,
              arr = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              arr[i] = binStr.charCodeAt(i);
            }
            callback(new Blob([arr], { type: type || 'image/jpeg' }));
          });
        }
      });
    }
    const imagePut = (id: number) => {
      return new Promise<string>(resolve => {
        if (!this.imgData) return resolve("");
        let canvas: HTMLCanvasElement = this.canvas.nativeElement;
        let ctx = canvas.getContext('2d');
        let image = new Image();
        image.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const px = 160;//typ == 'small' ? 160 : 640;
          let w, h;
          if (image.width > image.height) {
            w = image.width > px ? px : image.width;//横長
            h = image.height * (w / image.width);
          } else {
            h = image.height > px * 0.75 ? px * 0.75 : image.height;//縦長
            w = image.width * (h / image.height);
          }
          canvas.width = w; canvas.height = h;
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(async blob => {
            const ref = this.storage.ref(`story_marker/${id}.jpg`);
            await ref.put(blob);
            const url = await ref.getDownloadURL().toPromise();
            return resolve(url);
          }, "image/jpeg")
        }
        image.src = this.imgData;
      });
    }
    if (this.imgData) {
      this.img.setValue(await imagePut(this.marker.id));
    } else if (!this.img.value && this.marker.img) {
      this.storage.ref(`story_marker/${this.marker.id}.jpg`).delete();
    }
    const insert = { ...this.markerForm.value, id: this.marker.id, typ: this.typ, parent: this.parent, idx: this.marker.idx };
    this.api.post('query', { table: "story_marker", insert: insert, duplicate: ['na', 'txt', 'img', 'latlng', 'icon', 'idx'] }).then(res => {
      this.marker = { ...this.marker, ...this.markerForm.value };
      let insert = true;
      this.markers = this.markers.map(marker => {
        if (this.marker.id === marker.id) {
          marker = this.marker;
          insert = false;
        }
        return marker;
      });
      if (insert) this.markers.push(this.marker);
      this.modal.dismiss({ markers: this.markers });
    }).catch(err => {
      this.ui.alert('保存できませんでした。');
    }).finally(() => { this.ui.loadend(); });
  }
}
export interface Marker {
  id: number;
  lat: number;
  lng: number;
  na: string;
  txt: string;
  img: string;
  icon: number;
  idx: number;
}
export const MARKER = { id: 0, na: "", txt: "", lat: 34.68503331, lng: 138.85154339, img: "", icon: 0, idx: 0 }