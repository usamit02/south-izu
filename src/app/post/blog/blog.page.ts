import { Component, OnDestroy, OnInit, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../class';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { APIURL } from '../../../environments/environment';
import { ListComponent } from '../component/list/list.component';
import { Blog, BLOG } from '../../top/page/blog/blog.page';
@Component({
  selector: 'app-blog',
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss'],
})
export class BlogPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  @ViewChildren('typOptions', { read: ElementRef }) typOptions: QueryList<ElementRef>;
  user: User;
  id: number = null;
  blog = {
    typ: new FormControl(BLOG.typ, [Validators.required]),
    na: new FormControl(BLOG.na, [Validators.minLength(2), Validators.maxLength(20), Validators.required]),
    txt: new FormControl(BLOG.txt, [Validators.minLength(2), Validators.maxLength(600)]),
    img: new FormControl(BLOG.img), simg: new FormControl(BLOG.simg),
    user: new FormControl(BLOG.user),
    close: new FormControl(BLOG.close), chat: new FormControl(BLOG.chat)
  }
  blogForm = this.builder.group({
    typ: this.blog.typ, na: this.blog.na, txt: this.blog.txt, img: this.blog.img, simg: this.blog.simg,
    user: this.blog.user, close: this.blog.close, chat: this.blog.chat
  });
  blogTyps = [];
  blogs = { drafts: [], acks: [] };
  imgBlob;
  noimgUrl = APIURL + 'img/noimg.jpg';
  saving = false;
  currentY: number; scrollH: number; contentH: number; planY: number; basicY: number; essayY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService, private api: ApiService,
    private ui: UiService, private builder: FormBuilder, private storage: AngularFireStorage, private alert: AlertController,
    private db: AngularFireDatabase, private storedb: AngularFirestore, private modal: ModalController,) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
        this.user = user;
        if (!user.id) {
          //this.router.navigate(['login']);
        } else {
          this.loadblog();
          if (params.id) {
            this.id = Number(params.id);          
            this.undo();
          }
        }
      });
    });
    this.api.get('query', { table: 'blogtyp', select: ['id', 'na'] }).then(res => {
      this.blogTyps = res.blogTyps;
      this.typOptions.changes.pipe(take(1)).toPromise().then(() => {
        this.blog.typ.setValue(res.blogTyps[0].id.toString());
      });
    });
  }
  async undo(blog?: Blog) {
    if (!blog) {
      const res = await this.api.get('query', { select: ['*'], table: 'blog', where: { id: this.id, a: { ack: 1, user: this.user.id } } });
      if (res.blogs.length === 1) {
        blog = res.blogs[0];
      } else {
        blog = BLOG; this.ui.alert("無効なparam.idです");
      }
    }
    const controls = this.blogForm.controls
    for (let key of Object.keys(controls)) {
      if (blog[key] == null) {
        controls[key].reset(BLOG[key]);
      } else {
        controls[key].reset(blog[key]);
      }
    }
    this.blogForm.markAsPristine();
  }
  loadblog() {
    this.api.get('query', { table: 'blog', select: ['*'], where: { user: this.user.id }, order: { created: "DESC", } }).then(res => {
      this.blogs.drafts = res.blogs.filter(blog => { return blog.ack == -1; });
      this.blogs.acks = res.blogs.filter(blog => { return blog.ack == 1; });
    });
  }
  async popBlogs(blogs, e) {
    const modal = await this.modal.create({
      component: ListComponent,
      componentProps: { prop: { blogs: blogs } },
      cssClass: 'report'
    });
    return await modal.present().then(() => {
      modal.onDidDismiss().then(event => {
        if (event.data) {
          this.undo(event.data);
        }
      });
    });;
  }
  async add(table, na, placeholder, param: any = {}) {
    const alert = await this.alert.create({
      header: `新しい${na}を追加`,
      inputs: [{ name: table, type: 'text', placeholder: placeholder },],
      buttons: [{ text: 'Cancel', role: 'cancel', cssClass: 'secondary', },
      {
        text: 'Ok', handler: (data) => {
          if (data[table].length > 0 && data[table].length < 21) {
            param.na = data[table];
            this.api.post('query', { table: table, insert: param }).then(res => {
              this[table + "s"].push(res[table]);
              setTimeout(() => { this[table].setValue(res[table].id.toString()); }, 1000);
            })
          }
        }
      }]
    });
    await alert.present();
  }
  imgChange(e) {
    if (e.target.files[0].type.match(/image.*/)) {
      this.imgBlob = window.URL.createObjectURL(e.target.files[0]);
      this.blogForm.markAsDirty();
    } else {
      this.ui.pop("画像ファイルjpgまたはpngを選択してください。");
    }
  }
  async preview() {
    if (this.user.id === this.blog.user.value || this.user.admin) {
      await this.api.post('query', { table: 'blog', update: this.blogForm.value, where: { id: this.id } });
    }
    this.router.navigate(['/blog', this.id]);
  }
  async save(ack) {
    if (this.blogForm.dirty) {
      this.saving = true;
      this.ui.loading('保存中...');
      let update: any = { ...this.blogForm.value,ack:ack };
      if (this.imgBlob) {
        if (!HTMLCanvasElement.prototype.toBlob) {//edge対策
          Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback, type, quality) {
              let canvas = this;
              setTimeout(function () {
                var binStr = atob(canvas.toDataURL(type, quality).split(',')[1]),
                  len = binStr.length,
                  arr = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  arr[i] = binStr.charCodeAt(i);
                }
                callback(new Blob([arr], { type: type || 'image/jpeg' }));
              });
            }
          });
        }
        const imagePut = (id: number, typ: string) => {
          return new Promise<string>(resolve => {
            if (!this.imgBlob) return resolve("");
            let canvas: HTMLCanvasElement = this.canvas.nativeElement;
            let ctx = canvas.getContext('2d');
            let image = new Image();
            image.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              const px = typ == 'small' ? 160 : 640;
              let w, h;
              if (image.width > image.height) {
                w = image.width > px ? px : image.width;//横長
                h = image.height * (w / image.width);
              } else {
                h = image.height > px * 0.75 ? px * 0.75 : image.height;//縦長
                w = image.width * (h / image.height);
              }
              canvas.width = w; canvas.height = h;
              ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(async blob => {
                const ref = this.storage.ref(`blog/${id}/${typ}.jpg`);
                await ref.put(blob);
                const url = await ref.getDownloadURL().toPromise();
                return resolve(url);
              }, "image/jpeg")
            }
            image.src = this.imgBlob;
          });
        }
        update.img = await imagePut(this.id, "medium");
        update.simg = await imagePut(this.id, "small");
      }
      await this.api.post('query', { table: "blog", update: update, where: { id: this.id } });
      
      const msg = ['下書き保存', '投稿', '公開'];
      this.ui.pop(`${msg[ack + 1]}しました。`);
      this.saving = false;
      this.blogForm.markAsPristine();
      this.loadblog();
      this.ui.loadend();
    }
  }
  async new() {
    const alert = await this.alert.create({
      header: '新しいブログ作成',
      message: '現在の内容を元にして新しい愛車を作成しますか。<br>「いいえ」で現在の編集内容を破棄します。',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'いいえ',
          handler: () => {
            this.create({});
          }
        }, {
          text: 'はい',
          handler: () => {
            this.create(this.blogForm.value, true);
          }
        }
      ]
    });
    await alert.present();
  }
  async create(insert, copy?: boolean) {
    this.api.post("query", { table: "blog", insert: { ...insert, user: this.user.id ,ack:-1} }).then(async res => {
      if (copy && res.blog) {
        let doc = await this.api.get('query', { table: "story", select: ["*"], where: { typ: "blog", parent: this.id } });
        if (doc.storys.length) {
          doc.storys.map(story => {
            story.parent = res.blog.id;
            return story;
          });
          await this.api.post('querys', { table: "story", inserts: doc.storys });
        }
      }
      this.id = res.blog.id;
      this.undo();
    }).catch(err => {
      this.ui.alert(`新規ブログの作成に失敗しました。\r\n${err.message}`);
    });
  }
  async erase() {
    const confirm = await this.ui.confirm("削除確認", `ブログ「${this.blog.na.value}」を削除します。`);
    if (!confirm || !this.id) return;
    this.ui.loading('削除中...');
    this.api.get('query', { table: 'story', select: ['file'], where: { typ: 'blog', parent: this.id } }).then(async res => {
      for (let story of res.storys) {
        if (story.file) this.storage.ref(`blog/${this.id}/${story.file}`).delete();
      }
      await this.api.post('querys', { deletes: [{ parent: this.id, typ: 'blog', table: "story" }] });
      await this.db.list(`blog/${this.id}`).remove();
      await this.db.database.ref(`post/blog${this.id}`).remove();
      await this.storedb.collection('blog').doc(this.id.toString()).delete();
      if (this.blog.img.value) {
        await this.storage.ref(`blog/${this.id}/medium.jpg`).delete();
        await this.storage.ref(`blog/${this.id}/small.jpg`).delete();
      }
      this.id = null; this.blogForm.reset();
      this.ui.pop("ブログを削除しました。");
    }).catch(err => {
      this.ui.alert(`ブログを削除できませんでした。\r\n${err.message}`);
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
