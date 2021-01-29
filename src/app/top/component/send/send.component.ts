import { Component, OnInit, Input, ViewChild, ElementRef, OnDestroy, OnChanges, AfterViewInit } from '@angular/core';
import { PopoverController, IonContent } from '@ionic/angular';
import * as firebase from 'firebase';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { Mention } from '../class';
import { ApiService } from '../../../service/api.service';
import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { takeUntil, throttleTime,debounceTime } from 'rxjs/operators';
import { UiService } from '../../../service/ui.service';
import { SendService } from './send.service';
import { EmojiComponent } from './emoji/emoji.component';
import { Router } from '@angular/router';
import { APIURL } from '../../../../environments/environment';
@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss'],
})
export class SendComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() user;
  @Input() users;//everyone mention用
  @Input() id: string;
  @Input() page: string;
  @Input() thread: string;
  @Input() content: IonContent;
  @ViewChild('talk', { read: ElementRef, static: false }) talk: ElementRef;//チャット投稿欄
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;//画像ファイル変換用
  writer: string;
  message: string;
  mediaButton = { add: false, img: false, url: false };
  addcolor: string = "medium";
  media = new Media;
  uploadPercent: Observable<number>;
  sendable: boolean = true;
  head: boolean = true;
  enterkey: boolean = false;//投稿をenterキーで行うかどうか
  mentions = [];
  private onDestroy$ = new Subject();
  constructor(private db: AngularFirestore, private api: ApiService, private storage: AngularFireStorage,
    private ui: UiService, private pop: PopoverController, private router: Router, private sendService: SendService, ) { }
  ngOnInit() {
    this.sendService.emoji.asObservable().pipe(takeUntil(this.onDestroy$)).subscribe((emoji: string) => {
      this.talk.nativeElement.insertAdjacentHTML('beforeend', emoji);
      this.sendable = true;
    });
    this.sendService.mentionWrite.asObservable().pipe(takeUntil(this.onDestroy$)).subscribe((user: any) => {
      this.mentions.push(user);
    });
  }
  ngOnChanges() { }
  ngAfterViewInit() {
    this.enterkey = localStorage.getItem('enterkey') === "true" ? true : false;
    const keyup$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(this.talk.nativeElement, "keyup");
    const keydown$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(this.talk.nativeElement, "keydown");
    const paste$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(this.talk.nativeElement, "paste");
    const change$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(this.talk.nativeElement, "change");
    merge(paste$,change$).pipe(takeUntil(this.onDestroy$), throttleTime(2000)).subscribe(() => {
      this.sendable = true;
    });
    keydown$.pipe(takeUntil(this.onDestroy$)).subscribe(e => {
      if (e.key === "Enter") {
        if (!(e.ctrlKey || e.shiftKey || e.altKey) && this.enterkey) {
          this.send();
        } else {
          document.execCommand('insertHTML', false, '\n');
        }
      }
    });
    keyup$.pipe(takeUntil(this.onDestroy$), debounceTime(2000)).subscribe(() => {
      console.log('keyup:' + this.talk.nativeElement.innerText);
      
    });
  }
  deleteMention(member) {
    this.mentions = this.mentions.filter(mention => { return mention.id !== member.id; });
  }
  async send() {
    this.sendable = false;
    const upd = new Date();
    if (this.media.file) {
      const uploadMedia = (limit: number, beforeUrl: string, afterUrl: string) => {
        if (this.media.file.size > limit) {
          this.ui.alert(`ファイルサイズは${limit / 1000000}MBまでにしてください。`);
          this.unfile();
        } else {
          this.ui.loading("アップロードしています。", limit / 10);
          let ext = this.media.file.name.split('.').pop();//アップロードファイルの拡張子
          let ref = this.storage.ref(`${this.page}/${this.id}/${Math.floor(upd.getTime() / 1000)}.${ext}`);
          ref.put(this.media.file).then(snapshot => {
            ref.getDownloadURL().toPromise().then(url => {
              this.chatAdd(upd, beforeUrl + url + afterUrl, ext);
            });
          }).catch(err => {
            this.ui.alert("ファイルアップロードに失敗しました。\r\n" + err.message);
          }).finally(() => { this.ui.loadend(); });
        }
      }
      if (this.media.file.type.match(/image.*/)) {
        this.ui.pop("アップロードしています・・・");
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
        const imagePut = (org?: boolean) => {
          return new Promise(resolve => {
            let canvas: HTMLCanvasElement = this.canvas.nativeElement;
            let ctx = canvas.getContext('2d');
            const folder = org ? "org/" : "";
            const fileName = `${folder}${Math.floor(upd.getTime() / 1000)}.jpg`;
            let image = new Image();
            let reader = new FileReader();
            reader.onload = () => {
              image.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const px = org ? 1000 : 280;
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
                  const ref = this.storage.ref(`${this.page}/${this.id}/${fileName}`);
                  await ref.put(blob);
                  const url = await ref.getDownloadURL().toPromise();
                  return resolve(url);
                }, "image/jpeg")
              }
              image.src = <string>reader.result;
            }
            reader.readAsDataURL(this.media.file);
          });
        }
        const orgUrl = await imagePut(true);
        const imgUrl = await imagePut(false);
        this.chatAdd(upd, `<a href="${orgUrl}" target="_blank"><img style="border-radius: 5px;" src="${imgUrl}"/></a>`, "jpg");
      } else if (this.media.file.type.match(/video.*/)) {
        uploadMedia(50000000, "<video style='border-radius: 5px;max-width:320px;max-height:240px;' src='", "' controls>");
      } else if (this.media.file.type.match(/audio.*/)) {
        uploadMedia(10000000, "<audio src='", "' controls>");
      } else {
        uploadMedia(5000000, "<a href='", "' download='" + Math.floor(upd.getTime() / 1000) + "." + this.media.file.name.split('.').pop()
          + "' target='_blank'><img src='" + APIURL + "img/download.jpg'></a>");
      }
    } else {
      this.chatAdd(upd);
    }
  }
  chatAdd(upd, media?, ext?) {
    let txt: string = this.talk.nativeElement.textContent;
    let html = this.talk.nativeElement.innerHTML;
    console.log("text:" + txt);
    console.log("html:" + html);
    if (txt.indexOf("<iframe") > -1) {
      let urls = txt.match("<iframe[-_.!~*\'\"()a-zA-Z0-9;/?:@&=+$,%#> ]+</iframe>")
      if (urls && urls.length) {
        let widths: Array<string> = urls[0].match('width="[0-9]+"');
        let heights: Array<string> = urls[0].match('height="[0-9]+"');
        if (widths && heights && widths.length && heights.length) {
          let w = Number(widths[0].replace(/[^0-9]/g, ''));
          let h = Number(heights[0].replace(/[^0-9]/g, ''));
          let aspect = h / w;
          w = w < 320 ? w : 320;
          h = Math.floor(w * aspect);
          let iframe = urls[0].replace(widths[0], 'width="' + w + '"').replace(heights[0], 'height="' + h + '"');
          this.media.html = iframe;
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
        this.media.html = "<div style='position: relative;width:320px;'><a href='https://youtube.com/watch?v=" + id[1] +
          "' target='_blank'><img style='position:absolute;top:40px;left:100px;opacity:0.5;' src='" + APIURL + "img/play.png'/><img style='border-radius: 5px;' src='http://i.ytimg.com/vi/" + id[1] +
          "/mqdefault.jpg'/></a></div>";
      } else {
        this.ui.alert("youtubeのurlを解析できませんでした。"); return;
      }
    } else {
      let urls = txt.match("https?://[-_.!~*\'()a-zA-Z0-9;/?:@&=+$,%#]+");
      if (urls && urls.length) {
        let url = urls[0];
        this.media.html = '<a href="' + url + '" target="_blank">' + url + '</a>';
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
    let urls = txt.match("https?://[-_.!~*\'()a-zA-Z0-9;/?:@&=+$,%#]+");
    if (urls && urls.length) {
      for (let i = 0; i < urls.length; i++) {
        let res: string = txt.replace(urls[i], "");
        while (res !== txt) {
          txt = txt.replace(urls[i], "");
          res = txt.replace(urls[i], "");
        }
      }
    }
    let dbcon;
    if (!txt && this.media.isnull()) return;
    let uid = this.user.id, na = this.user.na;
    dbcon = this.db.collection(this.page).doc(this.id);
    if (this.thread) {
      dbcon = dbcon.collection("chat").doc(this.thread);
    }
    let add: any = { uid: uid, na: na, avatar: this.user.avatar, txt: txt, upd: upd };
    if (media) {
      add.media = media;
      add.ext = ext;
    } else if (this.media) {
      add.media = this.media.html;
    }
    if (this.mentions.length) {
      add.mentions = this.mentions.map(mention => { return { id: mention.id }; });
      add.media = add.media ? add.media + "<div>" : "<div>";
      for (let mention of this.mentions) {
        add.media += `<a href="/user/${mention.id}">@${mention.na}</a> `;
      }
      add.media += "</div>";
    }
    dbcon.collection('chat').add(add).then(ref => {
      if (this.thread) {//スレ元チャットの返信数+1
        this.db.doc(`${this.page}/${this.id}/chat/${this.thread}`).set({ thread: firebase.default.firestore.FieldValue.increment(1) }, { merge: true });
      }
      let promises = [];//メンションの処理
      const extention = txt.length > 50 ? "..." : "";
      const description = txt.substring(0, 50) + extention;
      const pushMention = (i) => {
        return new Promise((resolve, reject) => {
          this.db.collection('user').doc(this.mentions[i].id).collection('unmention').add(mention).catch(() => { resolve(true); });
        });
      }
      const thread = this.thread ? `/${this.thread}` : "";
      const url = `/${this.page}${thread}/${this.id}/${Math.floor(upd.getTime() / 1000)}`;
      let mention: Mention = {
        id: this.user.id, na: this.user.na, upd: upd, avatar: this.user.avatar, description: description, url: url,
        page: this.page, pid: Number(this.id), thread: this.thread ?this.thread:"",
      };
      for (let i = 0; i < this.mentions.length; i++) {
        promises.push(pushMention(i));
      }
      Promise.all(promises).catch(err => {
        this.ui.alert("メンション書込みに失敗しました。\r\n" + err.message);
      });
      this.mentions = [];
      this.talk.nativeElement.textContent = "";
      setTimeout(() => {
        this.content.scrollToBottom(300);
      }, 300);
    }).catch(err => {
      alert("チャット書込みに失敗しました。\r\n" + err);
    }).finally(() => {
      this.unfile();
    });
  }
  fileup(e) {
    this.media.file = e.target.files[0];
    this.sendable = true;
    this.addcolor = "success";
  }
  unfile() {
    this.mediaButton.add = false;
    this.media = new Media;
    this.addcolor = "medium";
  }
  async popEmoji() {
    const popover = await this.pop.create({
      component: EmojiComponent,
      componentProps: {},
      event: event,
      translucent: true,
      cssClass: 'emoji'
    });
    return await popover.present();
  }
  urlClick(e) {
    let url = e.target.value;
    if (url.startsWith("<iframe") && url.endsWith("</iframe>")) {
      this.media.html = url;
      this.addcolor = "secondary";
      this.sendable = true;
    } else if (url.indexOf("youtu.be") > 0 || url.indexOf("youtube.com") > 0) {
      let id = url.match('[\/?=]([a-zA-Z0-9\-_]{11})');
      if (id && id.length) {
        this.media.html = "<div style='position: relative;'><a href='https://youtube.com/watch?v=" + id[1] +
          "' target='_blank'><img style='position:absolute;top:40px;left:200px;opacity:0.5;' src='" + APIURL + "img/play.png'/><img style='border-radius: 5px;' src='http://i.ytimg.com/vi/" + id[1] +
          "/mqdefault.jpg'/></a></div>";
        this.addcolor = "google";
        this.sendable = true;
      } else {
        this.ui.alert("youtubeのurlを解析できませんでした。");
      }
    } else {
      let match = url.match("https?://[-_.!~*\'()a-zA-Z0-9;/?:@&=+$,%#]+");
      if (match !== null) {
        this.sendable = false;
        this.api.get('linkcard', { url: url }).then(res => {
          if (res.title || res.image) {
            this.media.html = '<div style="border-style:groove; border-radius: 10px;"><div><a href="' + url + '" target="_blank"><img style="max-height:200px;"src="'
              + res.image + '"></a></div><div><a href="' + url + '" target="_blank">' + res.title + '</a><p>' + res.description + '</p></div></div>';
          } else {
            this.media.html = '<a href="' + url + '" target="_blank">' + url + '</a>';
          }
          this.addcolor = "primary";
          this.sendable = true;
        });
      } else {
        this.ui.pop("urlを認識できません。");
      }
    }
  }
  dateFormat(date = new Date()) {//MySQL用日付文字列作成'yyyy-M-d H:m:s'
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var h = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();
    return y + "-" + m + "-" + d + " " + h + ":" + min + ":" + sec;
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
class Media {
  public file: File = null;
  public html: string = "";
  public card: any = null;
  isnull(): boolean {
    if (this.file || this.html || this.card) {
      return false;
    } else {
      return true;
    }
  }
}