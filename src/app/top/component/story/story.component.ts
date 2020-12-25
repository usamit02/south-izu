import { Component, OnInit, OnChanges, Input,Output,SimpleChanges,EventEmitter } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Router } from '@angular/router';
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
  @Input() page;
  @Input() param;//column,markerなど親ページの基本データ
  @Input() datas;
  @Output() isStory= new EventEmitter();
  storys = [];
  user$;
  view: any = {};//viewカウント重複防止
  res:any={};
  constructor(private pop: PopoverController, private db: AngularFireDatabase, private api: ApiService,private router:Router,) {
    this.res.storys = [];
   }
  ngOnInit() {        
  }
  async ngOnChanges(changes: SimpleChanges) {
    if (changes.param && this.param.id) {
      if(this.page==="column"){
        this.res.storys=this.datas;
        if(!this.datas.length) {this.param.user=null;}
      }else{
        this.res = await this.api.get('query', { table: 'story', select: ['*'], where: { typ: this.page, parent: this.param.id } });
      }
      this.user$ = this.param.user ? this.db.object(`user/${this.param.user}`).valueChanges() : null;
      if(this.res.storys.length){
        this.isStory.emit(true);
        if (!(this.param.id in this.view) && Number(this.param.ack) === 1) {
          this.db.database.ref(`${this.page}/${this.param.id}/view`).transaction(val => {
            return (val || 0) + 1;
          });
          this.db.database.ref(`user/${this.param.user}/view`).transaction(val => {
            return (val || 0) + 1;
          });
          this.view[this.param.id] = "";
        }
      }else{
        this.isStory.emit(false);
      }
    }
    let support: boolean = null;
    this.storys = await Promise.all(this.res.storys.map(async story => {
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
  support(){
    this.router.navigate(['/support/',this.param.user]);
  }
  async popUser() {
    const popover = await this.pop.create({
      component: UserComponent,
      componentProps: { id: this.param.user, self: this.user },
      cssClass: 'user'
    });
    return await popover.present();
  }

}
