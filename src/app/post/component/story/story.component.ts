import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AlertController,ModalController } from '@ionic/angular';
import * as EXIF from 'exif-js'
import { User,Marker } from '../../../class';
import { APIURL } from '../../../../environments/environment';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { MarkerComponent } from '../marker/marker.component';
declare var tinymce;
@Component({
  selector: 'app-story',
  templateUrl: './story.component.html',
  styleUrls: ['./story.component.scss'],
})
export class StoryComponent implements OnInit {
  @Input() typ: string;
  @Input() user: User;
  private _parent: number;
  private _document: any;
  @Input()
  set document(_document: any) {
    this._document = _document;
    this._parent = _document.id;
    this.undo(_document.id);
  }
  get document() {
    return this._document;
  }
  get parent() {
    return this._parent;
  }
  @ViewChild('upmedia', { read: ElementRef, static: false }) upmedia: ElementRef;//メディアファイル選択
  storys: Story[] = [];
  markers:Marker[]=[];
  progress;//メディアファイルのアップロード経過
  uploading: number;//アップロード中の段落番号(idx)  
  tinyinit = {
    menubar: false,
    //theme: 'inlite',
    //language_url: 'https://bloggersguild.cf/js/ja.js',
    plugins: [
      'autolink autosave codesample link lists advlist table paste emoticons quickbars'
    ],
    toolbar: false,//'undo redo | forecolor backcolor | fontselect fontsizeselect styleselect | bullist numlist | blockquote link copy paste emoticons',
    quickbars_insert_toolbar: 'emoticons quicktable',
    quickbars_selection_toolbar: 'forecolor backcolor styleselect | bullist numlist | blockquote quicklink copy paste',
    contextmenu: 'emoticons | undo redo | up down del | paystart payend ',
    forced_root_block: false, allow_conditional_comments: true, allow_html_in_named_anchor: true, allow_unsafe_link_target: true,
    setup: (editor) => {
      editor.ui.registry.addMenuItem('del', { //editor.addButton(contextmenu以外のmenu)
        text: '段落を削除',
        onAction: (e) => {
          let idx = Number(e.target.id.replace("tiny", ""));
          this.storyDel(idx);
        }
      });
      editor.on('init', (e) => {
        let idx = Number(e.target.id.replace("tiny", ""));
        editor.setContent(this.storys[idx].txt);
      });
      editor.on('blur', (e) => {
        let html = editor.getContent({ format: "html" });
        let idx = Number(e.target.id.replace("tiny", ""));
        if (this.storys[idx].txt !== html) {
          this.storys[idx].txt = html;
          if (this.user.id === this.document.user || this.user.admin) {
            let sql: any = { table: 'story' };
            if (this.storys[idx].id) {
              sql.update = { txt: html };
              sql.where = { id: this.storys[idx].id };
            } else {
              sql.insert = { typ: this.typ, parent: this.parent, idx: idx, txt: html };
            }
            this.api.post("query", sql).then(res=>{
              this.storys[idx]={...this.storys[idx],...res.story};
            });
          }
        }
      });
    }
  }
  constructor(private storage: AngularFireStorage, private ui: UiService, private api: ApiService, private alert: AlertController,
    private modal:ModalController,) { }
  ngOnInit() {
  }
  storyAdd() {
    this.storys.push(STORY);
  }
  async storyDel(idx) {
    let confirm: boolean = true;
    if (this.storys[idx].txt || this.storys[idx].media) {
      confirm = await this.ui.confirm(`削除確認`, `第${idx + 1}段落を削除してよろしいですか。`);
    }
    if (confirm) {
      this.ui.loading();
      await this.mediaDel(idx);      
      this.api.post('querys', { table: 'story', delete: { id: this.storys[idx].id }, updates: [{
          update: {}, where: { typ: this.typ, parent: this.parent,idx:idx }, sign: { update:{idx: "-1"}, where: { idx: ">" } }
        }]
      }).then(res=>{
        this.storys.splice(idx, 1);
      }).finally(()=>{this.ui.loadend()});      
    }
  }
  storyUp(idx) {
    this.storyUpDown(idx, idx - 1).then(() => {
      let temp = { ...this.storys[idx] };
      this.storys[idx] = this.storys[idx - 1];
      this.storys[idx - 1] = temp;
    });
  }
  storyDown(idx:number) {
    this.storyUpDown(idx, idx + 1).then(() => {
      let temp = { ...this.storys[idx] };
      this.storys[idx] = this.storys[idx + 1];
      this.storys[idx + 1] = temp;
    });
  }
  storyUpDown(idx, idz): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.post('querys', {
        table: 'story', updates: [
          { update: { idx: idz }, where: { id: this.storys[idx].id } },
          { update: { idx: idx }, where: { id: this.storys[idz].id } }
        ]
      }, "並べ替えています").then(res => {
        resolve();
      }).catch(err => {
        this.ui.alert(`並べ替えに失敗しました。`);
        reject();
      });
    });
  }
  undo(parent) {
    this.storys = [];
    if (!parent) return;
    let where: any = { typ: this.typ, parent: this.parent };
    this.api.get('query', { table: 'story', select: ['id', 'txt', 'media', 'file', 'latlng', 'rest', 'restdate'], where: where }).then(res => {
      for (let story of res.storys) {
        if (story.rest && !(this.user.id === this.document.user || this.user.admin)) {
          this.storys.push({ ...story, txt: '非公開記事', media: null, file: null, lat: null, lng: null, button: false });
        } else {
          this.storys.push({ ...story, button: false });//txt:story.txt,media:story.media,file:story.file,lat:story.lat,lng:story.lng,rest:story.rest,restdate:story.restdate,button:false
        }
      }
      if (!res.storys.length) this.storyAdd();
    });
  }
  dropMedia(e, idx) {
    let a = e;
  }
  async storyRest(idx) {
    const alert = await this.alert.create({
      header: '公開制限', message: 'サポーター以外は指定した日数待たないと閲覧できないようにします。',
      inputs: [{ name: 'restdate', type: 'number', min: 0, max: 100000 },],
      buttons: [{ text: 'Cancel', role: 'cancel', cssClass: 'secondary', },
      {
        text: 'Ok', handler: (data) => {
          if (Number(data.restdate)) {
            this.storys[idx].rest = 1;
            this.storys[idx].restdate = data.restdate;
          } else {
            this.storys[idx].rest = null;
            this.storys[idx].restdate = null;
          }
          const update = { rest: this.storys[idx].rest, restdate: this.storys[idx].restdate };
          this.api.post('query', { table: 'story', update: update, where: { id: this.storys[idx].id } });
        }
      }
      ]
    });
    await alert.present();
  }
  mediaDel(idx): Promise<void> {
    return new Promise((resolve) => {
      if (!this.storys[idx].file) {
        resolve();
      } else {
        this.api.post('query', { table: 'story', update: { media: "", file: "" }, where: { id: this.storys[idx].id } });
        this.storage.ref(`${this.typ}/${this.parent}/${this.storys[idx].file}`).delete().toPromise().catch(err => {
          this.ui.alert("ファイルの削除に失敗しました。\r\n" + err.message);
        }).finally(() => {
          resolve();
        });
        this.storys[idx].media = "";
        this.storys[idx].file = "";
      }
    })
  }
  async setMarker(idx) {
    let lat=this.storys[idx].lat?this.storys[idx].lat:34.68503331;
    let lng=this.storys[idx].lng?this.storys[idx].lng:138.85154339;
    let marker = await this.modal.create({
      component: MarkerComponent,
      componentProps: { typ:this.typ,parent:this.parent,lat:lat,lng:lng,markers:this.markers,story:this.storys[idx] }
    });
    marker.present();
    marker.onDidDismiss().then(event => {
      if (event.data) {
        this.markers=event.data.markers;
      }
    });
  }
  upload(e, idx) {
    const files = e.target.files;
    if (!files.length) return;
    let fileName = files[0].name;
    this.uploading = idx;
    let latlng = "";
    const send = async (file) => {
      await this.mediaDel(idx);
      fileName = Math.floor(new Date().getTime() / 1000).toString() + "." + fileName.split('.').pop();//アップロードファイルの拡張子
      const ref = this.storage.ref(`${this.typ}/${this.parent}/${fileName}`);
      const uploadTask = ref.put(file);
      uploadTask.percentageChanges().subscribe(progress => {
        this.progress = progress / 100;
      });
      uploadTask.then(snapshot => {
        ref.getDownloadURL().toPromise().then(url => {
          let html: string;
          if (file.type.match(/image.*/)) {
            html = `<img src="${url}">`;
          } else if (file.type.match(/audio.*/)) {
            html = `<audio src="${url}" controls>`;
          } else if (file.type.match(/video.*/)) {
            html = `<video src="${url}" controls>`;
          } else {
            html = `<a href="${url}" download="${fileName}"><img src="${APIURL}img/download.jpg"></a>`;
          }
          let sql: any = { table: 'story' };
          if (this.storys[idx].id) {
            sql.update = latlng ? { media: html, file: fileName, latlng: latlng } : { media: html, file: fileName };
            sql.where = { id: this.storys[idx].id };
          } else {
            sql.insert = { typ: this.typ, parent: this.parent, idx: idx, media: html, file: fileName };
            if (latlng) sql.insert = { ...sql.insert, latlng: latlng };
          }
          this.api.post("query", sql,"保存中").then(res=>{
            this.storys[idx]={...this.storys[idx],...res.story};
          });
        })
      }).catch(err => {
        this.ui.alert("ファイルアップロードに失敗しました。\r\n" + err.toString());
      }).finally(() => {
        this.progress = 0; this.uploading = null;
      });
    }
    if (files[0].type.match(/image.*/)) {
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
      EXIF.getData(files[0], () => {
        let gpsLat = EXIF.getTag(files[0], "GPSLatitude");
        let gpsLng = EXIF.getTag(files[0], "GPSLongitude");
        if (gpsLat && gpsLng) {
          const lat = gpsLat[0] + gpsLat[1] / 60 + gpsLat[2] / 3600;
          const lng = gpsLng[0] + gpsLng[1] / 60 + gpsLng[2] / 3600;
          console.log(`lat:${lat} lng:${lng}`);
          latlng = `POINT(${lng} ${lat})`;
        }
      })
      var canvas = document.querySelector('canvas');
      var ctx = canvas.getContext('2d');
      var img = new Image();
      var reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          let w, h;
          if (img.width > img.height) {
            w = img.width > 640 ? 640 : img.width;//横長
            h = img.height * (w / img.width);
          } else {
            h = img.height > 480 ? 480 : img.height;//縦長
            w = img.width * (h / img.height);
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.width = w; canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(send, 'image/jpeg');
        }
        img.src = <string>reader.result;
      }
      reader.readAsDataURL(files[0]);
    } else {
      send(files[0]);
    }
  }
}
export interface Story {
  id: number;
  txt: string;
  media: string;
  file: string;
  lat: number;
  lng: number;
  rest: number;
  restdate: number;
  button: boolean;
}
const STORY = { id: null, txt: "", media: "", file: "", lat: null, lng: null, rest: null, restdate: null, button: false };