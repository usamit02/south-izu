import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ViewChildren, QueryList, ElementRef, OnChanges, OnDestroy } from '@angular/core';
import { IonInfiniteScroll, ActionSheetController, PopoverController, IonContent } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { Subscription, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { UiService } from '../../../service/ui.service';
import { Mention, Direct } from '../class';
import { ReactComponent } from './react/react.component';
import { UserComponent } from '../user/user.component';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnChanges, OnDestroy {
  @Input() set params(_params) {
    this.id = _params.id.toString();
    this.cursor = _params.cursor ? new Date(Number(_params.cursor) * 1000) : null;
    this.thread = _params.thread ? _params.thread : "";
    this.topInfinite = _params.topInfinite ? _params.topInfinite : false;
  }
  @Input() page;
  @Input() user;
  @Input() content: IonContent;
  @Output() orgThread = new EventEmitter<any>();
  @ViewChild('top', { static: false }) top: IonInfiniteScroll; @ViewChild('btm', { static: false }) btm: IonInfiniteScroll;
  @ViewChildren('chatItems', { read: ElementRef }) chatItems: QueryList<ElementRef>;
  @ViewChild('chatY', { read: ElementRef, static: false }) chatY: ElementRef;//チャット始点のY座標取得のため
  @ViewChildren('chatDivs', { read: ElementRef }) chatDivs: QueryList<ElementRef>;
  id: string = "";
  thread: string = "";
  dest: any;//ダイレクトの宛先
  chats: Array<any> = [];//チャットデータ [0]=古い、[length-1]=最新 <div id="chatX"
  loading: boolean = false;//読み込み時の自動スクロールにion-infinate-scrollが反応するのを止める。
  dbcon: AngularFirestoreDocument<{}>;//firestore接続バッファ　ダイレクト(direct)と部屋(room)で使い分け
  topMsg: string = "";
  topInfinite: boolean = false;//page=columnのとき、true=上部無限スクロールを有効にする false=ドロップアップボタンにする
  readed: boolean;
  newMsg: number = 0;
  newChat: number = 0;
  loadUpd: Date;//最初にチャットロードした時間
  newUpds = [];//新着メッセージ
  latest: boolean;//最新表示
  Y: number = 0;//現在のスクロール位置
  H: number = 0;//現在の画面高さ
  cursor: Date = null;//chat読込の基準日付
  limit: number = 15;//1回あたりchat読込数
  nomore: boolean = false;//読み込むチャットがない
  mentions: Array<Mention> = [];//この部屋のメンション
  mentionTops: Array<Mention> = []; mentionBtms: Array<Mention> = [];
  directs: Array<Direct> = [];//この部屋の未読ダイレクト 
  private onDestroy$ = new Subject();
  newchatSb: Subscription; chatSb: Subscription;
  constructor(private actionSheetCtrl: ActionSheetController, private route: ActivatedRoute, private router: Router, private readonly db: AngularFirestore
    , private storage: AngularFireStorage, private ui: UiService, private pop: PopoverController, ) { }
  ngOnInit() {
    this.content.ionScrollEnd.pipe(takeUntil(this.onDestroy$)).subscribe(e => {
      this.onScrollEnd();
    });
  }
  ngOnChanges() {
    if (this.user) this.init();
  }
  init() {
    this.dbcon = this.db.collection(this.page).doc(this.id);
    this.dbcon = this.thread ? this.dbcon.collection('chat').doc(this.thread) : this.dbcon;
    this.user.cursor = null;
    if (this.user.id) {
      this.dbcon.collection('cursor').doc(this.user.id).get().toPromise().then(doc => {
        this.user.cursor = doc.data().csd.toDate();
        this.chatInit(this.user.cursor);
      }).catch(() => {
        this.chatInit();
      });
      if (this.page === 'direct') {
        this.topInfinite = true;
        this.db.collection('user').doc(this.user.id).collection('undirect', ref => ref.where('pid', '==', this.id)).snapshotChanges().pipe(takeUntil(this.onDestroy$)).subscribe(snapshot => {
          this.directs = [];
          snapshot.forEach(doc => {
            const direct: any = { doc: doc.payload.doc.id, ...doc.payload.doc.data() };
            this.directs.push(direct);
          });
        });
      } else {
        this.db.collection('user').doc(this.user.id).collection('unmention', ref => ref.where('page', '==', this.page)
          .where('pid', '==', Number(this.id)).where('thread', '==', this.thread)).snapshotChanges().pipe(takeUntil(this.onDestroy$)).subscribe(snapshot => {
            this.mentions = [];
            snapshot.forEach(doc => {
              const mention: any = { doc: doc.payload.doc.id, ...doc.payload.doc.data() };
              this.mentions.push(mention);
            });
          });
      }
    } else {
      this.chatInit();
    }
  }
  chatInit(cursor?) {
    this.chats = []; this.Y = 0; this.readed = false; this.newUpds = []; this.loadUpd = new Date(); this.nomore = false;
    cursor = this.cursor ? this.cursor : cursor;//urlのcursorを優先
    this.chatLoad(false, "btm", cursor); //this.chatLoad(false, this.data.room.csd || this.cursor ? "btm" : "top", this.cursor);
    if (this.newchatSb) this.newchatSb.unsubscribe();
    this.newchatSb = this.dbcon.collection('chat', ref => ref.where('upd', '>', this.loadUpd))
      .stateChanges(['added']).pipe(takeUntil(this.onDestroy$)).subscribe(action => {//チャットロード以降の書き込み 
        let chat = action[0].payload.doc.data();
        this.dbcon.collection('chat', ref => ref.where('upd', "<", chat.upd).orderBy('upd', 'desc').limit(1)).get().toPromise().then(query => {//書き込み直前のチャットを取得
          if (query.docs.length) {//初回書き込みでない
            if (query.docs[0].data().upd.toDate().getTime() === this.chats[this.chats.length - 1].upd.toDate().getTime()) {//読込済最新チャットの次の投稿
              this.chatDivs.changes.pipe(take(1)).toPromise().then(t => {//this.chats.push(chat)の結果が描写後に発火
                let chatDiv: HTMLDivElement = this.chatDivs.toArray()[this.chats.length - 1].nativeElement;
                if (this.Y + this.H > chatDiv.offsetTop) {
                  setTimeout(() => { this.content.scrollToBottom(300); });
                } else {//画面上に最近のチャットが表示されていない
                  this.newUpds.push(chat.upd.toDate());//新着メッセージを追加
                }
              });
              this.chats.push(chat);//チャットが連続していれば書き込みを足す
              this.chatChange();
            } else {//読込済最新チャットの次のチャットはない                
              this.newUpds.push(chat.upd.toDate());//新着メッセージを追加                
            }
          } else {//初回書き込み
            this.chats.push(chat);
            this.topMsg = "";
          }
        });
      });
    setTimeout(() => {
      this.onScrollEnd();
    }, 3000);
  }
  chatLoad(e, direction, cursor?: Date) {
    if (!e) {
      this.loading = true;
    } else if (this.loading) {
      e.target.complete();
      return;//読込時の自動スクロールにion-infinate-scrollが反応するのを止める。
    }
    let docs = []; let docs1 = []; let docs2 = []; let db; this.topMsg = "";
    if (!cursor) {
      if (this.chats.length) {
        cursor = direction === 'top' ? this.chats[0].upd.toDate() : this.chats[this.chats.length - 1].upd.toDate();
      } else {//初回読込
        cursor = this.loadUpd;
      }
    }
    if (direction === 'top') {
      db = this.dbcon.collection('chat', ref => ref.where('upd', "<", cursor).orderBy('upd', 'desc').limit(this.limit));//並び替えた後limitされるのでascはダメ
    } else {
      db = this.dbcon.collection('chat', ref => ref.where('upd', ">", cursor).where('upd', '<', this.loadUpd).orderBy('upd', 'asc').limit(this.limit));
    }
    let uid: string = JSON.stringify(this.user.id);//自動ログイン時重複読込対策
    const docsPush = (query) => {//firestoreの返り値を配列へ、同時に既読位置を記録
      let docs = [];
      let cursor = this.cursor ? this.cursor.getTime() : null;
      let csd = new Date(this.user.cursor).getTime()
      cursor = cursor === csd ? null : cursor;
      query.forEach(doc => {
        let d: any = doc.data();
        d.id = doc.id;
        let upd = Math.floor(d.upd.toDate().getTime() / 1000) * 1000;
        if (upd === cursor) {
          d.cursor = true;
        } else if (upd <= csd && !this.readed) {
          d.readed = true;
          this.readed = true;
        }
        docs.push(d);
      });
      return docs;
    }
    const docsRead1 = () => {
      return new Promise((resolve, reject) => {
        db.get().toPromise().then(query => {
          docs1 = docsPush(query);
          let limit: number = direction === 'btm' && !this.chats.length && docs1.length < this.limit ? this.limit - docs1.length : 0;
          db = limit ? this.dbcon.collection('chat', ref => ref.where('upd', "<=", cursor).orderBy('upd', 'desc').limit(limit)) : null;
          resolve();
        }).catch((err) => {
          reject(err);
        });
      });
    }
    const docsRead2 = () => {
      return new Promise((resolve, reject) => {
        if (db) {
          db.get().toPromise().then(query => {
            docs2 = docsPush(query);
            docs = docs2.reverse().concat(docs1);
            resolve();
          }).catch((err) => {
            reject(err);
          });
        } else {
          docs = docs1;
          resolve();
        }
      });
    }
    const scrollFin = () => {//無限スクロールを有効にする
      setTimeout(() => { this.loading = false; }, 1000)
    }
    const threadRead = () => {
      if (this.thread) {
        this.db.doc(`${this.page}/${this.id}/chat/${this.thread}`).get().toPromise().then(doc => {
          let d: any = doc.data();
          d.id = doc.id;
          this.orgThread.emit(d);
          this.chats.unshift(d);
        }).catch(err => {
          this.ui.pop("スレッド元の読込に失敗しました。\r\n" + err.message);
        });
      }
    }
    Promise.resolve().then(docsRead1).then(docsRead2).then(() => {
      if (JSON.parse(uid) !== this.user.id) return;//自動ログイン時重複読込対策  
      if (e) {//infinatescrollからの場合、スピナーを止める
        e.target.complete();
        if (!docs.length) e.target.disabled = true;//読み込むchatがなかったら以降infinatescroll無効
      } else if (!docs.length) {
        this.nomore = true;
      }
      if (this.chats.length || docs.length) {
        if (this.chats.length || ((this.page === 'report' || this.page === 'column') && !this.cursor)) {
          scrollFin();
        } else {//新規読込で全面チャットページの場合はスクロール
          this.chatDivs.changes.pipe(take(1)).toPromise().then(() => {//チャット再描写後発火
            if (direction === "top" || !docs1.length) {
              setTimeout(() => { this.content.scrollToBottom().then(() => { scrollFin(); }); }); //this.data.scroll("btm");
            } else {
              if (docs2.length) {
                let chatDivs = this.chatDivs.toArray();
                let cursorTop: number = 0; let cursorHeight: number = 0;
                for (let i = 0; i < chatDivs.length; i++) {
                  if (this.chats[i].upd.toDate().getTime() >= cursor.getTime()) {
                    cursorTop = chatDivs[i].nativeElement.offsetTop; cursorHeight = chatDivs[i].nativeElement.offsetHeight; break;
                  }
                }
                this.content.getScrollElement().then(element => {
                  if (chatDivs[0].nativeElement.offsetTop + chatDivs[0].nativeElement.offsetHeight - cursorTop > element.scrollHeight) {
                    setTimeout(() => { this.content.scrollToTop().then(() => { scrollFin(); }); });
                  } else {
                    setTimeout(() => { this.content.scrollToBottom().then(() => { scrollFin(); }); });//this.content.getScrollElement().then(content => {content.scrollTop = content.scrollHeight;});
                  }
                });
              } else {
                this.content.scrollByPoint(0, 20, 300).then(() => { scrollFin(); });
              }
            }
          });
        }
        if (direction === 'top') {
          if (docs1.length < this.limit) {
            if (e) { this.top.disabled = true; };
            this.nomore = true;
            threadRead();
          }
          this.chats.unshift(...docs1.reverse());
        } else {
          this.chats.push(...docs);
          if (docs.length < this.limit) {//これ以降のchatがなければinfinityscroll　bottomを廃止する
            threadRead();
            this.btm.disabled = true;
            if (this.top && this.chats.length < this.limit) this.top.disabled = true;
          } else if (cursor === this.loadUpd) {
            this.btm.disabled = true;
          } else {
            this.dbcon.collection(`chat`, ref => ref.orderBy('upd').limitToLast(1)).get().toPromise().then(query => {
              if (query.docs.length && query.docs[0].data().upd.toDate().getTime() === this.chats[this.chats.length - 1].upd.toDate().getTime()) {
                this.btm.disabled = true;
              } else {
                this.btm.disabled = false;
              }
            });
          }
        }
        this.chatChange();
      } else {//読み込むchatがない
        if (this.page === 'direct') {
          this.topMsg = "最初のメッセージを送ろう";
        } else if (!this.thread) {
          this.topMsg = "コメント一番乗りだ！";
        }
        threadRead();
        if (this.top) this.top.disabled = true; this.btm.disabled = true;
      }
    }).catch((err) => {
      this.ui.alert("チャットデーターベースの読込に失敗しました。\r\n" + err.message);
    });
  }
  chatChange() {
    if (this.chatSb) this.chatSb.unsubscribe();
    this.chatSb = this.dbcon.collection('chat', ref => ref.where('upd', '>=', this.chats[0].upd).
      where('upd', '<=', this.chats[this.chats.length - 1].upd)).stateChanges(['modified']).pipe(takeUntil(this.onDestroy$)).
      subscribe(action => {//チャットロード以降の変更 
        let chat = action[0].payload.doc.data();
        for (let i = 0; i < this.chats.length; i++) {
          if (this.chats[i].upd.toDate().getTime() === chat.upd.toDate().getTime()) {
            this.chats[i] = chat;
            break;
          }
        }
      });
  }
  onScrollEnd() {
    this.content.getScrollElement().then(content => {
      this.Y = content.scrollTop - this.chatY.nativeElement.offsetTop;//console.log("H:" + content.scrollHeight + " Top:" + content.scrollTop);
      this.H = content.offsetHeight;
      this.latest = content.scrollHeight - this.Y - this.H > 300 ? true : false;
      if (this.Y + this.H > 0) {
        let upds = this.currentUpds();
        if (this.user.id) {//未ログインのときはカーソル位置、メンション、未読ダイレクトのチェックをしない。
          if (upds.length) {
            this.deleteNotice(upds);
            let upd = upds[upds.length - 1];//画面上見えてる最新の日付
            if (!this.user.cursor || this.user.cursor.getTime() < upd.getTime()) {
              this.user.cursor = upd;
              this.dbcon.collection('cursor').doc(this.user.id).set({ csd: upd }).catch(err => {
                this.ui.alert(`カーソルの書込みに失敗しました。\r\n${err.message}`);
              });
            }
          }
        }
      }
    });
  }
  deleteNotice(upds) {
    let upd0 = upds[0].getTime(); let upd9 = upds[upds.length - 1].getTime();
    this.newUpds = this.newUpds.filter(upd => upd.getTime() < upd0 || upd9 < upd.getTime());//新着メッセージ
    if (this.directs.length) {
      let deleteDirects = this.directs.filter(direct => {
        const upd = direct.upd.toDate().getTime();
        return upd0 <= upd && upd <= upd9;// console.log(upd0 + "<=" + upd + "<=" + upd9);        
      });
      for (let i = 0; i < deleteDirects.length; i++) {
        this.db.collection('user').doc(this.user.id).collection('undirect').doc(deleteDirects[i].doc).delete();
      }
    }
    if (this.mentions.length) {
      let deleteMentions = this.mentions.filter(mention => {
        const upd = mention.upd.toDate().getTime();
        return upd0 <= upd && upd <= upd9;// console.log(upd0 + "<=" + upd + "<=" + upd9);        
      });
      for (let i = 0; i < deleteMentions.length; i++) {
        this.db.collection('user').doc(this.user.id).collection('unmention').doc(deleteMentions[i].doc).delete();
      }
      this.mentionTops = this.mentions.filter(mention => { return mention.upd.toDate().getTime() < upd0 && this.thread === mention.thread; });
      this.mentionBtms = this.mentions.filter(mention => { return mention.upd.toDate().getTime() > upd9 && this.thread === mention.thread; });
    } else {
      this.mentionTops = []; this.mentionBtms = [];
    }
  }
  currentUpds() {
    let upds = [];//見えてるチャットの日付の集合
    this.chatItems.forEach((chat, i, chats) => {
      if (chat.nativeElement.offsetTop >= this.Y && chat.nativeElement.offsetTop + chat.nativeElement.offsetHeight < this.Y + this.H) {
        upds.push(this.chats[i].upd.toDate());
      }
    });
    return upds;
  }
  noticeClick(type) {//チャット内fabボタンをクリックしたとき
    let upd = this.chats[this.chats.length - 1].upd.toDate();//new Date(chats[chats.length - 1].children[0].innerHTML);
    if (type === "mention") {
      let currentUpds = this.currentUpds();
      let loadedMentions = this.mentionBtms.filter(mention =>
        mention.upd.toDate().getTime() <= upd.getTime() && mention.upd.toDate().getTime() > currentUpds[currentUpds.length - 1].getTime());
      if (loadedMentions && loadedMentions.length) {
        let scrollTo: number = this.Y;
        let mentionUpd = loadedMentions[0].upd.toDate().getTime();
        for (let i = 0; i < this.chats.length; i++) {
          if (this.chats[i].upd.toDate().getTime() === mentionUpd) {
            let chat = this.chatDivs.toArray()[i];//chats = this.chatItems.find((item, index, array) => { return index === i; });
            scrollTo = chat.nativeElement.offsetTop; break;
          }
        }
        this.content.scrollToPoint(0, scrollTo, 300);
      } else {
        let mentions = this.mentionBtms.filter(mention => mention.upd.toDate().getTime() > upd.getTime());
        this.chats = [];
        this.chatLoad(false, "btm", mentions[mentions.length - 1].upd);
      }
    } else if (type === "newMsg") {
      if (this.newUpds[0].getTime() <= upd.getTime()) {
        this.content.scrollToBottom(300);
      } else {
        this.chats = [];
        this.chatLoad(false, "btm", this.newUpds[0]);
      }
    } else if (type === "latest") {
      this.dbcon.collection('chat', ref => ref.orderBy('upd', 'desc').limit(1)).get().toPromise().then(query => {
        let doc = query.docs[0].data();
        let csd = doc.upd.toDate();
        if (this.chats[this.chats.length - 1].upd.toDate().getTime() >= csd.getTime()) {//最新のchatを読込済なら
          this.content.scrollToBottom(300);
        } else {
          this.user.cursor = null;
          this.cursor = null;
          this.chatInit();//カーソルをクリアして最新をリロード
        }
      });
    }
  }
  evaluation(idx, val: string) {
    const upd = Math.floor(this.chats[idx].upd.toDate().getTime() / 1000);
    const url = this.thread ? `thread/${this.id}/${this.thread}/${upd}` : `${this.id}/${upd}`;
    const thread = this.thread ? `chat/${this.thread}/` : "";
    const path = `${this.page}/${this.id}/${thread}chat/${this.chats[idx].id}`;
    this.dbcon.collection(`chat/${this.chats[idx].id}/eval`).doc(this.user.id)
      .set({ id: val, uid: this.chats[idx].uid, na: this.chats[idx].na, path: path, url: `chat/${this.page}/${url}`, upd: new Date() }).catch(err => {
        this.ui.alert(`評価を書込みできませんでした。\r\n${err.message}`);
      });
  }
  async chatMore(e, uid, na, idx) {
    let buttons: Array<any> = [];
    if (this.user.id) {
      buttons = [
        { text: 'いいね！', icon: 'thumbs-up', handler: () => { this.evaluation(idx, 'good'); } },
        { text: 'ダメだし', icon: 'thumbs-down', handler: () => { this.evaluation(idx, 'bad') } },
        { text: 'リアクション', icon: 'happy', handler: () => { this.emoji(e, idx); } },
        { text: '通報', icon: 'alert', handler: () => { this.tip(na, idx) } }];
      if (this.page !== "direct" && !this.thread) {
        buttons.push({ text: '返信', icon: 'text', handler: () => { this.goThread(idx) } });
      }
    }
    if (uid === this.user.id || this.user.admin) {
      buttons.push({ text: '編集', icon: 'brush', handler: () => { this.edit(idx); } });
      buttons.push({ text: '削除', icon: 'trash', handler: () => { this.delete(idx); } });
    }
    buttons.push({ text: 'urlをコピー', icon: 'copy', handler: () => { this.copy(idx) } });
    //buttons.push({ text: '戻る', icon: 'exit', role: 'cancel' })
    const actionSheet = await this.actionSheetCtrl.create({ header: na, buttons: buttons });
    await actionSheet.present();
  }
  async emoji(e, idx) {
    let chats = this.chats.filter(chat => { return chat.emoji });
    for (let i = 0; i < chats.length; i++) {
      chats[i].emoji = false;
    }
    let chat = this.chats[idx];
    chat.emoji = true;
    const popover = await this.pop.create({
      component: ReactComponent,
      componentProps: {},
      //event: e,
      translucent: true,
      cssClass: 'emoji'
    });
    return await popover.present().then(() => {
      popover.onDidDismiss().then(e => {
        this.dbcon.collection('chat', ref => ref.where('upd', "==", chat.upd)).get().toPromise().then(query => {
          if (query.docs.length) {
            let doc = query.docs[0].data();
            let id: string
            if (doc.react) {
              id = Object.keys(doc.react).length.toString();
            } else {
              id = "0";
              doc.react = {};
            }
            doc.react[id] = { upd: new Date(), emoji: e.data, na: this.user.na };
            this.dbcon.collection('chat').doc(query.docs[0].id).update({ react: doc.react });
            chat.emoji = false;
          } else {
            alert('リアクション(' + chat.upd + ')に失敗しました。');
          }
        });
      });
    });
  }
  goThread(idx) {
    this.router.navigate([`chat/thread/${this.page}/${this.id}`, this.chats[idx].id]);
  }
  tip(na, idx) {//通報
    let chat = this.chats[idx];
    let tip = { uid: chat.uid, na: chat.na, txt: chat.txt, upd: chat.upd.toDate(), tiper: this.user.na, url: this.getUrl(idx) };
    this.db.collection('tip').add(tip).then(() => {
      this.ui.pop(na + "による問題がある投稿を役員に通報しました。");
    });
  }
  copy(idx) {
    if (execCopy(this.getUrl(idx))) {
      this.ui.pop("クリップボードに投稿urlをコピーしました。");
    } else {
      this.ui.alert("クリップボードが使用できません。");
    }
    function execCopy(string) {
      var tmp = document.createElement("div");
      var pre = document.createElement('pre');
      pre.style.webkitUserSelect = 'auto';
      pre.style.userSelect = 'auto';
      tmp.appendChild(pre).textContent = string;
      var s = tmp.style;
      s.position = 'fixed';
      s.right = '200%';
      document.body.appendChild(tmp);
      document.getSelection().selectAllChildren(tmp);
      var result = document.execCommand("copy");
      document.body.removeChild(tmp);
      return result;
    }
  }
  getUrl(idx): string {
    let url = `https;//${location.host}/chat/`
    const cursor = `${Math.floor(this.chats[idx].upd.toDate().getTime() / 1000)}`;
    url += this.thread ? `thread/${this.page}/${this.id}/${this.thread}/${cursor}` : `${this.page}/${this.id}/${cursor}`;
    return url;
  }
  edit(idx) {
    let txt = this.chatDivs.toArray()[idx].nativeElement.getElementsByClassName('chattxt')[0];//<HTMLDivElement>document.getElementById("chat" + idx);
    txt.classList.add("talk");
    txt.contentEditable = 'true';
    this.chats[idx].edit = true;
  }
  editSend(idx) {
    let div = this.chatDivs.toArray()[idx].nativeElement.getElementsByClassName('chattxt')[0];
    let chat = this.chats[idx];
    this.dbcon.collection('chat', ref => ref.where('upd', "==", chat.upd)).get().toPromise().then(query => {
      if (query.docs.length) {
        let txt = div.textContent;
        this.dbcon.collection('chat').doc(query.docs[0].id).update({
          rev: new Date(),
          txt: txt
        });
        div.classList.remove("talk");
        div.contentEditable = false;
        chat.edit = false;
      } else {
        throw new Error("編集対象のレコードが見つかりません。");
      }
    }).catch(err => {
      this.ui.alert('編集に失敗しました。\r\n' + err.message);
    });
  }
  delete(idx) {
    let upd = this.chats[idx].upd;
    this.dbcon.collection('chat', ref => ref.where('upd', "==", upd)).get().toPromise().then(query => {
      if (query.docs.length) {
        let doc = query.docs[0].data();
        if (doc.ext) {//添付ファイルの削除
          this.storage.ref(`${this.page}/${this.id}/${Math.floor(upd.toDate().getTime() / 1000)}.${doc.ext}`).delete();
          if (doc.ext === "jpg") this.storage.ref(`${this.page}/${this.id}/org/${Math.floor(upd.toDate().getTime() / 1000)}.jpg`).delete();
        }
        if (doc.mentions) {//相手に送ったメンションが未読で残っていれば削除
          for (let i = 0; i < doc.mentions.length; i++) {
            let db = this.db.collection('user').doc(doc.mentions[i].id);
            db.collection('mention', ref => ref.where('csd', "==", upd)).get().toPromise().then(query => {
              if (query.docs.length) {
                db.collection('mention').doc(query.docs[0].id).delete();
              };
            });
          }
        }
        this.dbcon.collection('chat').doc(query.docs[0].id).delete();
        this.chats = this.chats.filter(chat => chat.upd.toDate().getTime() !== upd.toDate().getTime());
      } else {
        throw new Error("削除対象のchatが見つかりません。");
      }
    }).catch(err => {
      this.ui.alert('投稿の削除に失敗しました。\r\n' + err.message);
    });
  }
  async popUser(event, uid) {
    const popover = await this.pop.create({
      component: UserComponent,
      componentProps: { id: uid, self: this.user },
      //event: event,
      translucent: true,
      cssClass: 'user'
    });
    return await popover.present();
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}