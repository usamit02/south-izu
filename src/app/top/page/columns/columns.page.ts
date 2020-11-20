import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from './../../../service/store.service';
import { ApiService } from './../../../service/api.service';
import { UserService } from '../../../service/user.service';
@Component({
  selector: 'app-columns',
  templateUrl: './columns.page.html',
  styleUrls: ['./columns.page.scss'],
})
export class ColumnsPage implements OnInit, OnDestroy {
  columns = [];
  allColumns = [];
  parentColumn;
  place: string = "";
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private store: Store, private api: ApiService, private user: UserService, ) { }

  ngOnInit() {
    this.store.select(state => state.columns).pipe(takeUntil(this.onDestroy$)).subscribe(columns => {
      if (columns.length > 0) {
        this.allColumns = columns;
      } else {
        this.api.get('column', { uid: this.user.get().id }).then(res => {
          this.allColumns = res.columns;
          this.store.update(state => ({ ...state, columns: res.columns }));
        }).catch(() => {
          alert(`コラムの読込に失敗しました。`);
        });
      }
      this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
        this.place = "";
        const parentColumn = this.allColumns.filter(column => { return column.id === Number(params.parent) });
        if (parentColumn.length) {
          this.parentColumn = parentColumn[0];
          let parent = parentColumn[0].parent;
          while (parent) {
            const column = this.allColumns.filter(col => { return col.id === parent; });
            if (column.length) {
              this.place += `＜${column[0].na}`;
              parent = column[0].parent;
            } else {
              parent = 0;
            }
          }
          this.place += "＜コラム";
        } else {
          this.parentColumn = { id: 0, na: "コラム", parent: null };
        }
        this.columns = this.allColumns.filter(column => { return column.parent === Number(params.parent) });
        this.columns.sort((a, b) => {
          if (a.idx < b.idx) return -1;
          if (a.idx > b.idx) return 1;
          return 0;
        });
      });
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
