import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { ModalController,PopoverController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '../../service/store.service';
import { UiService } from '../../service/ui.service';
import { ApiService } from '../../service/api.service';
import { UserService } from '../../service/user.service';
import { User, Marker, MARKER } from '../../class';
import { APIURL } from '../../../environments/environment';
import { MouseEvent, LatLngBounds } from '@agm/core';
import { MarkerComponent } from '../../component/marker/marker.component';
import { UserComponent } from '../component/user/user.component';
@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('chat', { read: ElementRef, static: false }) chat: ElementRef;
  lat: number = 34.68503331;
  lng: number = 138.85154339;
  zoom: number = 12;
  center = { lat: this.lat, lng: this.lng };
  openedWindow: number = 1;
  marker: Marker = MARKER;
  markers: Array<Marker> = [];
  user: User;
  storys = [];
  view: any = {};//viewカウント重複防止
  eval: string;//評価good、bad
  private debounceTimer = null;
  private onDestroy$ = new Subject();
  constructor(private ui: UiService, private api: ApiService, private modal: ModalController, private pop : PopoverController,private route: ActivatedRoute, private title: Title,
    private userService: UserService, private db: AngularFireDatabase, private storedb: AngularFirestore, private store: Store) { }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
      this.user = user;
    });
    this.store.select(state => state.marker).pipe(takeUntil(this.onDestroy$)).subscribe((marker: Marker) => {
      this.markerClick(marker);
    });
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      if (params.id) {
        this.api.get('query', { select: ['*'], table: 'markered', where: { id: params.id } }).then(res => {
          if (res.markers.length) {
            this.marker = res.markers[0];
            this.markerClick(this.marker);
          }
        });
      }
    });
    setTimeout(() => {
      if (!this.marker.id) {
        let markers = this.markers.filter(marker => { return marker.id === 1; });
        if (markers.length) {
          this.markerClick(markers[0]);
        }
      }
    }, 5000)
  }
  onBoundsChange(bounds: LatLngBounds) {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.debounceTimer = setTimeout(() => {
      const nlat = bounds.getNorthEast().lat();
      const nlng = bounds.getNorthEast().lng();
      const slat = bounds.getSouthWest().lat();
      const slng = bounds.getSouthWest().lng();      
      this.center.lat = bounds.getCenter().lat();
      this.center.lng = bounds.getCenter().lng();
      const lat=this.marker.lat?this.marker.lat:this.center.lat;
      const lng=this.marker.lng?this.marker.lng:this.center.lng;
      this.api.get('map', { nlat: nlat, nlng: nlng, slat: slat, slng: slng,lat:lat,lng:lng }).then(res => {
        this.markers = [];
        for (let i = 0; i < res.markers.length; i++) {
          res.markers[i].len=res.markers[i].len * 111.3194;
          res.markers[i].label = (i + 1).toString();
          this.markers.push(res.markers[i]);
        }
        this.store.update(state => ({ ...state, markers: this.markers }));
        /*if (this.marker.id) {//選択中のマーカーがマップ範囲から外れたら選択解除する。
          let markers = this.markers.filter(marker => { return marker.id === this.marker.id; });
          if (!markers.length) {
            this.marker = MARKER;
            this.storys = [];
            this.title.setTitle(`周辺環境`);
          }
        }*/
      })
      this.openedWindow = null;
    }, 1000);
  }
  createClick() {
    if (this.marker.id) {
      if (this.user.admin || this.marker.user === this.user.id) {
        this.markerRightClick(this.marker);
      } else {
        this.mapRightClick(this.marker.lat, this.marker.lng);
      }
    } else {
      this.mapRightClick(this.center.lat, this.center.lng);
    }
  }
  mouseOver($event: MouseEvent, marker: Marker) {
    this.openedWindow = marker.id;
  }
  async mapRightClick(lat: number, lng: number) {
    const confirm = await this.ui.confirm('マーカー登録', '登録しますか');
    if (confirm) {
      const modal = await this.modal.create({
        component: MarkerComponent, componentProps: {
          prop: {
            marker: { user: this.user.id, id: 0, lat: lat, lng: lng, na: "", txt: "", phone: "", url: "", img: APIURL + 'img/noimg.jpg', simg: APIURL + 'img/noimgs.jpg' }
          }
        }
      })
      return await modal.present().then(() => {
        modal.onDidDismiss().then(event => {
          if (event.data) {
            this.markers.unshift(event.data);
            this.openedWindow = event.data.id;
          }
        });
      });
    }
  }
  markerClick(marker) {
    this.openedWindow = marker.id;
    this.marker = marker;
    this.title.setTitle(`${marker.na}`);
    this.marker.user$ = this.db.object(`user/${marker.user}`).valueChanges();
    if (!(marker.id in this.view) && Number(marker.ack) === 1) {
      this.db.database.ref(`marker/${marker.id}/view`).transaction(val => {
        return (val || 0) + 1;
      });
      this.db.database.ref(`user/${marker.user}/view`).transaction(val => {
        return (val || 0) + 1;
      });
      this.view[marker.id] = "";
    }    //setTimeout(() => { this.onScrollEnd(); }, 3000);     
    if (this.user.id && marker.ack === 1) {
      this.storedb.doc(`marker/${marker.id}/eval/${this.user.id}`).get().toPromise().then(snap => {
        this.eval = snap.exists ? snap.data().id : null;
      });
    } else {
      this.eval = "disabled";
    }
    this.api.get('query', { table: 'story', select: ['*'], where: { typ: "marker", parent: this.marker.id } }).then(async res => {
      let support = null;
      this.storys = await Promise.all(res.storys.map(async story => {
        if (story.rested) {//非公開の記事
          if (support || this.user.id === this.marker.user) {//||this.user.admin
            story.rested = null;
          } else {
            if (support == null && this.user.id) {
              const doc = await this.db.database.ref(`friend/${this.user.id}/${this.marker.user}`).once('value');
              support = doc.val() === "support" ? true : false;
            }
            if (support || new Date(story.rested).getTime() < new Date().getTime()) {
              story.rested = null;
            }
          }
        }
        return story;
      }));
    });
  }
  async markerRightClick(marker) {
    if (this.user.admin || marker.user == this.user.id) {
      delete marker.label;
      const modal = await this.modal.create({
        component: MarkerComponent, componentProps: { prop: { marker: marker } }
      })
      return await modal.present().then(() => {
        modal.onDidDismiss().then(event => {
          if (event.data) {
            for (let i = 0; i < this.markers.length; i++) {
              if (event.data.id === this.markers[i].id) {
                this.markers[i] = event.data;
                this.openedWindow = event.data.id;
                break;
              }
            }
          }
        });
      });
    }
  }
  openWindow(id) {
    this.openedWindow = id;
  }
  isInfoWindowOpen(id) {
    return this.openedWindow == id;
  }
  async popUser(uid) {
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
