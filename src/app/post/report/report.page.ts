import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { PopoverController, ModalController, AlertController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../component/list/list.component';
import { ShopComponent } from '../component/shop/shop.component';
import { CastComponent } from '../component/cast/cast.component';
import { StoryComponent } from '../component/story/story.component';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { APIURL } from '../../../environments/environment';
import { User } from '../../class';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { UserService } from '../../service/user.service';
@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('detail', { read: ElementRef, static: false }) detail: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('score', { read: ElementRef, static: false }) score: ElementRef;
  @ViewChildren('regionOptions', { read: ElementRef }) regionOptions: QueryList<ElementRef>;
  @ViewChildren('areaOptions', { read: ElementRef }) areaOptions: QueryList<ElementRef>;
  @ViewChildren('genreOptions', { read: ElementRef }) genreOptions: QueryList<ElementRef>;
  regions = [];
  areas = [];//[{ id: 0, na: "" }];
  genres = [];//[{ id: 0, na: "" }];
  selects = { regions: [], areas: [], genres: [] };
  shoping = "選択してください"; casting = "選択してください";
  shopimg: string; castimg: string;
  undoing: boolean = false;
  region = new FormControl("", [Validators.required]);
  area = new FormControl("", [Validators.required]);
  genre = new FormControl("", [Validators.required]);
  shop = new FormControl("", [Validators.required]);
  cast = new FormControl("", [Validators.required]);
  time = new FormControl(null, [Validators.min(0), Validators.max(360)]);
  price = new FormControl(null, [Validators.min(0), Validators.max(300000)]);
  played = new FormControl(null, [Validators.required]);
  age = new FormControl(null, [Validators.min(0), Validators.max(80)]);
  height = new FormControl(null, [Validators.min(100), Validators.max(200)]);
  weight = new FormControl(null, [Validators.min(30), Validators.max(100)]);
  skin = new FormControl(null);
  tits = new FormControl(null);
  tabacco = new FormControl(null);
  tattoo = new FormControl(null);
  commu = new FormControl(null);
  style = new FormControl(null, [Validators.min(0), Validators.max(100)]);
  looks = new FormControl(null, [Validators.min(0), Validators.max(100)]);
  hosp = new FormControl(null, [Validators.min(0), Validators.max(100)]);
  total = new FormControl(null, [Validators.min(0), Validators.max(100)]);
  reportForm = this.builder.group({
    region: this.region, area: this.area, genre: this.genre, shop: this.shop, cast: this.cast, time: this.time, price: this.price, played: this.played,
    age: this.age, height: this.height, weight: this.weight, skin: this.skin, tits: this.tits, tabacco: this.tabacco, tattoo: this.tattoo, commu: this.commu,
    style: this.style, looks: this.looks, hosp: this.hosp, total: this.total,
  });
  titsVals = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
  skinVals = ['', '純白', '白', '普通', '褐色', '黒ギャル'];
  tabaccoVals = ['', '非喫煙', '吸わない', '断って', '吸う', 'ヘビー'];
  tattooVals = ['', '墨なし', '小1', '大1', '半身', '全身'];
  commuVals = ['', '日英×', '英語', '挨拶', '片言', '流暢'];
  user: User;
  id: number;
  report: any = { id: null, user: null };
  reports = { drafts: [], requests: [], posts: [], acks: [] };
  currentY: number; scrollH: number; contentH: number; basicY: number; detailY: number; essayY: number; scoreY: number;
  private onDestroy$ = new Subject();
  constructor(private api: ApiService, private userService: UserService, private builder: FormBuilder, private strage: AngularFireStorage,
    private pop: PopoverController, private modal: ModalController, private alert: AlertController, private ui: UiService,
    private db: AngularFireDatabase, private route: ActivatedRoute, private router: Router, private store: AngularFirestore,
    private title: Title, ) {
  }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
      this.user = user;
      if (user.id) {
        this.loadReported();
        if (user.admin) {
          const res = await this.api.get('query', { table: 'reported', select: ['*'], where: { ack: 0 }, order: { created: "DESC", } });
          this.reports.posts = res.reporteds;
        }
      }
    });
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(async params => {
      if (params.id) {
        const res = await this.api.get('query', { table: 'reported', select: ['*'], where: { id: params.id } });
        if (res.reporteds.length === 1) {
          this.undo(res.reporteds[0]);
        }
      }
    });
    this.api.get('query', { table: 'region' }).then(res => {
      this.regions = res.regions; this.selects.regions = res.regions;
      this.regionOptions.changes.pipe(take(1)).toPromise().then(() => {
        this.region.setValue(res.regions[0].id.toString());
        this.resetArea();
      });
    });
    this.api.get('query', { table: 'genre' }).then(res => {
      this.genres = res.genres; this.selects.genres = res.genres;
      this.genreOptions.changes.pipe(take(1)).toPromise().then(() => {
        this.genre.setValue(res.genres[0].id.toString());
      });
    });
    setTimeout(() => {
      if (!this.user.id) {
        this.router.navigate(['/login']);
      }
    }, 5000);
    this.title.setTitle(`レポート投稿`);
  }
  ngAfterViewInit() {
    this.onScrollEnd();
  }
  loadReported() {
    this.api.get('query', { table: 'reported', select: ['*'], where: { user: this.user.id }, order: { created: "DESC", } }).then(res => {
      this.reports.drafts = res.reporteds.filter(reported => { return reported.ack == -1; });
      this.reports.requests = res.reporteds.filter(reported => { return reported.ack == 0; });
      this.reports.acks = res.reporteds.filter(reported => { return reported.ack == 1; });
    });
  }
  async resetArea() {
    const res = await this.api.get('query', { table: 'area', where: { region: this.region.value } });
    this.areas = res.areas;
    await this.areaOptions.changes.pipe(take(1)).toPromise();
    if (res.areas.length) {
      this.area.setValue(res.areas[0].id.toString());
    } else {
      this.area.reset();
    }
  }
  clearShop() {
    if (this.undoing) return;
    this.shop.reset(); this.shoping = "選択してください"; this.shopimg = ""; this.report.shop_img = `${APIURL}img/noimage.png`;
    this.clearCast();
  }
  clearCast() {
    if (this.undoing) return;
    this.cast.reset(); this.casting = "選択してください"; this.castimg = ""; this.report.cast_img = `${APIURL}img/castnoimage.jpg`;
  }
  async popList(table: string) {
    let where: any = {};
    if (table === "shop") {
      where = { region: this.region.value, area: this.area.value, genre: this.genre.value };
    } else if (table === 'cast') {
      where = { shop: this.shop.value };
    } else {
      return;
    }
    const pop = await this.modal.create({
      component: ListComponent,
      componentProps: { prop: { table: table, where: where } },
      cssClass: 'list',
    });
    return await pop.present().then(() => {
      pop.onDidDismiss().then(event => {
        if (event.data) {
          this[table].reset(event.data.id);
          this[table + "ing"] = event.data.na; this[table + "img"] = event.data.simg; this.report[`${table}_img`] = event.data.img;
          let a = this.report;
        }
      });
    });;
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
  async addShop(id: number) {
    const modal = await this.modal.create({
      component: ShopComponent,
      componentProps: { prop: { user: this.user, id: id, region: this.region.value, area: this.area.value, genre: this.genre.value, report: this.report } },
    });
    return await modal.present().then(() => {
      modal.onDidDismiss().then(async event => {
        if (event.data) {
          if (event.data.id) {
            this.shop.setValue(event.data.id);
            this.shoping = event.data.na; this.shopimg = event.data.simg; this.report.shopimg = event.data.simg; this.report.shop_img = event.data.img;
          } else {
            if (event.data.id === null) {
              const res = await this.api.get('query', { table: 'report', select: ['id'], where: { shop: id }, order: { 'shop': "" } });
              if (res.reports.length) this.erase(res.reports.map(report => { return report.id; }));
            }
            this.clearShop();
          }
        }
      });
    });;
  }
  async addCast(id: number) {
    const modal = await this.modal.create({
      component: CastComponent,
      componentProps: { prop: { user: this.user, id: id, shop: this.shop.value, report: this.report } },
    });
    return await modal.present().then(() => {
      modal.onDidDismiss().then(async event => {
        if (event.data) {
          if (event.data.id) {
            this.cast.setValue(event.data.id);
            this.casting = event.data.na; this.castimg = event.data.simg; this.report.castimg = event.data.simg; this.report.cast_img = event.data.img;
          } else {
            if (event.data.id === null) {
              const res = await this.api.get('query', { table: 'report', select: ['id'], where: { cast: id }, order: { 'cast': "" } });
              if (res.reports.length) this.erase(res.reports.map(report => { return report.id; }));
            }
            this.clearCast();
          }
        }
      });
    });;
  }
  async changeCast() {
    if (this.undoing) return;
    if (this.cast.value && this.user.id) {
      let insert = {
        user: this.user.id, created: this.dateFormat(), region: this.region.value, area: this.area.value, genre: this.genre.value,
        shop: this.shop.value, cast: this.cast.value
      };
      let confirm = false;
      if (this.report.id) {
        confirm = await this.ui.confirm("コピペ", "現在の内容を元にして新しいレポートを作成しますか？<br>※「いいえ」で現在の内容を破棄します。");
        if (confirm) insert = { user: this.user.id, created: this.dateFormat(), ...this.reportForm.value };
      }
      this.create(insert, confirm);
    }
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
              user: this.user.id, created: this.dateFormat(), region: this.region.value, area: this.area.value,
              genre: this.genre.value, shop: this.shop.value, cast: this.cast.value
            }, false);
          }
        }, {
          text: 'はい',
          handler: () => {
            this.create({ user: this.user.id, ...this.reportForm.value, created: this.dateFormat() }, true);
          }
        }
      ]
    });
    await alert.present();
  }
  create(insert, storyCopy: boolean) {
    this.api.post("query", { table: "report", insert: insert }).then(async res => {
      if (storyCopy) {
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
      this.undo({ ...res.report, shopimg: this.report.shopimg, shop_img: this.report.shop_img, castimg: this.report.castimg, cast_img: this.report.cast_img }, true);
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
    this.detailY = this.detail.nativeElement.offsetTop;
    this.essayY = this.essay.nativeElement.offsetTop;
    this.scoreY = this.score.nativeElement.offsetTop;
  }
  scroll(target) {
    this.content.nativeElement.scrollToPoint(0, target, 500);
  }
  async undo(report, castKeep?: boolean) {
    this.undoing = true;
    if (this.user.id !== report.user) {
      const snapshot = await this.db.database.ref(`user/${report.user}`).once('value');
      const user = snapshot.val();
      report.author = { id: snapshot.key, na: user.na, avatar: user.avatar };
    }
    this.report = report;
    const regionOptions = this.regionOptions.changes.pipe(take(1)).toPromise();
    const areaOptions = this.areaOptions.changes.pipe(take(1)).toPromise();
    const genreOptions = this.genreOptions.changes.pipe(take(1)).toPromise();
    this.regions = this.selects.regions;//.filter(region => { return region.id === report.region; });
    this.genres = this.selects.genres;//.filter(genre => { return genre.id === report.genre; });
    const res = await this.api.get('query', { table: 'area', where: { region: report.region } }).catch(() => { return; });
    this.areas = res.areas;
    await Promise.all([regionOptions, areaOptions, genreOptions]);//各select optionsが描画されてからselectに値を入れないと選択されない
    const controls = this.reportForm.controls
    for (let key of Object.keys(controls)) {
      if (report[key] == null) {
        controls[key].reset();
      } else {
        controls[key].reset(report[key].toString());
      }
    }
    if (!castKeep) {
      this.shoping = report.shop_na; this.casting = report.cast_na; this.shopimg = report.shopimg; this.castimg = report.castimg;
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
  save(ack) {
    let update: any = { ...this.reportForm.value, ack: ack }; const msg = ['下書き保存', '投稿', '公開'];
    if (ack === 1) {
      update.acked = this.dateFormat();
      update.ackuser = this.user.id;
    }
    this.api.post('query', { table: 'report', update: update, where: { id: this.report.id } }).then(() => {
      if (ack === 0) {
        this.db.database.ref(`post/report${this.report.id}`).set(
          {
            id: `report${this.report.id}`, na: `${this.shoping} ${this.casting}`, upd: new Date().getTime(),
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
              na: `${this.shoping} ${this.casting}`, uid: this.report.user, shop: this.shop.value, cast: this.cast.value,
              description: description, image: this.report.cast_img, upd: new Date().getTime(),
            });
        });
      }
      this.loadReported();
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
          if (story.file) this.strage.ref(`report/${id}/${story.file}`).delete();
        }
        await this.api.post('query', { table: 'report', delete: { id: id } });
        await this.api.post('query', { table: 'story', delete: { typ: 'report', parent: id } });
        await this.db.list(`report/${id}`).remove();
        await this.db.database.ref(`post/report${id}`).remove();
        await this.store.collection('report').doc(id.toString()).delete();
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
    this.loadReported();
    this.shopimg = null;
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
