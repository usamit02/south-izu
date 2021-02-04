import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController, ModalController, AlertController } from '@ionic/angular';
import { Subject, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireDatabase } from '@angular/fire/database';
import { User, Column } from '../../../class';
import { ApiService } from './../../../service/api.service';
import { UiService } from './../../../service/ui.service';
import { Store } from './../../../service/store.service';
import { UserComponent } from '../user/user.component';
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnChanges, OnDestroy {
  @Input() user: User;
  @Output() logout = new EventEmitter();
  @Output() close = new EventEmitter();
  mode: string;
  direct$: Observable<any>;
  mention$: Observable<any>;//mentions: Array<Mention> = [];
  post$: Observable<any>;
  columns = [];
  column = { parent: 0, grand: null, lock: 0, up: null };
  allColumns: Array<Column> = [];
  private onDestroy$ = new Subject();
  constructor(private router: Router, private storedb: AngularFirestore, private store: Store, private db: AngularFireDatabase,
    private ui: UiService, private api: ApiService, private pop: PopoverController, private modal: ModalController, private alert: AlertController,) { }
  ngOnInit() {
    this.openColumn(true);
  }
  ngOnChanges() {
    if (this.user.id) {
      this.direct$ = this.storedb.collection(`user/${this.user.id}/undirect`, ref => ref.orderBy('upd')).valueChanges();
      this.mention$ = this.storedb.collection(`user/${this.user.id}/unmention`, ref => ref.orderBy('upd')).valueChanges();
      if (this.user.admin) {
        this.post$ = this.db.list(`post`).valueChanges();
      } else {
        this.post$ = null;
      }
    } else {
      this.direct$ = null; this.mention$ = null; this.post$ = null;
    }
  }
  openColumn(init?: boolean) {
    if (this.allColumns.length) {
      this.loadColumns(this.column.parent, init);
    } else {
      this.api.get('column', { uid: this.user.id }).then(res => {
        this.allColumns = res.columns;
        this.store.update(state => ({ ...state, columns: res.columns }));
        this.loadColumns(0, init);
      }).catch(() => {
        this.ui.alert(`コラムの読込に失敗しました。`);
      });
    }
  }
  loadColumns(parent, init?: boolean) {
    this.column.parent = parent;
    const parentColumn = this.allColumns.filter(column => { return column.id === parent; });
    if (parentColumn.length) {
      this.column.grand = parentColumn[0].parent;
      this.column.up = parentColumn[0].na;
      this.column.lock = this.user.admin || parentColumn[0].user === this.user.id ? 0 : parentColumn[0].lock;
    } else {
      this.column.grand = 0;
      this.column.up = null;
      this.column.lock = 0;
    }
    this.columns = this.allColumns.filter(column => { return column.parent === parent; });
    this.columns.sort((a, b) => {
      if (a.idx < b.idx) return -1;
      if (a.idx > b.idx) return 1;
      return 0;
    });
    if (!init) this.router.navigate(['/columns', parent]);
  }
  reorderColumns(e) {
    let temp = this.columns[e.detail.from];
    this.columns[e.detail.from] = this.columns[e.detail.to];
    this.columns[e.detail.to] = temp;
    this.api.post('column', { ids: JSON.stringify(this.columns.map(column => { return column.id; })) });
    e.detail.complete(true);
  }
  deletePost(id) {
    this.db.database.ref(`post/${id}`).remove();
  }
  link(url,modeKeep?:boolean){
    this.router.navigate([`/${url}`]);
    if(!modeKeep)this.mode="";
    this.close.emit();
  }
  menuClose(){
    this.close.emit();
  }
  direct(unread: number) {
    if (unread) {
      this.mode = this.mode === 'direct' ? '' : 'direct'
    } else {
      this.router.navigate(['/directs']);this.close.emit();
    }
  }
  delete(url: string, typ: string) {
    this.storedb.collection('user').doc(this.user.id).collection(`un${typ}`, ref => ref.where('url', '==', url)).get().toPromise().then(query => {
      query.forEach(doc => {
        this.storedb.collection('user').doc(this.user.id).collection(`un${typ}`).doc(doc.id).delete();
      });
    });
  }
  contact() {
    this.db.database.ref(`admin`).orderByValue().limitToLast(1).once('value').then(admin => {
      this.router.navigate([`/direct`], { queryParams: { user: Object.keys(admin.val())[0], self: this.user.id } });
      this.close.emit();
    }).catch(err => {
      this.ui.alert(`データベースの読込に失敗しました。\r\n${err.message}`);
    });
  }
  async popUser(event, uid) {
    const popover = await this.pop.create({
      component: UserComponent,
      componentProps: { id: uid, self: this.user },
      cssClass: 'user'
    });
    return await popover.present();
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
