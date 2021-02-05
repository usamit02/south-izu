import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AlertController, ModalController } from '@ionic/angular';
import * as EXIF from 'exif-js'
import { User } from '../../../class';
import { Marker } from '../marker/marker.component'
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
  @Output() resetMarkers = new EventEmitter;
  @ViewChild('upmedia', { read: ElementRef, static: false }) upmedia: ElementRef;//メディアファイル選択
  storys: Story[] = [];
  markers: Marker[] = [];
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
            this.api.post("query", sql).then(res => {
              this.storys[idx] = { ...this.storys[idx], ...res.story };
            });
          }
        }
      });
    }
  }
  constructor(private storage: AngularFireStorage, private ui: UiService, private api: ApiService, private alert: AlertController,
    private modal: ModalController,) { }
  ngOnInit() {
  }
  storyAdd() {
    this.storys.push({ ...STORY });
  }
  async storyDel(idx) {
    let confirm: boolean = true;
    if (this.storys[idx].txt || this.storys[idx].media) {
      confirm = await this.ui.confirm(`削除確認`, `第${idx + 1}段落を削除してよろしいですか。`);
    }
    if (confirm) {
      this.ui.loading();
      await this.mediaDel(idx);
      const id = this.storys[idx].id;
      this.api.post('querys', {
        table: 'story', delete: { id: id }, updates: [{
          update: {}, where: { typ: this.typ, parent: this.parent, idx: idx }, sign: { update: { idx: "-1" }, where: { idx: ">" } }
        }]
      }).then(async res => {
        if (this.typ === 'report' || this.typ === 'plan') {
          const marker = await this.api.get('query', { table: 'story_marker', select: ['id','img'], where: { sid: id } });
          if (marker.story_markers.length) {
            if (marker.story_markers[0].img) this.storage.ref(`story_marker/${marker.story_markers[0].id}.jpg`).delete();
          }
          this.api.post('query', { table: 'story_marker', delete: { sid: id } });
        }
        this.storys.splice(idx, 1);
      }).finally(() => { this.ui.loadend() });
    }
  }
  storyUp(idx) {
    this.storyUpDown(idx, idx - 1).then(() => {
      let temp = { ...this.storys[idx] };
      this.storys[idx] = this.storys[idx - 1];
      this.storys[idx - 1] = temp;
    });
  }
  storyDown(idx: number) {
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
    if (parent && this.document.user != null) {
      let where: any = { typ: this.typ, parent: this.parent };
      this.api.get('query', { table: 'story', select: ['id', 'txt', 'media', 'file', 'latlng', 'rest', 'restdate'], where: where }).then(res => {
        this.storys = [];
        for (let story of res.storys) {
          if (story.rest && !(this.user.id === this.document.user || this.user.admin)) {
            this.storys.push({ ...story, txt: '非公開記事', media: null, file: null, lat: null, lng: null, button: false });
          } else {
            this.storys.push({ ...story, button: false });//txt:story.txt,media:story.media,file:story.file,lat:story.lat,lng:story.lng,rest:story.rest,restdate:story.restdate,button:false
          }
        }
        if (!res.storys.length) this.storyAdd();
      });
    } else {
      this.storys = [];
    }
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
      this.api.post('query', { table: 'story', update: { media: "", file: "", latlng: null }, where: { id: this.storys[idx].id } });
      this.storys[idx].media = ""; this.storys[idx].file = ""; this.storys[idx].lat = null; this.storys[idx].lng = null;
      if (!this.storys[idx].file) {
        resolve();
      } else {
        this.storage.ref(`${this.typ}/${this.parent}/${this.storys[idx].file}`).delete().toPromise().catch(err => {
          this.ui.alert("ファイルの削除に失敗しました。\r\n" + err.message);
        }).finally(() => {
          resolve();
        });
      }
    })
  }
  async setMarker(idx) {
    let marker = await this.modal.create({
      component: MarkerComponent,
      componentProps: { typ: this.typ, parent: this.parent, markers: this.markers, story: { ...this.storys[idx], idx: idx } }
    });
    marker.present();
    marker.onDidDismiss().then(event => {
      if (event.data) {
        this.markers = event.data.markers;
        this.resetMarkers.emit(this.markers);
      }
    });
  }
  async mediaUrl(idx) {
    let alart = await this.alert.create({
      header: 'youtubeやiframeのurlを入力',
      inputs: [{ name: 'txt', type: 'url', placeholder: `https://www.youtube.com/watch?v=Q9lN1MPHaPs` }],
      buttons: [{ text: '取消', role: 'cancel' }, {
        text: '決定', handler: (res) => {
          let txt = res.txt; let html;
          if (txt.indexOf("<iframe") > -1) {
            let urls = txt.match("<iframe[-_.!~*\'\"()a-zA-Z0-9;/?:@&=+$,%#> ]+</iframe>")
            if (urls && urls.length) {
              let widths: Array<string> = urls[0].match('width="[0-9]+"');
              let heights: Array<string> = urls[0].match('height="[0-9]+"');
              if (widths && heights && widths.length && heights.length) {
                let w = Number(widths[0].replace(/[^0-9]/g, ''));
                let h = Number(heights[0].replace(/[^0-9]/g, ''));
                const aspect = h / w;
                w = w < 640 ? w : 640;
                h = Math.floor(w * aspect);
                const padding = Math.floor((h / w) * 100);
                const iframe = urls[0].replace(widths[0], 'style="position:absolute;left:0;top:0;width:100%;height:100%;"').replace(heights[0], '');
                html = `<div style="position:relative;width:100%;height:0;padding-top:${padding}%;">${iframe}</div>`;
                for (let i = 0; i < urls.length; i++) {
                  let res: string = txt.replace(urls[i], "");
                  while (res !== txt) {
                    txt = txt.replace(urls[i], "");
                    res = txt.replace(urls[i], "");
                  }
                }
              } else {
                this.ui.alert("iframeのサイズを解析できませんでした。");
              }
            } else {
              this.ui.alert("iframeを解析できませんでした。"); return;
            }
          } else if (txt.indexOf("youtu.be") > 0 || txt.indexOf("youtube.com") > 0) {
            let id = txt.match('[\/?=]([a-zA-Z0-9\-_]{11})');
            if (id && id.length) {
              html = "<div style='position: relative;width:320px;'><a href='https://youtube.com/watch?v=" + id[1] +
                "' target='_blank'><img style='position:absolute;top:40px;left:100px;opacity:0.5;' src='" + APIURL + "img/play.png'/><img style='border-radius: 5px;' src='http://i.ytimg.com/vi/" + id[1] +
                "/mqdefault.jpg'/></a></div>";//sddefault.jpg
            } else {
              this.ui.alert("youtubeのurlを解析できませんでした。"); return;
            }
          } else {
            let urls = txt.match("https?://[-_.!~*\'()a-zA-Z0-9;/?:@&=+$,%#]+");
            if (urls && urls.length) {
              let url = urls[0];
              html = '<a href="' + url + '" target="_blank">' + url + '</a>';
              /*　課題　promise化が必要　linkcard.phpが不明なエラーを返す　981.jpなどで発生
              this.api.get('linkcard', { url: url }).then(res => {
                if (res.title || res.image) {
                  this.media.html = '<div style="border-style:groove; border-radius: 10px;"><div><a href="' + url + '" target="_blank"><img style="max-height:200px;"src="'
                    + res.image + '"></a></div><div><a href="' + url + '" target="_blank">' + res.title + '</a><p>' + res.description + '</p></div></div>';
                } else {
                  this.media.html = '<a href="' + url + '" target="_blank">' + url + '</a>';
                }
              });
              */
            }
          }
          if (html) {
            this.api.post('query', { table: 'story', update: { media: html, file: "", latlng: null }, where: { id: this.storys[idx].id } }).then(res => {
              if (this.storys[idx].file) {
                this.storage.ref(`${this.typ}/${this.parent}/${this.storys[idx].file}`).delete();
              }
              this.storys[idx].media = html; this.storys[idx].file = ""; this.storys[idx].lat = null; this.storys[idx].lng = null;
            });
          } else {
            this.ui.alert(`html文字列を解析できませんでした。`);
          }
        }
      }]
    });
    await alart.present();
  }
  upload(e, idx) {
    const files = e.target.files;
    if (!files.length) return;
    let fileName = files[0].name;
    this.uploading = idx;
    let latlng = ""; let lat; let lng;
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
            html = `<img src="${url}"/>`;
          } else if (file.type.match(/audio.*/)) {
            html = `<audio src="${url}" controls />`;
          } else if (file.type.match(/video.*/)) {
            html = `<video src="${url}" controls />`;
          } else {
            html = `<a href="${url}" download="${fileName}"><img src="${APIURL}img/download.jpg"/></a>`;
          }
          let sql: any = { table: 'story' };
          if (this.storys[idx].id) {
            sql.update = latlng ? { media: html, file: fileName, latlng: latlng } : { media: html, file: fileName };
            sql.where = { id: this.storys[idx].id };
          } else {
            sql.insert = { typ: this.typ, parent: this.parent, idx: idx, media: html, file: fileName };
            if (latlng) sql.insert = { ...sql.insert, latlng: latlng };
          }
          this.api.post("query", sql, "保存中").then(res => {
            this.storys[idx] = { ...this.storys[idx], ...res.story };
            if (latlng) this.storys[idx].lat = lat; this.storys[idx].lng = lng;
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
      if (this.typ === "report" || this.typ === "plan") {
        EXIF.getData(files[0], () => {
          let gpsLat = EXIF.getTag(files[0], "GPSLatitude");
          let gpsLng = EXIF.getTag(files[0], "GPSLongitude");
          if (gpsLat && gpsLng) {
            lat = gpsLat[0] + gpsLat[1] / 60 + gpsLat[2] / 3600;
            lng = gpsLng[0] + gpsLng[1] / 60 + gpsLng[2] / 3600;
            latlng = `POINT(${lng} ${lat})`;
          }
        })
      }
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
      if (files[0].size > 10000000) {
        this.ui.alert(`ファイルサイズは10MBまでにしてください。`);
      } else {
        send(files[0]);
      }
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
  idx?: number
}
const STORY = { id: null, txt: "", media: "", file: "", lat: null, lng: null, rest: null, restdate: null, button: false };