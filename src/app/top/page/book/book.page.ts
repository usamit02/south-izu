import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { CalendarModal, CalendarModalOptions, DayConfig } from 'ion2-calendar';
import { UserService } from '../../../service/user.service';
import { User } from '../../../class';
@Component({
  selector: 'app-book',
  templateUrl: './book.page.html',
  styleUrls: ['./book.page.scss'],
})
export class BookPage implements OnInit, OnDestroy {
  user:User;
  book:Book;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private location: Location, private db: AngularFireDatabase, private ui: UiService,
    private userService: UserService,private api:ApiService, ) { }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.book={id:params.id,na:params.na,from:new Date(params.from),to:new Date(params.to)};
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
        this.user = user;
      });
    });
  }
  bill(e) {
    this.ui.pop(`${this.book.na}を予約しました。`);
    this.location.back();    
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
interface Book{
  id:number;
  na:string;
  from:Date;
  to:Date;
  options?:Array<Option>
}
interface Option{
  id:number;
  na:string;
  price:number;
}