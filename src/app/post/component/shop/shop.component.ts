import { Component, OnInit, Input, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { PopoverController, ModalController } from '@ionic/angular';
import { take, skip } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { APIURL } from '../../../../environments/environment';
import { CropComponent } from '../crop/crop.component';
@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
})
export class ShopComponent implements OnInit {
  @Input() prop;
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  @ViewChildren('regionOptions', { read: ElementRef }) regionOptions: QueryList<ElementRef>;
  @ViewChildren('areaOptions', { read: ElementRef }) areaOptions: QueryList<ElementRef>;
  @ViewChildren('genreOptions', { read: ElementRef }) genreOptions: QueryList<ElementRef>;
  id = new FormControl(0, [Validators.required]);
  user = new FormControl("", [Validators.required]);
  region = new FormControl("", [Validators.required]);
  area = new FormControl("", [Validators.required]);
  genre = new FormControl("", [Validators.required]);
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]);
  kana = new FormControl("", [Validators.minLength(2), Validators.maxLength(40), Validators.pattern(/^([ぁ-ん]|ー)+$/), Validators.required]);
  phone = new FormControl("", [Validators.pattern(/^(([0-9]{2,4}-[0-9]{2,4}-[0-9]{3,4}))$/), Validators.required]);
  url = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  img = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  simg = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  shopForm = this.builder.group({
    id: this.id, user: this.user, region: this.region, area: this.area, genre: this.genre, na: this.na, kana: this.kana,
    phone: this.phone, url: this.url, img: this.img, simg: this.simg,
  });
  regions = [];
  areas = [];
  genres = [];
  undoing: boolean = false;
  imgBase64: string;
  imgs: Array<{ url }> = [];
  eraseable: boolean = false;
  saving: boolean = false;
  constructor(private api: ApiService, public pop: PopoverController, public modal: ModalController, private builder: FormBuilder,
    private strage: AngularFireStorage, private ui: UiService, ) { }
  ngOnInit() {
    this.user.setValue(this.prop.user.id);
    if (this.prop.id) {
      this.id.setValue(this.prop.id);
      this.undo();
    } else {
      let param: any = this.prop.region ? { where: { id: this.prop.region } } : {};
      param.table = "region";
      this.api.get('query', param).then(res => {
        this.regions = res.regions;
        this.regionOptions.changes.pipe(take(1)).toPromise().then(() => {
          this.region.setValue(res.regions[0].id.toString());
        });
        param = this.prop.area ? { where: { id: this.prop.area } } : { region: res.regions[0].id };
        param.table = "area";
        this.api.get('query', param).then(res => {
          this.areas = res.areas;
          this.areaOptions.changes.pipe(take(1)).toPromise().then(() => {
            this.area.setValue(res.areas[0].id.toString());
          });
        });
      });
      param = this.prop.genre ? { where: { id: this.prop.genre } } : {};
      param.table = "genre";
      this.api.get('query', param).then(res => {
        this.genres = res.genres;
        this.genreOptions.changes.pipe(take(1)).toPromise().then(() => {
          this.genre.setValue(res.genres[0].id.toString());
        });
      });
    }
  }
  async resetArea(area) {
    if (this.undoing) return;
    const res = await this.api.get('query', { table: 'area', where: { region: this.region.value } });
    this.areas = res.areas;
    await this.areaOptions.changes.pipe(take(1)).toPromise();
    if (res.areas.length) {
      this.area.setValue(area.toString());
    } else {
      this.area.reset();
    }
  }
  refresh() {
    if (!this.url.valid || !this.url.value.length) return;
    this.api.get('scraping', { url: this.url.value }).then(res => {
      const origin = new URL(this.url.value).origin;
      this.imgs = res.imgs.map(img => { return { url: new URL(img, origin).href } });
    });
  }
  async popCrop() {
    const popover = await this.pop.create({
      component: CropComponent,
      componentProps: { prop: { typ: 'shop' } },
      translucent: true,
      cssClass: 'cropper'
    });
    return await popover.present().then(() => {
      popover.onDidDismiss().then(event => {
        if (event.data) {
          this.imgBase64 = event.data;
          this.shopForm.markAsDirty();
        }
      });
    });;
  }
  async undo() {
    this.undoing = true;
    const res = await this.api.get('query', { table: 'shop', select: ['na', 'kana', 'phone', 'region', 'area', 'genre', 'img', 'simg', 'url', 'user'], where: { id: this.prop.id } });
    const user = res.shops[0].user;
    const regionOptions = this.regionOptions.changes.pipe(skip(1), take(1)).toPromise();
    const genreOptions = this.genreOptions.changes.pipe(skip(1), take(1)).toPromise();
    this.api.get('query', { table: 'region' }).then(res => {
      this.regions = res.regions;
    });
    this.api.get('query', { table: 'genre' }).then(res => {
      this.genres = res.genres;
    });
    await Promise.all([regionOptions, genreOptions]);//各select optionsが描画されてからselectに値を入れないと選択されない
    const controls = this.shopForm.controls;
    for (let key of Object.keys(res.shops[0])) {
      if (res.shops[0][key]) {
        controls[key].setValue(res.shops[0][key].toString());
      } else {
        controls[key].reset();
      }
    }
    if (this.prop.user.admin || this.prop.user.id === user && (!this.prop.report.id || this.prop.report.ack == null || Number(this.prop.report.ack) === -1)) {
      let where: any = { shop: this.prop.id };
      if (this.prop.report.id) where.id = { not: this.prop.report.id };
      const res = await this.api.get('query', { count: 'report', where: where });
      this.eraseable = res.count === 0 ? true : false;
    } else {
      this.eraseable = false;
    }
    setTimeout(() => {
      this.undoing = false;
      this.resetArea(res.shops[0].area);
    }, 1000);
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
              const ref = this.strage.ref(`shop/${id}/small.jpg`);
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
          const ref = this.strage.ref(`shop/${id}/medium.jpg`);
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
      res = await this.api.post('query', { table: "shop", update: this.shopForm.value, where: { id: id } });
    } else {//新規      
      let update = { simg: "", img: "" };
      res = await this.api.post('query', { table: "shop", insert: this.shopForm.value });
      id = res.shop.id;
      const imgurls = await putImg(id);
      if (imgurls) {
        update = { simg: imgurls[0], img: imgurls[1] };
        res.shop.simg = imgurls[0]; res.shop.img = imgurls[1];
      } else {
        const src = `${APIURL}img/noimage`;
        update = { simg: `${src}s.png`, img: `${src}.png` };
        res.shop.simg = `${src}s.png`; res.shop.img = `${src}.png`;
      }
      await this.api.post('query', { table: "shop", update: update, where: { id: id } });
    }
    this.modal.dismiss(res.shop);
  }
  async erase() {
    if (await this.ui.confirm(`削除確認`, `このショップを本当に削除しますか？`)) {
      this.modal.dismiss({ id: null });
      await this.api.post('query', { table: "shop", delete: { id: this.prop.id } });
      this.strage.ref(`shop/${this.prop.id}/small.jpg`).delete();
      this.strage.ref(`shop/${this.prop.id}/medium.jpg`).delete();
      const res = await this.api.get('query', { table: 'cast', select: ['id'], where: { shop: this.prop.id } });
      if (res.casts.length) {
        const casts = res.casts.map(cast => {
          this.strage.ref(`cast/${cast.id}/small.jpg`).delete();
          this.strage.ref(`cast/${cast.id}/medium.jpg`).delete();
          return cast.id;
        });
        this.api.post('query', { table: 'castimg', delete: { cast: casts } });
        this.api.post('query', { table: "cast", delete: { shop: this.prop.id } });
      }
    }
  }
}
