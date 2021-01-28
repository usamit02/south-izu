import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../service/api.service';
import { UserService } from '../../../service/user.service';
import { HOME } from '../../../config';
import { User } from '../../../class';
@Component({
  selector: 'app-meet',
  templateUrl: './meet.page.html',
  styleUrls: ['./meet.page.scss'],
})
export class MeetPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  home: string = "";
  date: string = "";
  user: User;
  users = [];
  param: any = {id:null};//chat component の初期値
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private api: ApiService, private userService: UserService, private title: Title,) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
        this.user = user;
        if (user.id) {
          const res = await this.api.get('query', { table: "book", select: ['user', 'na', 'avatar'], where: { home: params.home, dated: params.date } });
          if (res.books.filter(book => { return book.user === user.id; }).length) {
            this.users = res.books;
            this.home = HOME[params.home].na;
            this.date = params.date;
            this.param = { id: `${params.home}_${this.date}`, topInfinite: true };
            if (params.cursor) this.param.cursor = params.cursor;
            if (params.thread) this.param.thread = params.thread;
          }
        }
      });
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
