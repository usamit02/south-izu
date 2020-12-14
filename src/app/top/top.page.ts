import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../service/user.service';
import { Store } from '../service/store.service';
import { Router, Event, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';

@Component({
  selector: 'app-top',
  templateUrl: './top.page.html',
  styleUrls: ['./top.page.scss']
})
export class TopPage implements OnInit, OnDestroy {
  user: any = { id: "", na: "" };  
  page;
  home=1;
  private onDestroy$ = new Subject();
  constructor(private userService: UserService,private router: Router,private store:Store) {

  }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
    });
    this.router.events.pipe(takeUntil(this.onDestroy$)).subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        if(event.url.indexOf('book')!=-1){
          this.page='book';
        }else if(event.url.indexOf('marker')!=-1){
          this.page='marker';
        }else{
          this.page="";
        }
        if(this.home!==1&&event.url.indexOf('southizu-riderhouse')!=-1){
          this.store.update(state=> ({ ...state, home: 1 }));
          this.home=1;
        }else if(this.home!==2&&event.url.indexOf('bbload')!=-1){
          this.store.update(state=> ({ ...state, home: 2 }));
          this.home=2;
        }       
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
