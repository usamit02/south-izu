import { Component, OnInit, Input, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/storage';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { APIURL } from '../../../../environments/environment';
//import { CropComponent } from '../crop/crop.component';
@Component({
  selector: 'app-marker',
  templateUrl: './marker.component.html',
  styleUrls: ['./marker.component.scss'],
})
export class MarkerComponent implements OnInit {
  @Input() prop;
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  id = new FormControl(0, [Validators.required]);
  user = new FormControl("", [Validators.required]);
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]);
  txt = new FormControl("", [Validators.minLength(2), Validators.maxLength(40), Validators.pattern(/^([ぁ-ん]|ー)+$/), Validators.required]);
  phone = new FormControl("", [Validators.pattern(/^(([0-9]{2,4}-[0-9]{2,4}-[0-9]{3,4}))$/), Validators.required]);
  url = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  img = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  simg = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  markerForm = this.builder.group({
    id: this.id, user: this.user, na: this.na, txt: this.txt, phone: this.phone, url: this.url, img: this.img,simg:this.simg
  });  
  undoing: boolean = false;
  imgBase64: string;
  imgs: Array<{ url }> = [];
  eraseable: boolean = false;
  saving: boolean = false;
  constructor(private api: ApiService, public modal: ModalController, private builder: FormBuilder,
    private strage: AngularFireStorage, private ui: UiService, ) { }
  ngOnInit() {
    this.user.setValue(this.prop.user.id);
    if (this.prop.id) {
      this.id.setValue(this.prop.id);
      this.undo();
    }
  }
  async undo() {
    this.undoing = true;
    const res = await this.api.get('query', { table: 'marker', select: ['na', 'txt', 'phone', 'img', 'url', 'user'], where: { id: this.prop.id } });
    const user = res.markers[0].user;
    const controls = this.markerForm.controls;
    for (let key of Object.keys(res.shops[0])) {
      if (res.shops[0][key]) {
        controls[key].setValue(res.shops[0][key].toString());
      } else {
        controls[key].reset();
      }
    }
    if (this.prop.user.admin || this.prop.user.id === user ) {      
      this.eraseable = true;
    } else {
      this.eraseable = false;
    }
    setTimeout(() => { this.undoing = false;}, 1000);
  }
  async save() {
    if (this.saving) return;
    this.saving = true;
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
    const putImg = id => {
      return new Promise(async resolve => {
        if (!(id && this.imgBase64)) return resolve();
        const smallPut = new Promise(resolve => {
          let canvas: HTMLCanvasElement = this.canvas.nativeElement;
          let ctx = canvas.getContext('2d');
          let image = new Image();
          image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 160; canvas.height = 40;
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async blob => {
              const ref = this.strage.ref(`marker/${id}/small.jpg`);
              await ref.put(blob);
              const url = await ref.getDownloadURL().toPromise();
              return resolve(url);
            }, "image/jpeg")
          }
          image.src = this.imgBase64;
        });
        const mediumPut = new Promise(async (resolve, reject) => {
          let bin = atob(this.imgBase64.replace(/^.*,/, ''));
          let buffer = new Uint8Array(bin.length);
          let blob: Blob;
          for (var i = 0; i < bin.length; i++) {
            buffer[i] = bin.charCodeAt(i);
          }
          try {
            blob = new Blob([buffer.buffer], { type: 'image/jpeg' });
          } catch (e) {
            alert("ブロッブデータの作成に失敗しました。");
            return reject();
          }
          const ref = this.strage.ref(`marker/${id}/medium.jpg`);
          await ref.put(blob);
          const url = await ref.getDownloadURL().toPromise();
          return resolve(url);
        });
        resolve(await Promise.all([smallPut, mediumPut]));
      });
    };
    let res: any;
    let id = this.id.value;
    if (id) {//更新
      const imgurls = await putImg(id);
      if (imgurls) {
        this.simg.setValue(imgurls[0]); this.img.setValue(imgurls[1]);
      } else {
        const src = `${APIURL}img/noimage`;
        this.simg.setValue(`${src}s.png`); this.img.setValue(`${src}.png`);
      }
      res = await this.api.post('query', { table: "marker", update: this.markerForm.value, where: { id: id } });
    } else {//新規      
      let update = { simg: "", img: "" };
      res = await this.api.post('query', { table: "marker", insert: this.markerForm.value });
      id = res.marker.id;
      const imgurls = await putImg(id);
      if (imgurls) {
        update = { simg: imgurls[0], img: imgurls[1] };
        res.marker.simg = imgurls[0]; res.marker.img = imgurls[1];
      } else {
        const src = `${APIURL}img/noimage`;
        update = { simg: `${src}s.png`, img: `${src}.png` };
        res.marker.simg = `${src}s.png`; res.marker.img = `${src}.png`;
      }
      await this.api.post('query', { table: "marker", update: update, where: { id: id } });
    }
    this.modal.dismiss(res.marker);
  }
  async erase() {
    if (await this.ui.confirm(`削除確認`, `このマーカーを本当に削除しますか？`)) {
      this.modal.dismiss({ id: null });
      await this.api.post('query', { table: "marker", delete: { id: this.prop.id } });
      this.strage.ref(`marker/${this.prop.id}/small.jpg`).delete();
      this.strage.ref(`marker/${this.prop.id}/medium.jpg`).delete();
    }
  }
}
