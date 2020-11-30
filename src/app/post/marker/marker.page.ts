import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PopoverController, ModalController, AlertController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as firebase from 'firebase';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { User, Marker ,MARKER} from '../../class';
import { Store } from './../../service/store.service';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { ListComponent } from '../component/list/list.component';
@Component({
  selector: 'app-marker',
  templateUrl: './marker.page.html',
  styleUrls: ['./marker.page.scss'],
})
export class MarkerPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  id = new FormControl(0, [Validators.required]); 
  latlng = new FormControl("", [Validators.required]);
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]);
  txt = new FormControl("", [Validators.minLength(2), Validators.maxLength(500), Validators.required]);
  phone = new FormControl("", [Validators.pattern(/^(([0-9]{2,4}-[0-9]{2,4}-[0-9]{3,4}))$/)]);
  url = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  img = new FormControl("");
  simg = new FormControl("");
  icon = new FormControl(0, [Validators.required]);
 
  rest = new FormControl(0);
  chat = new FormControl(1);
  markerForm = this.builder.group({
    id: this.id, latlng:this.latlng,na: this.na, txt: this.txt, phone: this.phone, url: this.url, 
    img: this.img, simg: this.simg,icon:this.icon,
  });
  user: User;
  author: any = { id: "", na: "", avatar: "" };
  marker:Marker=MARKER; 
  markers = { drafts: [], requests: [], posts: [], acks: [] };
  allMarkers=[];
  place: string = "";
  undoing;
  imgBase64: string;
  currentY: number; scrollH: number; contentH: number; basicY: number; essayY: number;
  private onDestroy$ = new Subject();
  constructor(private api: ApiService, private userService: UserService, private builder: FormBuilder, private strage: AngularFireStorage,
    private pop: PopoverController, private modal: ModalController, private alert: AlertController, private ui: UiService,
    private db: AngularFireDatabase, private router: Router, private route: ActivatedRoute, private store: Store,
    private storedb: AngularFirestore, private title: Title, ) { }
  async ngOnInit() {
    const res = await this.api.get('query', {
      table: 'marker', select: ['id', 'na', 'txt', 'user', 'ack', 'idx', 'img','simg', 'phone','url', 'created', 'rest', 'chat'],
      order: { ack: "DESC", idx: "", id: "" }
    });
    this.allMarkers = res.markers;
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      if (user.id) {
        this.loadMarkers();
        if (user.admin) {
          this.api.get('query', { table: 'marker', select: ['*'], where: { ack: 0 }, order: { created: "DESC", } }).then(res => {
            this.markers.posts = res.markers;
          });
        }
      } else {
        //this.router.navigate(['/login']);
      }
    });
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(async params => {
      if (params.id) {
        const res = await this.api.get('query', { table: 'marker', select: ['*'], where: { id: params.id } });
        if (res.markers.length === 1) {
          this.undo(res.markers[0]);
        }
      }
    });
    this.title.setTitle(`マーカー記事投稿`);
  }
  loadMarkers() {
    let markers = this.allMarkers.filter(marker => { return marker.user === this.user.id });
    markers.sort((a, b) => {
      if (a.id < b.id) {
        return 1;
      } else {
        return -1;
      }
    });
    this.markers.drafts = markers.filter(marker => { return marker.ack === -1; });
    this.markers.requests = markers.filter(marker => { return marker.ack === 0; });
    this.markers.acks = markers.filter(marker => { return marker.ack === 1; });
  }  
  async popMarkers(markers, e) {
    const modal = await this.modal.create({
      component: ListComponent,
      componentProps: { prop: { markers: markers } },
      cssClass: 'report'
    });
    return await modal.present().then(() => {
      modal.onDidDismiss().then(event => {
        if (event.data) {
          this.router.navigate([`/post/marker`, event.data.id]);//this.undo(event.data);          
        }
      });
    });;
  }  
  async undo(marker) {
    this.undoing = true;
    if (this.user.id !== marker.user) {
      const snapshot = await this.db.database.ref(`user/${marker.user}`).once('value');
      const user = snapshot.val();
      marker.author = { id: snapshot.key, na: user.na, avatar: user.avatar };
    }
    this.marker = marker;
    const controls = this.markerForm.controls
    for (let key of Object.keys(controls)) {
      if (marker[key] == null) {
        controls[key].reset();
      } else {
        if (key === 'chat' || key === 'rest') {
          controls[key].reset(marker[key]);
        } else {
          controls[key].reset(marker[key].toString());
        }
      }
    }
    setTimeout(() => { this.undoing = false; }, 1000);
  }  
  async preview() {
    if (this.user.id === this.marker.user || this.user.admin) {
      await this.api.post('query', { table: 'marker', update: this.markerForm.value, where: { id: this.marker.id } });
    }
    this.router.navigate(['/tabs/tab3', this.marker.id]);
  }
  async save(ack) {
    let update: any = { ...this.markerForm.value, ack: ack }; const msg = ['下書き保存', '投稿', '公開'];
    update.chat = update.chat ? 1 : 0; update.rest = update.rest ? 1 : 0;
    const upd=new Date();
    if (ack === 1) {
      update.acked = this.dateFormat(upd);
      update.ackuser = this.user.id;
    }
    if (this.imgBase64) {
      /*let bin = atob(this.imgBase64.replace(/^.*,/, ''));
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
      const ref = this.strage.ref(`column/${this.column.id}/image.jpg`);
      await ref.put(blob);
      update.image = await ref.getDownloadURL().toPromise();*/
    }
    this.api.post('query', { table: 'marker', update: update, where: { id: this.marker.id } }).then(() => {
      if (ack === 0) {
        this.db.database.ref(`post/marker${this.marker.id}`).set(
          {
            id: `marker${this.marker.id}`, na: `${this.na.value}`, upd: upd.getTime(),
            url: `/post/marker/${this.marker.id}`, user: { id: this.user.id, na: this.user.na, avatar: this.user.avatar }
          }
        );
      } else {
        this.markers.posts = this.markers.posts.filter(marker => { return marker.id !== this.marker.id; });
        this.db.database.ref(`post/marker${this.marker.id}`).remove();
      }
      if (ack === 1) {
        this.db.list(`marker/`).update(this.marker.id.toString(),
          { na: update.na, uid: this.marker.user, description: update.txt, image: update.img ? update.img : null, upd: upd.getTime(), });
      }
      const newMarker = {
        id: this.marker.id, na: this.na.value, user: this.user.id, ack: ack, rest: this.rest.value, chat: this.chat.value,
        txt: this.txt.value, img: update.img ? update.img : null, simg: update.simg ? update.simg : null,created: this.marker.created,
      }
      let markers = this.allMarkers.filter(marker => { return marker.id === this.marker.id; });
      if (markers.length) {
        markers[0] = newMarker;
      } else {
        this.allMarkers.push(newMarker);
      }
      this.loadMarkers();
      this.undo({ id: this.marker.id, user: this.user.id, ...update });
      this.ui.pop(`${msg[ack + 1]}しました。`);
    }).catch(err => {
      this.ui.alert(`${msg[ack + 1]}できませんでした。\r\n${err.message}`);
    });
  }
  async erase() {
    const confirm = await this.ui.confirm("削除確認", `マーカー「${this.marker.na}」を削除します。`);
    if (!confirm || !this.marker.id) return;
    this.api.get('query', { table: 'story', select: ['file'], where: { typ: 'marker', parent: this.marker.id } }).then(async res => {
      for (let story of res.storys) {
        if (story.file) this.strage.ref(`marker/${this.marker.id}/${story.file}`).delete();
      }
      await this.api.post('query', { table: 'marker', delete: { id: this.marker.id, user: this.user.id } });
      await this.api.post('query', { table: 'story', delete: { typ: 'marker', parent: this.marker.id } });
      await this.db.list(`marker/${this.marker.id}`).remove();
      await this.db.database.ref(`post/marker${this.marker.id}`).remove();
      await this.storedb.collection('marker').doc(this.marker.id.toString()).delete();
      this.ui.pop("マーカーを削除しました。");
      this.markers.drafts = this.markers.drafts.filter(marker => { return marker.id !== this.marker.id; });
      this.markers.requests = this.markers.requests.filter(marker => { return marker.id !== this.marker.id; });
      this.markers.posts = this.markers.posts.filter(marker => { return marker.id !== this.marker.id; });
      this.markers.acks = this.markers.acks.filter(marker => { return marker.id !== this.marker.id; });
      this.allMarkers = this.allMarkers.filter(marker => { return marker.id !== this.marker.id; });
      this.undo(MARKER);
    }).catch(err => {
      this.ui.alert(`マーカーを削除できませんでした。\r\n${err.message}`);
    });;
  }
  async onScrollEnd() {
    const content = await this.content.nativeElement.getScrollElement();
    this.currentY = content.scrollTop;
    this.contentH = content.offsetHeight;
    this.scrollH = content.scrollHeight;
    this.basicY = this.basic.nativeElement.offsetTop;
    this.essayY = this.essay.nativeElement.offsetTop;
  }
  scroll(target) {
    this.content.nativeElement.scrollToPoint(0, target, 500);
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
