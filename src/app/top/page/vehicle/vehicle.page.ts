import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../service/api.service';
import { UserService } from '../../../service/user.service';
@Component({
  selector: 'app-vehicle',
  templateUrl: './vehicle.page.html',
  styleUrls: ['./vehicle.page.scss'],
})
export class VehiclePage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('chat', { read: ElementRef, static: false }) chat: ElementRef;
  param = { id: null ,cursor:null};
  vehicle: Vehicle = VEHICLE;
  vehicles: Vehicle[] = [];
  user;
  isStory: boolean;
  currentY: number; scrollH: number; contentH: number; essayY: number; chatY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private api: ApiService, private userService: UserService, private title: Title,) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.param.id = params.id;
      if(params.cursor) this.param.cursor=params.cursor;
      this.load();
    });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
    });
  }
  async load() {
    let res = await this.api.get('query', { select: ['*'], table: "vehicle", where: { id: this.param.id } });
    if (res.vehicles.length) {
      this.title.setTitle(`${res.vehicle.na} `);
      this.vehicle = res.vehicle;
      res = await this.api.get('query', { select: ['*'], table: "vehicle", where: { user: this.vehicle.user } });
      this.vehicles = res.vehicles;
    } else {
      this.vehicle = VEHICLE;
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
interface Vehicle {
  id: number;
  typ: number;
  idx?: number;
  user: string;
  na: string;
  maker: string;
  img: string;
  simg: string;
  txt: string;
  year: number;
  created: Date;
  chat: boolean;
  close?: boolean;
}
const VEHICLE: Vehicle = {
  typ: 0, id: null, na: "", maker: "", user: null, img: "", simg: "", txt: "", year: null, created: null, chat: null
}
