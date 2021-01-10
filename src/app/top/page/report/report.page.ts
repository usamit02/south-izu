import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { User } from '../../../class';
import { ApiService } from '../../../service/api.service';
import { UserService } from '../../../service/user.service';
@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('map', { read: ElementRef, static: false }) map: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;  
  @ViewChild('chat', { read: ElementRef, static: false }) chat: ElementRef;
  params;
  report: any={id:0,na:"",user:""};
  user: User;  
  isStory: boolean;
  currentY: number; scrollH: number; contentH: number; basicY: number; essayY: number; mapY: number; chatY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private api: ApiService, private db: AngularFireDatabase, private userService: UserService,
    private title: Title, ) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params = params;
      this.api.get('query', { table: 'report', select: ['*'], where: { id: params.id } }).then(res => {
        let report: any = res.reports[0];
        report.user$ = this.db.object(`user/${report.user}`).valueChanges();
        this.report = report;
        this.title.setTitle(`${report.na}`);
        setTimeout(() => { this.onScrollEnd(); }, 3000);
      });
    });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
    });
  }
  async onScrollEnd() {    
    const content = await this.content.nativeElement.getScrollElement();
    this.currentY = content.scrollTop;
    this.contentH = content.offsetHeight;
    this.scrollH = content.scrollHeight;
    this.mapY = this.map.nativeElement.offsetTop;
    this.essayY = this.essay.nativeElement.offsetTop;
    this.chatY = this.chat.nativeElement.offsetTop;
  }
  scroll(target) {
    this.content.nativeElement.scrollToPoint(0, target, 500);
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
