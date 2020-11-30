import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../service/user.service';
import { Router, Event, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';

@Component({
  selector: 'app-top',
  templateUrl: './top.page.html',
  styleUrls: ['./top.page.scss']
})
export class TopPage implements OnInit, OnDestroy {
  user: any = { id: "", na: "" };
  page;
  private onDestroy$ = new Subject();
  constructor(private userService: UserService,private router: Router) {

  }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
    });
    this.router.events.pipe(takeUntil(this.onDestroy$)).subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
          this.page=event.url;
      }
  });
  }
  logout(e) {
    this.userService.logout();
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
