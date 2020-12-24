import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { ApiService } from '../../../service/api.service';
import { UserService } from '../../../service/user.service';
import { UserComponent } from '../../component/user/user.component';
@Component({
  selector: 'app-column',
  templateUrl: './column.page.html',
  styleUrls: ['./column.page.scss'],
})
export class ColumnPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('chat', { read: ElementRef, static: false }) chat: ElementRef;
  param = { id: null, topInfinite: false };
  column: any;
  storys = [];
  columns = [];
  show: boolean = false;
  user;
  view: any = {};
  isStory:boolean;
  currentY: number; scrollH: number; contentH: number; essayY: number; chatY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private api: ApiService, private db: AngularFireDatabase, private userService: UserService,
    private store: AngularFirestore, private pop: PopoverController, private title: Title, ) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.param.id = params.id; this.load();
    });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user; this.load();
    });
  }
  load() {
    if (!this.user) return;
    this.api.get('column', { id: this.param.id, uid: this.user.id }).then(res => {
      let column: any = res.column;
      this.storys = res.storys.map(story => {
        story.txt = `<p>　${story.txt}</p>`;
        return story;
      });
      if (res.storys.length) {
        column.user$ = this.db.object(`user/${column.user}`).valueChanges();
        this.columns = res.columns;
      } else {
        this.param.topInfinite = true;//chatの上部無限スクロール有効
      }
      this.column = column;
      this.title.setTitle(`${column.na} `);
      this.show = true;
    });
  }
  async onScrollEnd() {
    const content = await this.content.nativeElement.getScrollElement();
    this.currentY = content.scrollTop;
    this.contentH = content.offsetHeight;
    this.scrollH = content.scrollHeight;
    this.essayY = this.essay.nativeElement.offsetTop;
    this.chatY = this.chat ? this.chat.nativeElement.offsetTop : 0;
  }
  scroll(target) {
    this.content.nativeElement.scrollToPoint(0, target, 500);
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
