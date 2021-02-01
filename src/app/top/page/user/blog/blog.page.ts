import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../../../service/api.service';
import { TabsService } from '../tabs.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss'],
})
export class BlogPage implements OnInit, OnDestroy {
  user: any = { id: "", na: "" };
  blogs = [];
  private onDestroy$ = new Subject();
  constructor(private router: Router, private api: ApiService, private db: AngularFireDatabase, private tabs: TabsService,) {
  }
  ngOnInit() {
    this.tabs.user.asObservable().pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      this.api.get('query', { table: 'blog', select: ['*'], where: { user: this.user.id, ack: 1, close: 0 } }).then(res => {
        res.blogs.map(blog => {
          blog.detail$ = this.db.object(`blog/${blog.id}`).valueChanges();
        });
        this.blogs = res.blogs;
      });
    });
  }
  new() {
    if (this.user.id) {
      this.router.navigate(['post/blog']);
    } else {
      this.router.navigate(['login']);
    }
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
