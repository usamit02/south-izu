import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from '../../class';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { HOME } from '../../config';
@Component({
  selector: 'app-book',
  templateUrl: './book.page.html',
  styleUrls: ['./book.page.scss'],
})
export class BookPage implements OnInit, OnDestroy {
  user: User;
  dailys = [];
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private userService: UserService, private api: ApiService, private ui: UiService,) { }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
        this.user = user;
        if (HOME[params.home].users.filter(uid => { return user.id === uid; }).length) {
          const res = await (this.api.get('query', { table: 'bookmanaging', select: ['*'], where: { home: params.home }, order: { dated: "", stay: "" } }));
          for (let book of res.bookmanags) {
            book.isChecked = true;
            book.id = Number(book.id); book.amount = Number(book.amount); book.num = Number(book.num);
            if (!this.dailys.length || this.dailys[this.dailys.length - 1].dated !== book.dated) {
              this.dailys.push({ dated: book.dated, amount: book.amount, books: [book] });
            } else {
              this.dailys[this.dailys.length - 1].amount += book.amount;
              this.dailys[this.dailys.length - 1].books.push(book);
            }
          }

          /*         
          this.dailys = res.bookmanags.map(book=>{
            book.isChecked=true;
            book.id=Number(book.id);book.amount=Number(book.amount);book.num=Number(book.num);
            return book;
          });*/
        } else {
          this.dailys = [];
        }
      });
    });

  }
  check() {

  }
  save() {
    let a = this.dailys;
    let b = 1;
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
