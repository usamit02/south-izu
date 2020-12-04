import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IonSlides, PopoverController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../../class';
import { ApiService } from '../../../service/api.service';
import { UserService } from '../../../service/user.service';
import { UserComponent } from '../../component/user/user.component';
@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit, OnDestroy {
  @ViewChild('slides', { static: false }) slides: IonSlides;
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('media', { read: ElementRef, static: false }) media: ElementRef;
  @ViewChild('chat', { read: ElementRef, static: false }) chat: ElementRef;
  params;
  report: any;
  storys = [];
  imgs = [];
  video;
  show: boolean = false;
  user: User;
  eval: string;//評価good、bad
  count: number = 0;//おなじcastのレポート数
  view: any = {};//viewカウント重複防止
  titsVals = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
  skinVals = ['', '純白', '白', '普通', '褐色', '黒ギャル'];
  tabaccoVals = ['', '非喫煙', '吸わない', '断って', '吸う', 'ヘビー'];
  tattooVals = ['', '墨なし', '小1', '大1', '半身', '全身'];
  commuVals = ['', '日英×', '英語', '挨拶', '片言', '流暢'];
  slideOpts = {
    initialSlide: 0, speed: 500, loop: true, slidesPerView: 1,
    autoplay: {
      delay: 3000,
    }
  }
  currentY: number; scrollH: number; contentH: number; basicY: number; essayY: number; mediaY: number; chatY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private api: ApiService, private db: AngularFireDatabase, private userService: UserService,
    private store: AngularFirestore, private pop: PopoverController, private title: Title, ) { }
  ngOnInit() {
    const storyLoad = () => {
      this.api.get('query', { table: 'story', select: ['*'], where: { typ: "report", parent: this.params.id } }).then(async res => {
        let support = null;
        this.storys = await Promise.all(res.storys.map(async story => {
          if (story.rested) {//非公開の記事
            if (support || this.user.id === this.report.user) {//||this.user.admin
              story.rested = null;
            } else {
              if (support == null && this.user.id) {
                const doc = await this.db.database.ref(`friend/${this.user.id}/${this.report.user}`).once('value');
                support = doc.val() === "support" ? true : false;
              }
              if (support || new Date(story.rested).getTime() < new Date().getTime()) {
                story.rested = null;
              }
            }
          }
          return story;
        }));
      });
    }
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params = params;
      this.api.get('query', { table: 'reported', select: ['*'], where: { id: params.id } }).then(res => {
        let report: any = res.reporteds[0];
        report.user$ = this.db.object(`user/${report.user}`).valueChanges();
        this.report = report;
        this.show = true;
        this.title.setTitle(`${report.shop_na} ${report.cast_na}の体験レポート`);
        if (!(params.id in this.view) && Number(report.ack) === 1) {
          this.db.database.ref(`report/${report.id}/view`).transaction(val => {
            return (val || 0) + 1;
          });
          this.db.database.ref(`user/${report.user}/view`).transaction(val => {
            return (val || 0) + 1;
          });
          this.view[params.id] = "";
        }
        setTimeout(() => { this.onScrollEnd(); }, 3000);
        storyLoad();
        this.api.get('query', { table: 'castimg', select: ['url', 'video'], where: { cast: report.cast } }).then(res => {
          this.imgs = res.castimgs.filter(img => { return !img.video; });
          const videos = res.castimgs.filter(img => { return img.video; });
          this.video = videos.length ? videos[0] : null;
        });
        this.api.get('query', { count: 'report', where: { ack: 1, cast: report.cast } }).then(res => {
          this.count = res.count;
        });
        if (this.user.id && report.ack === 1) {
          this.store.doc(`report/${params.id}/eval/${this.user.id}`).get().toPromise().then(snap => {
            this.eval = snap.exists ? snap.data().id : null;
          });
        } else {
          this.eval = "disabled";
        }
      });
    });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      //if (this.user.id && this.storys.length) storyLoad();
    });
  }
  async onScrollEnd() {
    const content = await this.content.nativeElement.getScrollElement();
    this.currentY = content.scrollTop;
    this.contentH = content.offsetHeight;
    this.scrollH = content.scrollHeight;
    this.basicY = this.basic.nativeElement.offsetTop;
    this.mediaY = this.media.nativeElement.offsetTop;
    this.essayY = this.essay.nativeElement.offsetTop;
    this.chatY = this.chat.nativeElement.offsetTop;
  }
  scroll(target) {
    this.content.nativeElement.scrollToPoint(0, target, 500);
  }
  evaluation(val) {
    const na = `${this.report.shop_na} ${this.report.cast_na}`;
    this.store.doc(`report/${this.params.id}/eval/${this.user.id}`).set({ id: val, uid: this.report.user, na: na, upd: new Date() }).then(() => {
      this.eval = val;
    }).catch(err => {
      alert(`評価の書き込みに失敗しました\r\n${err.message}`);
    });
  }
  async popUser(uid) {
    const popover = await this.pop.create({
      component: UserComponent,
      componentProps: { id: uid, self: this.user },
      cssClass: 'user'
    });
    return await popover.present();
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
