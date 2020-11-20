import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AlertController } from '@ionic/angular';
import { User } from '../../../class';
import { APIURL } from '../../../../environments/environment';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
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
  txts: Array<string> = [];
  medias: Array<string> = [];//メディアのhtml
  files: Array<string> = [];
  rows: Array<string> = [];//ダミー
  rests: Array<number> = [];
  restdates: Array<number> = [];
  setButtons: Array<boolean>;//段落設定ボタンの開閉
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
        editor.setContent(this.txts[idx]);
      });
      editor.on('blur', (e) => {
        let html = editor.getContent({ format: "html" });
        let idx = Number(e.target.id.replace("tiny", ""));
        if (this.txts[idx] !== html) {
          this.txts[idx] = html;
          if (this.user.id === this.document.user || this.user.admin)
            this.api.post("query", {
              table: 'story', insert: { typ: this.typ, parent: this.parent, id: idx, txt: html }, duplicate: ['txt']
            });
        }
      });
    }
  }
  constructor(private strage: AngularFireStorage, private ui: UiService, private api: ApiService, private alert: AlertController, ) { }
  ngOnInit() {
  }
  storyAdd() {
    this.txts.push('');
    this.medias.push('');
    this.files.push('');
    this.rows.push('');
    this.rests.push(null);
    this.restdates.push(null);
    this.setButtons.push(false);
  }
  async storyDel(idx) {
    let confirm: boolean = true;
    if (this.txts[idx] || this.medias[idx]) {
      confirm = await this.ui.confirm(`削除確認`, `第${idx + 1}段落を削除してよろしいですか。`);
    }
    if (confirm) {
      await this.mediaDel(idx);
      this.txts.splice(idx, 1);
      this.medias.splice(idx, 1);
      this.files.splice(idx, 1);
      this.rows.splice(idx, 1);
      this.rests.splice(idx, 1);
      this.restdates.splice(idx, 1);
      this.setButtons.splice(idx, 1);
      for (let i = idx; i < this.txts.length; i++) {
        tinymce.editors[i].setContent(this.txts[i]);
      }
      await this.api.post('query', { table: 'story', delete: { typ: this.typ, parent: this.parent, id: idx } });
      this.api.post('query', {
        table: 'story', update: { id: 'id' }, where: { id: idx, typ: this.typ, parent: this.parent },
        sign: { update: "-1", where: { id: ">" } }
      });
    }
  }
  storyUp(idx, mediaOnly) {
    let temp = this.storyUpDown(idx, idx - 1, mediaOnly);
    this.medias[idx] = this.medias[idx - 1];
    this.medias[idx - 1] = temp.media;
    this.files[idx] = this.files[idx - 1];
    this.files[idx - 1] = temp.file;
    if (!mediaOnly) {
      this.txts[idx] = this.txts[idx - 1];
      this.txts[idx - 1] = temp.txt;
      tinymce.editors[idx].setContent(this.txts[idx]);
      tinymce.editors[idx - 1].setContent(temp.txt);
    }
  }
  storyDown(idx, mediaOnly) {
    let temp = this.storyUpDown(idx, idx + 1, mediaOnly);
    this.medias[idx] = this.medias[idx + 1];
    this.medias[idx + 1] = temp.media;
    this.files[idx] = this.files[idx + 1];
    this.files[idx + 1] = temp.file;
    if (!mediaOnly) {
      this.txts[idx] = this.txts[idx + 1];
      this.txts[idx + 1] = temp.txt;
      tinymce.editors[idx].setContent(this.txts[idx]);
      tinymce.editors[idx + 1].setContent(temp.txt);
    }
  }
  storyUpDown(idx, idz, mediaOnly): any {
    const temp = { txt: this.txts[idx], media: this.medias[idx], file: this.files[idx] };
    let update1: any = { media: temp.media, file: temp.file };
    let update2: any = { media: this.medias[idz], file: this.files[idz] };
    if (!mediaOnly) {
      update1.txt = temp.txt;
      update2.txt = this.txts[idz];
    }
    this.api.post('query', { table: 'story', update: update1, where: { typ: this.typ, parent: this.parent, id: idz } });
    this.api.post('query', { table: 'story', update: update2, where: { typ: this.typ, parent: this.parent, id: idx } });
    return temp;
  }
  undo(parent) {
    this.txts = [];
    this.medias = [];
    this.files = [];
    this.rows = [];
    this.rests = [];
    this.restdates = [];
    this.setButtons = [];
    if (!parent) return;
    let where: any = { typ: this.typ, parent: this.parent };
    this.api.get('query', { table: 'story', select: ['id', 'txt', 'media', 'file', 'rest', 'restdate'], where: where }).then(res => {
      for (let story of res.storys) {
        if (story.rest && !(this.user.id === this.document.user || this.user.admin)) {
          this.txts.push('非公開記事');
          this.medias.push(null);
          this.files.push(null);
          this.rows.push('');
          this.rests.push(story.rest);
          this.restdates.push(story.restdate);
          this.setButtons.push(false);
        } else {
          this.txts.push(story.txt);
          this.medias.push(story.media);
          this.files.push(story.file);
          this.rows.push('');
          this.rests.push(story.rest);
          this.restdates.push(story.restdate);
          this.setButtons.push(false);
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
            this.rests[idx] = 1;
            this.restdates[idx] = data.restdate;
          } else {
            this.rests[idx] = null;
            this.restdates[idx] = null;
          }
          const update = { rest: this.rests[idx], restdate: this.restdates[idx] };
          this.api.post('query', { table: 'story', update: update, where: { typ: this.typ, parent: this.parent, id: idx } });
        }
      }
      ]
    });
    await alert.present();
  }
  mediaDel(idx): Promise<void> {
    return new Promise((resolve) => {
      if (!this.files[idx]) {
        resolve();
      } else {
        this.api.post('query', { table: 'story', update: { media: "", file: "" }, where: { typ: this.typ, parent: this.parent, id: idx } });
        this.strage.ref(`${this.typ}/${this.parent}/${this.files[idx]}`).delete().toPromise().catch(err => {
          this.ui.alert("ファイルの削除に失敗しました。\r\n" + err.message);
        }).finally(() => {
          resolve();
        });
        this.medias[idx] = "";
        this.files[idx] = "";
      }
    })
  }
  upload(e, idx) {
    const files = e.target.files;
    if (!files.length) return;
    let fileName = files[0].name;
    this.uploading = idx;
    const send = async (file) => {
      await this.mediaDel(idx);
      fileName = Math.floor(new Date().getTime() / 1000).toString() + "." + fileName.split('.').pop();//アップロードファイルの拡張子
      const ref = this.strage.ref(`${this.typ}/${this.parent}/${fileName}`);
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
          this.medias[idx] = html;//setValue(html);
          this.files[idx] = fileName;
          this.api.post("query", { table: 'story', insert: { typ: this.typ, parent: this.parent, id: idx, media: html, file: fileName }, duplicate: ['media', 'file'] });
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
