import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from '../../../class';
import { UserService } from '../../../service/user.service';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
@Component({
  selector: 'app-stay',
  templateUrl: './stay.page.html',
  styleUrls: ['./stay.page.scss'],
})
export class StayPage implements OnInit,OnDestroy {
  user:User;
  params = { id: null };
  private onDestroy$ = new Subject();
  constructor(private route:ActivatedRoute,private userService:UserService,private api:ApiService,private ui:UiService,) { }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params.id = params.id;
      if (params.id) {
        this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
          this.user=user;
        });
      }
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
