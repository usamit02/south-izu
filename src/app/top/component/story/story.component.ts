import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../../service/api.service';
import { UserComponent } from '../user/user.component';
@Component({
  selector: 'app-story',
  templateUrl: './story.component.html',
  styleUrls: ['./story.component.scss'],
})
export class StoryComponent implements OnInit, OnChanges {
  @Input() user;
  @Input() typ;
  @Input() param;
  storys = [];
  user$;
  view: any = {};//viewカウント重複防止
  constructor(private pop: PopoverController, private db: AngularFireDatabase, private api: ApiService,) { }
  ngOnInit() {
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.params) {
      this.api.get('query', { table: 'story', select: ['*'], where: { typ: this.typ, parent: this.param.id } }).then(async res => {
        if (res.storys.length) {
          if(this.param.user) this.user$ = this.db.object(`user/${this.param.user}`).valueChanges();
          if (!(this.param.id in this.view) && Number(this.param.ack) === 1) {
            this.db.database.ref(`${this.typ}/${this.param.id}/view`).transaction(val => {
              return (val || 0) + 1;
            });
            this.db.database.ref(`user/${this.param.user}/view`).transaction(val => {
              return (val || 0) + 1;
            });
            this.view[this.param.id] = "";
          }
          let support = null;
          this.storys = await Promise.all(res.storys.map(async story => {
            if (story.rested) {//非公開の記事
              if (support || this.user.id === this.param.user) {//||this.user.admin
                story.rested = null;
              } else {
                if (support == null && this.user.id) {
                  const doc = await this.db.database.ref(`friend/${this.user.id}/${this.param.user}`).once('value');
                  support = doc.val() === "support" ? true : false;
                }
                if (support || new Date(story.rested).getTime() < new Date().getTime()) {
                  story.rested = null;
                }
              }
            }
            return story;
          }));
        }
      });
    }
  }
  async popUser(event, uid) {
    const popover = await this.pop.create({
      component: UserComponent,
      componentProps: { id: uid, self: this.user },
      cssClass: 'user'
    });
    return await popover.present();
  }

}
