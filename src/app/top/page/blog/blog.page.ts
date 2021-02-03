import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../service/api.service';
import { UserService } from '../../../service/user.service';
@Component({
  selector: 'app-blog',
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss'],
})
export class BlogPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('chat', { read: ElementRef, static: false }) chat: ElementRef;
  param = { id: null, cursor: null };
  blog: Blog = BLOG;
  blogs: Blog[] = [];
  user;
  isStory: boolean;
  currentY: number; scrollH: number; contentH: number; essayY: number; chatY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private api: ApiService, private userService: UserService, private title: Title,) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.param.id = params.id;
      if (params.cursor) this.param.cursor = params.cursor;      
    });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      this.load();
    });
  }
  async load() {
    let res = await this.api.get('query', { select: ['*'], table: "blog", where: { id: this.param.id, or: { ack: 1, user: this.user.id }, or1: { close: 0, user: this.user.id } } });
    if (res.blogs.length === 1) {
      this.blog = res.blogs[0];
      this.title.setTitle(`${this.blog.na} `);      
      res = await this.api.get('query', { select: ['*'], table: "blog", where: { user: this.blog.user, typ: this.blog.typ, ack: 1, close: 0, id: { not: this.param.id } } });
      this.blogs = res.blogs;
      setTimeout(()=>{this.onScrollEnd();},1000);     
    } else {
      this.blog = {...BLOG,na:"未公開または公開停止中です。"};
    }
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
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
export interface Blog {
  id: number;
  typ: number;
  idx?: number;
  user: string;
  na: string;
  img: string;
  simg: string;
  txt: string;
  created: Date;
  chat: boolean;
  close?: boolean;
  ack?: number;
}
export const BLOG: Blog = {
  typ: 0, id: null, na: "", user: null, img: "", simg: "", txt: "", created: null, chat: true, ack: 0
}
