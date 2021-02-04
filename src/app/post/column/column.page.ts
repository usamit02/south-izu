import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PopoverController, ModalController, AlertController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { User, Column } from '../../class';
import { Store } from './../../service/store.service';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { ListComponent } from '../component/list/list.component';
import { CropComponent } from '../component/crop/crop.component';
import { TreeComponent } from '../component/tree/tree.component';
@Component({
  selector: 'app-column',
  templateUrl: './column.page.html',
  styleUrls: ['./column.page.scss'],
})
export class ColumnPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(30), Validators.required]);
  kana = new FormControl("", [Validators.minLength(2), Validators.maxLength(60), Validators.pattern(/^([ぁ-ん]|ー)+$/)]);
  description = new FormControl("", [Validators.minLength(2), Validators.maxLength(300)]);
  parent = new FormControl(null, [Validators.required]);
  rest = new FormControl(0);
  chat = new FormControl(1);
  columnForm = this.builder.group({
    na: this.na, kana: this.kana, description: this.description, parent: this.parent, rest: this.rest, chat: this.chat
  });
  user: User;
  author: any = { id: "", na: "", avatar: "" };
  column: any = { id: null ,user:null};
  columns = { drafts: [], requests: [], posts: [], acks: [] };
  allColumns = [];
  place: string = "";
  undoing;
  imgBase64: string;
  currentY: number; scrollH: number; contentH: number; basicY: number; essayY: number;
  private onDestroy$ = new Subject();
  constructor(private api: ApiService, private userService: UserService, private builder: FormBuilder, private storage: AngularFireStorage,
    private pop: PopoverController, private modal: ModalController, private alert: AlertController, private ui: UiService,
    private db: AngularFireDatabase, private router: Router, private route: ActivatedRoute, private store: Store,
    private storedb: AngularFirestore, private title: Title,) { }
  async ngOnInit() {
    const res = await this.api.get('query', {
      table: 'colum', select: ['id', 'na', 'parent', 'user', 'ack', 'idx', 'image', 'description', 'created', 'rest', 'chat'],
      order: { ack: "DESC", idx: "", id: "" }
    });
    this.allColumns = res.colums.concat({ id: 0, na: "コラム", parent: null, user: null, ack: 1, idx: 0 });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      if (user.id) {
        this.loadColumns();
        if (user.admin) {
          this.api.get('query', { table: 'colum', select: ['*'], where: { ack: 0 }, order: { created: "DESC", } }).then(res => {
            this.columns.posts = res.colums;
          });
        }
      }
    });
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(async params => {
      if (params.id) {
        const res = await this.api.get('query', { table: 'colum', select: ['*'], where: { id: params.id } });
        if (res.colums.length === 1) {
          this.undo(res.colums[0]);
        }
      } else if (params.parent) {
        this.parent.reset(params.parent);
        this.setPlace();
      }
    });
    this.title.setTitle(`コラム投稿`);
  }
  loadColumns() {
    let columns = this.allColumns.filter(column => { return column.user === this.user.id });
    columns.sort((a, b) => {
      if (a.id < b.id) {
        return 1;
      } else {
        return -1;
      }
    });
    this.columns.drafts = columns.filter(column => { return column.ack === -1; });
    this.columns.requests = columns.filter(column => { return column.ack === 0; });
    this.columns.acks = columns.filter(column => { return column.ack === 1; });
  }
  setPlace() {
    let parent = Number(this.parent.value); this.place = "";
    while (parent != null) {
      const column = this.allColumns.filter(col => { return col.id === parent; });
      if (column.length) {
        if (parent === Number(this.parent.value)) {
          this.place = column[0].na;
        } else {
          this.place = `${column[0].na}＞${this.place}`;
        }
        parent = column[0].parent;
      } else {
        parent = 0;
      }
    }
  }
  async popColumns(columns, e) {
    const modal = await this.modal.create({
      component: ListComponent,
      componentProps: { prop: { columns: columns } },
      cssClass: 'report'
    });
    return await modal.present().then(() => {
      modal.onDidDismiss().then(event => {
        if (event.data) {
          this.router.navigate([`/post/column/${event.data.parent}`, event.data.id]);//this.undo(event.data);          
        }
      });
    });;
  }
  async popCrop() {
    const popover = await this.pop.create({
      component: CropComponent,
      componentProps: { prop: { typ: 'card' } },
      translucent: true,
      cssClass: 'cropper'
    });
    return await popover.present().then(() => {
      popover.onDidDismiss().then(event => {
        if (event.data) this.imgBase64 = event.data;
      });
    });;
  }
  async popTree() {
    const modal = await this.modal.create({
      component: TreeComponent,
      componentProps: { prop: { user: this.user, datas: this.allColumns, page: 'colum', id: this.parent.value } },
      //cssClass: 'report'
    });
    return await modal.present().then(() => {
      modal.onDidDismiss().then(event => {
        if (event.data) {
          if (event.data.columns.length) {
            this.allColumns = event.data.columns;
          }
          const id = event.data.id === this.column.id ?
            this.allColumns.filter(column => { return column.id === event.data.id; })[0].parent : event.data.id;
          if (!(id == null || id === Number(this.parent.value))) {
            this.parent.reset(id.toString());
            this.setPlace();
            this.columnForm.markAsDirty();
          }
        }
      });
    });;
  }
  async undo(column) {
    this.undoing = true;
    if (this.user.id !== column.user) {
      const snapshot = await this.db.database.ref(`user/${column.user}`).once('value');
      const user = snapshot.val();
      if(user) column.author = { id: snapshot.key, na: user.na, avatar: user.avatar };
    }
    this.column = column;
    const controls = this.columnForm.controls
    for (let key of Object.keys(controls)) {
      if (column[key] == null) {
        controls[key].reset();
      } else {
        if (key === 'chat' || key === 'rest') {
          controls[key].reset(column[key]);
        } else {
          controls[key].reset(column[key].toString());
        }
      }
    }
    this.setPlace();
    setTimeout(() => { this.undoing = false; }, 1000);
  }
  naBlur() {
    if (this.column.id || this.columnForm.invalid) return;
    this.create({ user: this.user.id, parent: this.parent.value, na: this.na.value });
  }
  async newColumn() {
    const alert = await this.alert.create({
      header: '新しいコラムを作成',
      message: '現在の内容を元にして新しいコラムを執筆しますか。<br>「いいえ」で現在の内容を破棄します。',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'いいえ',
          handler: () => {
            this.create({ user: this.user.id, parent: this.parent.value, na: this.na.value });
          }
        }, {
          text: 'はい',
          handler: () => {
            this.create({ user: this.user.id, ...this.columnForm.value }, true);
          }
        }
      ]
    });
    await alert.present();
  }
  async create(insert, storyCopy?: boolean) {
    if (this.user.id) {
      this.api.post("query", { table: "colum", insert: insert }).then(async res => {
        if (storyCopy && this.column.id) {
          let doc = await this.api.get('query', { table: "story", select: ["*"], where: { typ: "column", parent: this.column.id } });
          let inserts = doc.storys.filter(story => { return !story.rested || this.column.user === this.user.id || this.user.admin });
          if (inserts.length) {
            inserts.map(story => {
              story.parent = res.colum.id;
              return story;
            });
            await this.api.post('querys', { table: "story", inserts: inserts });
          }
        }
        this.undo(res.colum);
      }).catch(err => {
        this.ui.alert(`新規コラムの挿入に失敗しました。\r\n${err.message}`);
      });
    } else {
      this.ui.popm("コラムを作成するにはログインしてください。");
      this.router.navigate(['/login']);
    }
  }
  async preview() {
    if (this.user.id === this.column.user || this.user.admin) {
      await this.api.post('query', { table: 'colum', update: this.columnForm.value, where: { id: this.column.id } });
    }
    this.router.navigate(['/column', this.column.id]);
  }
  async save(ack) {
    if (this.user.id === this.column.user || this.user.admin) {
      let update: any = { ...this.columnForm.value, ack: ack }; const msg = ['下書き保存', '投稿', '公開'];
      update.chat = update.chat ? 1 : 0; update.rest = update.rest ? 1 : 0;
      if (ack === 1) {
        if (this.column.ack !== 1) update.acked = this.dateFormat();
        update.ackuser = this.user.id;
      }
      if (this.imgBase64) {
        let bin = atob(this.imgBase64.replace(/^.*,/, ''));
        let buffer = new Uint8Array(bin.length);
        let blob: Blob;
        for (var i = 0; i < bin.length; i++) {
          buffer[i] = bin.charCodeAt(i);
        }
        try {
          blob = new Blob([buffer.buffer], { type: 'image/jpeg' });
        } catch (e) {
          alert("ブロッブデータの作成に失敗しました。");
          return;
        }
        const ref = this.storage.ref(`column/${this.column.id}/image.jpg`);
        await ref.put(blob);
        update.image = await ref.getDownloadURL().toPromise();
      }
      this.api.post('query', { table: 'colum', update: update, where: { id: this.column.id } }).then(() => {
        if (ack === 0) {
          this.db.database.ref(`post/column${this.column.id}`).set(
            {
              id: `column${this.column.id}`, na: `${this.na.value}`, upd: new Date().getTime(),
              url: `/post/column/${this.parent.value}/${this.column.id}`, user: { id: this.user.id, na: this.user.na, avatar: this.user.avatar }
            }
          );
        } else {
          this.columns.posts = this.columns.posts.filter(column => { return column.id !== this.column.id; });
          this.db.database.ref(`post/column${this.column.id}`).remove();
        }
        if (ack === 1) {
          this.db.list(`column/`).update(this.column.id.toString(),
            { na: update.na, uid: this.column.user, description: update.description, image: update.image ? update.image : null, upd: new Date().getTime(), });
        }
        const newColumn = {
          id: this.column.id, na: this.na.value, parent: this.parent.value, user: this.user.id, ack: ack, rest: this.rest.value, chat: this.chat.value,
          description: this.description.value, image: update.image ? update.image : null, created: this.column.created,
        }
        this.allColumns = this.allColumns.filter(column => { return column.id !== this.column.id; });
        this.allColumns.push(newColumn);
        this.loadColumns();
        this.undo({ id: this.column.id, user: this.user.id, ...update, ack: ack });
        this.ui.pop(`${msg[ack + 1]}しました。`);
      }).catch(err => {
        this.ui.alert(`${msg[ack + 1]}できませんでした。\r\n${err.message}`);
      });
    } else {
      this.ui.popm("保存するにはログインしてください。");
      this.router.navigate(['login']);
    }
  }
  async erase() {
    const confirm = await this.ui.confirm("削除確認", `コラム「${this.column.na}」を削除します。`);
    if (!confirm || !this.column.id) return;
    this.ui.loading('削除中...');
    this.api.get('query', { table: 'story', select: ['file'], where: { typ: 'column', parent: this.column.id } }).then(async res => {
      for (let story of res.storys) {
        if (story.file) this.storage.ref(`column/${this.column.id}/${story.file}`).delete();
      }
      await this.api.post('querys', { deletes: [{ id: this.column.id, user: this.user.id, table: "colum" }, { typ: "column", parent: this.column.id, table: "story" }] });
      await this.db.list(`column/${this.column.id}`).remove();
      await this.db.database.ref(`post/column${this.column.id}`).remove();
      await this.storedb.collection('column').doc(this.column.id.toString()).delete();
      if (this.column.image) this.storage.ref(`column/${this.column.id}/image.jpg`).delete();
      this.ui.pop("コラムを削除しました。");
      this.columns.drafts = this.columns.drafts.filter(column => { return column.id !== this.column.id; });
      this.columns.requests = this.columns.requests.filter(column => { return column.id !== this.column.id; });
      this.columns.posts = this.columns.posts.filter(column => { return column.id !== this.column.id; });
      this.columns.acks = this.columns.acks.filter(column => { return column.id !== this.column.id; });
      this.allColumns = this.allColumns.filter(column => { return column.id !== this.column.id; });
      this.undo({ id: null, parent: null, user: this.user.id, na: "", kana: "", description: "" });
    }).catch(err => {
      this.ui.alert(`コラムを削除できませんでした。\r\n${err.message}`);
    }).finally(() => { this.ui.loadend(); });
  }
  async onScrollEnd() {
    const content = await this.content.nativeElement.getScrollElement();
    this.currentY = content.scrollTop;
    this.contentH = content.offsetHeight;
    this.scrollH = content.scrollHeight;
    this.basicY = this.basic.nativeElement.offsetTop;
    this.essayY = this.essay.nativeElement.offsetTop;
  }
  scroll(target) {
    this.content.nativeElement.scrollToPoint(0, target, 500);
  }
  dateFormat(date = new Date()) {//MySQL用日付文字列作成'yyyy-M-d H:m:s'
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var h = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();
    return y + "-" + m + "-" + d + " " + h + ":" + min + ":" + sec;
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
