import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { PopoverController, ModalController } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/storage';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { ListComponent } from '../list/list.component';
import { CropComponent } from '../crop/crop.component';
import { APIURL } from '../../../../environments/environment';
@Component({
  selector: 'app-cast',
  templateUrl: './cast.component.html',
  styleUrls: ['./cast.component.scss'],
})
export class CastComponent implements OnInit {
  @Input() prop;
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  id = new FormControl(0, [Validators.required]);
  user = new FormControl("", [Validators.required]);
  shop = new FormControl(null, [Validators.required]);
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]);
  kana = new FormControl("", [Validators.minLength(2), Validators.maxLength(40), Validators.pattern(/^([ぁ-ん]|ー)+$/), Validators.required]);
  url = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  img = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  simg = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  castForm = this.builder.group({
    id: this.id, shop: this.shop, na: this.na, kana: this.kana, url: this.url, img: this.img, simg: this.simg, user: this.user,
  });
  shoping: string;
  imgBase64: string;
  imgs: Array<{ url, selected }> = [];
  videos: Array<{ url, selected }> = [];
  saving: boolean = false;
  eraseable: boolean = false;
  constructor(private api: ApiService, public pop: PopoverController, public modal: ModalController, private builder: FormBuilder,
    private strage: AngularFireStorage, private ui: UiService, ) { }
  ngOnInit() {
    this.user.setValue(this.prop.user.id);
    if (this.prop.id) {
      this.id.setValue(this.prop.id);
      this.undo();
    }
    if (this.prop.shop) {
      this.shop.setValue(this.prop.shop);
    }
  }
  async undo() {
    let res = await this.api.get('query', { table: 'cast', select: ['na', 'kana', 'img', 'simg', 'url', 'user'], where: { id: this.prop.id } });
    const controls = this.castForm.controls;
    for (let key of Object.keys(res.casts[0])) {
      controls[key].setValue(res.casts[0][key]);
    }
    const user = res.casts[0].user;
    res = await this.api.get('query', { table: 'castimg', select: ['url', 'video'], where: { cast: this.prop.id } });
    this.imgs = []; this.videos = [];
    for (let img of res.castimgs) {
      if (img.video) {
        this.videos.push({ url: img.url, selected: true });
      } else {
        this.imgs.push({ url: img.url, selected: true });
      }
    }
    if (this.prop.user.admin || this.prop.user.id === user && (!this.prop.report.id || this.prop.report.ack == null || Number(this.prop.report.ack) === -1)) {
      let where: any = { cast: this.prop.id };
      if (this.prop.report.id) where.id = { not: this.prop.report.id };
      const report = await this.api.get('query', { count: 'report', where: where });
      this.eraseable = report.count === 0 ? true : false;
    } else {
      this.eraseable = false;
    }
  }
  async popList(table: string) {
    let where: any = {};
    if (table === "shop") {
      where = { area: this.prop.area, genre: this.prop.genre };
    } else {
      return;
    }
    const popover = await this.pop.create({
      component: ListComponent,
      componentProps: { prop: { table: table, where: where } },
      translucent: true,
      //cssClass: 'cropper'
    });
    return await popover.present().then(() => {
      popover.onDidDismiss().then(event => {
        if (event.data) {
          this[table].reset(event.data.id);
          this[table + "ing"] = event.data.na;
        }
      });
    });;
  }
  refresh() {
    if (!this.url.valid || !this.url.value.length) return;
    this.api.get('scraping', { url: this.url.value }).then(res => {
      const origin = new URL(this.url.value).origin;
      this.imgs = res.imgs.map(img => { return { url: new URL(img, origin).href, selected: false } });
      this.videos = res.videos.map(video => { return { url: new URL(video, origin).href, selected: true } });
    });
  }
  async popCrop() {
    const popover = await this.pop.create({
      component: CropComponent,
      componentProps: { prop: { typ: 'avatar' } },
      translucent: true,
      cssClass: 'cropper'
    });
    return await popover.present().then(() => {
      popover.onDidDismiss().then(event => {
        if (event.data) {
          this.imgBase64 = event.data;
          this.castForm.markAsDirty();
        }
      });
    });;
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
            canvas.width = 80; canvas.height = 80;
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async blob => {
              const ref = this.strage.ref(`cast/${id}/small.jpg`);
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
          const ref = this.strage.ref(`cast/${id}/medium.jpg`);
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
      }
      res = await this.api.post('query', { table: "cast", update: this.castForm.value, where: { id: id } });
    } else {//新規
      res = await this.api.post('query', { table: "cast", insert: this.castForm.value });
      id = res.cast.id;
      const imgurls = await putImg(id);
      let update = { simg: "", img: "" };
      if (imgurls) {
        update = { simg: imgurls[0], img: imgurls[1] };
        res.cast.simg = imgurls[0]; res.cast.img = imgurls[1];
      } else {
        const src = `${APIURL}img/castnoimg`;
        update = { simg: `${src}s.jpg`, img: `${src}.jpg` };
        res.cast.simg = `${src}s.jpg`; res.cast.img = `${src}.jpg`;
      }
      await this.api.post('query', { table: "cast", update: update, where: { id: id } });
    }//引用動画画像をcastimgテーブルへ保存
    let inserts: Array<{ cast, url, video }> = [];
    for (let video of this.videos) {
      if (video.selected) inserts.push({ cast: id, url: video.url, video: 1 });
    }
    for (let img of this.imgs) {
      if (img.selected) inserts.push({ cast: id, url: img.url, video: 0 });
    }
    await this.api.post('querys', { table: "castimg", delete: { cast: id }, inserts: inserts });
    this.modal.dismiss(res.cast);
    this.saving = false;
  }
  async erase() {
    if (await this.ui.confirm(`削除確認`, `このキャストを本当に削除しますか？`)) {
      this.modal.dismiss({ id: null });
      await this.api.post('query', { table: "cast", delete: { id: this.prop.id } });
      this.strage.ref(`cast/${this.prop.id}/small.jpg`).delete();
      this.strage.ref(`cast/${this.prop.id}/medium.jpg`).delete();
      this.api.post('query', { table: "castimg", delete: { cast: this.prop.id } });
    }
  }
}
