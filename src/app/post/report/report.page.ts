import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { PopoverController, ModalController, AlertController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { APIURL } from '../../../environments/environment';
import { User } from '../../class';
import { CropComponent } from '../component/crop/crop.component';
import { ListComponent } from '../component/list/list.component';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { UserService } from '../../service/user.service';
import { Marker } from '../component/marker/marker.component'
@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('map', { read: ElementRef, static: false }) map: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChildren('genreOptions', { read: ElementRef }) genreOptions: QueryList<ElementRef>;
  genres = [];
  selects = { regions: [], areas: [], genres: [] };
  undoing: boolean = false;
  genre = new FormControl("", [Validators.required]);
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(30), Validators.required]);
  description = new FormControl("", [Validators.minLength(2), Validators.maxLength(300)]);
  rest = new FormControl(0);
  chat = new FormControl(1);
  reportForm = this.builder.group({
    genre: this.genre, na: this.na, description: this.description, rest: this.rest, chat: this.chat
  });
  user: User;
  id: number;
  report: any = { id: null, user: null };
  reports = { drafts: [], requests: [], posts: [], acks: [] };
  imgBase64: string;
  markers: Marker[] = [];
  travelMode = "";
  currentY: number; scrollH: number; contentH: number; basicY: number; mapY: number; essayY: number; scoreY: number;
  private onDestroy$ = new Subject();
  constructor(private api: ApiService, private userService: UserService, private builder: FormBuilder, private storage: AngularFireStorage,
    private pop: PopoverController, private modal: ModalController, private alert: AlertController, private ui: UiService,
    private db: AngularFireDatabase, private route: ActivatedRoute, private router: Router, private store: AngularFirestore,
    private title: Title,) {
  }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
      this.user = user;
      if (user.id) {
        this.loadreport();
        if (user.admin) {
          const res = await this.api.get('query', { table: 'report', select: ['*'], where: { ack: 0 }, order: { created: "DESC", } });
          this.reports.posts = res.reports;
        }
      }
    });
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(async params => {
      if (params.id) {
        const res = await this.api.get('query', { table: 'report', select: ['*'], where: { id: params.id } });
        if (res.reports.length === 1) {
          this.undo(res.reports[0]);
        }
      }
    });
    this.api.get('query', { table: 'genre', select: ['id', 'na', 'travelmode'] }).then(res => {
      this.genres = res.genres; this.selects.genres = res.genres;
      this.genreOptions.changes.pipe(take(1)).toPromise().then(() => {
        this.genre.setValue(res.genres[0].id.toString());
        this.travelMode = this.genres[0].travelmode;
      });
    });
    setTimeout(() => {
      if (!this.user.id) {
        //this.router.navigate(['/login']);
      }
    }, 5000);
    this.title.setTitle(`レポート投稿`);
  }
  ngAfterViewInit() {
    this.onScrollEnd();
  }
  loadreport() {
    this.api.get('query', { table: 'report', select: ['*'], where: { user: this.user.id }, order: { created: "DESC", } }).then(res => {
      this.reports.drafts = res.reports.filter(report => { return report.ack == -1; });
      this.reports.requests = res.reports.filter(report => { return report.ack == 0; });
      this.reports.acks = res.reports.filter(report => { return report.ack == 1; });
    });
  }
  async popReports(reports, e) {
    const modal = await this.modal.create({
      component: ListComponent,
      componentProps: { prop: { reports: reports } },
      cssClass: 'report'
    });
    return await modal.present().then(() => {
      modal.onDidDismiss().then(event => {
        if (event.data) {
          this.undo(event.data);//this.castimg = event.data.castimg; this.shopimg = event.data.shopimg;          
        }
      });
    });;
  }
  async popCrop() {
    const popover = await this.pop.create({
      component: CropComponent,
      componentProps: { prop: { typ: 'card' } },
      translucent: true,
      cssClass: 'cropper'
    });
    return await popover.present().then(() => {
      popover.onDidDismiss().then(event => {
        if (event.data) this.imgBase64 = event.data;
      });
    });;
  }
  async add(table, na, placeholder, param: any = {}) {
    const alert = await this.alert.create({
      header: `新しい${na}を追加`,
      inputs: [{ name: table, type: 'text', placeholder: placeholder },],
      buttons: [{ text: 'Cancel', role: 'cancel', cssClass: 'secondary', },
      {
        text: 'Ok', handler: (data) => {
          if (data[table].length > 0 && data[table].length < 21) {
            param.na = data[table];
            this.api.post('query', { table: table, insert: param }).then(res => {
              this[table + "s"].push(res[table]);
              setTimeout(() => { this[table].setValue(res[table].id.toString()); }, 1000);
            })
          }
        }
      }]
    });
    await alert.present();
  }
  async newReport() {
    const alert = await this.alert.create({
      header: '新しいレポートを作成',
      message: '現在の内容を元にして新しいレポートを執筆しますか。<br>「いいえ」で現在の内容を破棄します。',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'いいえ',
          handler: () => {
            this.create({
              user: this.user.id, genre: this.genre.value,
            }, false);
          }
        }, {
          text: 'はい',
          handler: () => {
            this.create({ user: this.user.id, ...this.reportForm.value }, true);
          }
        }
      ]
    });
    await alert.present();
  }
  naBlur() {
    if (this.report.id || this.reportForm.invalid) return;
    this.create({ user: this.user.id, na: this.na.value });
  }
  create(insert, copy?: boolean) {
    this.api.post("query", { table: "report", insert: insert }).then(async res => {
      if (copy) {
        let doc = await this.api.get('query', { table: "story", select: ["*"], where: { typ: "report", parent: this.report.id } });
        let inserts = doc.storys.filter(story => { return !story.rested || this.report.user === this.user.id || this.user.admin });
        if (inserts.length) {
          inserts.map(story => {
            story.parent = res.report.id;
            return story;
          });
          await this.api.post('querys', { table: "story", inserts: inserts });
        }
      }
      this.undo(res.report);
    }).catch(() => {
      this.ui.alert(`新しいレポートの作成に失敗しました。`);
    });
  }
  async onScrollEnd() {
    const content = await this.content.nativeElement.getScrollElement();
    this.currentY = content.scrollTop;
    this.contentH = content.offsetHeight;
    this.scrollH = content.scrollHeight;
    this.basicY = this.basic.nativeElement.offsetTop;
    this.mapY = this.map.nativeElement.offsetTop;
    this.essayY = this.essay.nativeElement.offsetTop;
  }
  scroll(target) {
    this.content.nativeElement.scrollToPoint(0, target, 500);
  }
  resetMarkers(markers) {
    this.markers = markers;
  }
  genreChange() {
    const genres = this.genres.filter(genre => { return genre.id == this.genre.value; });
    if (genres.length) this.travelMode = genres[0].travelmode;
  }
  async undo(report) {
    this.undoing = true;
    if (this.user.id !== report.user) {
      const snapshot = await this.db.database.ref(`user/${report.user}`).once('value');
      const user = snapshot.val();
      report.author = { id: snapshot.key, na: user.na, avatar: user.avatar };
    }
    this.report = report;
    this.genres = this.selects.genres;//.filter(genre => { return genre.id === report.genre; });
    const controls = this.reportForm.controls
    for (let key of Object.keys(controls)) {
      if (report[key] == null) {
        controls[key].reset();
      } else {
        controls[key].reset(report[key].toString());
      }
    }
    setTimeout(() => { this.undoing = false; }, 1000);
  }
  async preview() {
    if (this.reportForm.invalid) return;
    if (this.user.id === this.report.user || this.user.admin) {
      await this.api.post('query', { table: 'report', update: this.reportForm.value, where: { id: this.report.id } });
    }
    this.router.navigate(['/report', this.report.id]);
  }
  async save(ack) {
    let update: any = { ...this.reportForm.value, ack: ack }; const msg = ['下書き保存', '投稿', '公開'];
    if (ack === 1) {
      update.acked = this.dateFormat();
      update.ackuser = this.user.id;
    }
    if (this.imgBase64) {
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
        return;
      }
      const ref = this.storage.ref(`report/${this.report.id}/image.jpg`);
      await ref.put(blob);
      update.image = await ref.getDownloadURL().toPromise();
    }
    this.api.post('query', { table: 'report', update: update, where: { id: this.report.id } }).then(() => {
      if (ack === 0) {
        this.db.database.ref(`post/report${this.report.id}`).set(
          {
            id: `report${this.report.id}`, na: this.na.value, upd: new Date().getTime(),
            url: `/post/report/${this.report.id}`, user: { id: this.user.id, na: this.user.na, avatar: this.user.avatar }
          }
        );
      } else {
        this.reports.posts = this.reports.posts.filter(report => { return report.id !== this.report.id; });
        this.db.database.ref(`post/report${this.report.id}`).remove();
      }
      if (ack === 1) {
        this.api.get(`query`, { table: 'story', select: ['id', 'txt', 'media', 'restdate', 'rested'], where: { typ: "report", parent: this.report.id } }).then(res => {
          const today = new Date(); let rested = new Date();
          for (let story of res.storys) {
            if (story.restdate && story.rested == null) {
              rested.setDate(today.getDate() + story.restdate);
              this.api.post('query', { table: 'story', update: { rested: rested }, where: { typ: "report", parent: this.report.id, id: story.id } });
            }
          }
          const description = res.storys.length ? res.storys[0].txt.match(/[^ -~｡-ﾟ]/).slice(0, 50) : "";
          this.db.list(`report/`).update(this.report.id.toString(),
            {
              na: this.na.value, uid: this.report.user, description: this.description.value, image: this.report.img, upd: new Date().getTime(),
            });
        });
      }
      this.loadreport();
      this.report.ack = ack;
      //this.undo({ id: this.report.id, user: this.user.id, ...update });
      this.ui.pop(`${msg[ack + 1]}しました。`);
    }).catch(err => {
      this.ui.alert(`${msg[ack + 1]}できませんでした。\r\n${err.message}`);
    });
  }
  async eraseClick() {
    if (this.report.id && await this.ui.confirm("削除確認", "レポートを削除します。")) this.erase([this.report.id]);
  }
  async erase(ids: Array<number>) {
    for (let id of ids) {
      this.api.get('query', { table: 'story', select: ['file'], where: { typ: 'report', parent: id } }).then(async res => {
        for (let story of res.storys) {
          if (story.file) this.storage.ref(`report/${id}/${story.file}`).delete();
        }
        const mres = await this.api.get('query', { table: 'story_marker', select: ['img'], where: { typ: 'report', parent: id } });
        for (let marker of mres.story_markers) {
          if (marker.img) this.storage.ref(`story_marker/${marker.id}.jpg`).delete();
        }
        await this.api.post('querys', {
          deletes: [
            { id: id, user: this.user.id, table: "report" },
            { typ: "report", parent: id, table: "story" },
            { typ: "report", parent: id, table: "story_marker" }
          ]
        });
        //await this.api.post('query', { table: 'report', delete: { id: id } });
        //await this.api.post('query', { table: 'story', delete: { typ: 'report', parent: id } });
        await this.db.list(`report/${id}`).remove();
        await this.db.database.ref(`post/report${id}`).remove();
        await this.store.collection('report').doc(id.toString()).delete();
        if (this.report.img) this.storage.ref(`report/${id}/image.jpg`).delete();
        this.reports.drafts = this.reports.drafts.filter(report => { return report.id !== id; });
        this.reports.requests = this.reports.requests.filter(report => { return report.id !== id; });
        this.reports.posts = this.reports.posts.filter(report => { return report.id !== id; });
        this.reports.acks = this.reports.acks.filter(report => { return report.id !== id; });
      }).catch(err => {
        this.ui.alert(`レポートを削除できませんでした。\r\n${err.message}`);
        return false;
      });
    }
    this.ui.pop("レポートを削除しました。");
    this.loadreport();
    this.undo({ id: null, user: this.user.id, region: 1, area: 1, genre: 1, shop_na: "選択してください", cast_na: "選択してください", shopimg: "", castimg: "" });
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
  dummyClick() {
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
