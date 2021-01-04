import { Component, OnChanges, OnInit, Input, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/storage';
import { LatLngBounds } from '@agm/core';
import { Marker, MARKER } from '../../../class';
import { Story } from '../story/story.component';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { APIURL } from '../../../../environments/environment';
@Component({
  selector: 'app-marker',
  templateUrl: './marker.component.html',
  styleUrls: ['./marker.component.scss'],
})
export class MarkerComponent implements OnInit, OnChanges {
  @Input() typ: string;
  @Input() parent: number;
  @Input() lat: number; @Input() lng: number;
  @Input() markers: Array<Marker>;
  @Input() story: Story;
  @ViewChild('upImg', { read: ElementRef, static: false }) upImg: ElementRef;//メディアファイル選択 
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  id = new FormControl(null, [Validators.required]);
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]);
  txt = new FormControl("", [Validators.minLength(2), Validators.maxLength(500), Validators.required]);
  img = new FormControl("");
  latlng = new FormControl("", [Validators.required]);
  icon = new FormControl(0, [Validators.required]);
  markerForm = this.builder.group({
    id: this.id, na: this.na, txt: this.txt, img: this.img, latlng: this.latlng, icon: this.icon,
  });
  center = { lat: null, lng: null };
  openedWindow: number = 1;
  marker: Marker = MARKER;
  icons = [];
  imgBlob;
  noimgUrl = APIURL + 'img/noimg.jpg';
  saving = false;
  constructor(private api: ApiService, public modal: ModalController, private builder: FormBuilder, private ui: UiService,
    private storage: AngularFireStorage,) { }
  ngOnInit() {
    this.api.get("query", { select: ['id', 'na', 'url'], table: 'markericon' }).then(res => {
      this.icons = res.markericons;
    });
  }
  async ngOnChanges(changes: SimpleChanges) {
    if (changes.story) {
      this.id.setValue(this.story.id);
      if (!this.markers.length) {
        const res = await this.api.get('query', { select: ['*'], table: 'story_marker', where: { typ: this.typ, parent: this.parent } }, "マーカー取得中");
        this.markers = res.story_markers;
      }
      let markers = this.markers.filter(marker => { return marker.id === this.story.id; });
      if (markers.length) {
        this.marker = markers[0];
      } else {
        this.marker = { id: this.story.id, na: "", txt: this.story.txt, img: "", icon: 0, lat: this.story.lat, lng: this.story.lng };
      }
      this.undo();
    }
    if (changes.lat) {
      this.center = { lat: this.lat, lng: this.lng };
    }
  }
  onBoundsChange(bounds: LatLngBounds) {
    this.center.lat = bounds.getCenter().lat();
    this.center.lng = bounds.getCenter().lng();
  }
  markerClick(marker) {

  }
  markerRightClick(marker) {

  }
  mouseOver(e, marker) {

  }
  openWindow(id) {
    this.openedWindow = id;
  }
  isInfoWindowOpen(id) {
    return this.openedWindow == id;
  }
  undo() {
    const controls = this.markerForm.controls
    for (let key of Object.keys(controls)) {
      if (key !== "lat" && key !== "lng") {
        controls[key].setValue(this.marker[key]);
      }
    }
    this.latlng.setValue(`POINT(${this.marker.lng} ${this.marker.lat})`);
    this.lat = this.marker.lat; this.lng = this.marker.lng;
    this.markerForm.markAsPristine();
  }
  imgChange(e) {
    if (e.target.files[0].type.match(/image.*/)) {
      this.imgBlob = window.URL.createObjectURL(e.target.files[0]);
    } else {
      this.ui.pop("画像ファイルjpgまたはpngを選択してください。");
    }
  }
  async save() {
    this.ui.loading('保存中');
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
    const imagePut = (id: number) => {
      return new Promise<string>(resolve => {
        if (!this.imgBlob) return resolve("");
        let canvas: HTMLCanvasElement = this.canvas.nativeElement;
        let ctx = canvas.getContext('2d');
        let image = new Image();
        image.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const px = 160;//typ == 'small' ? 160 : 640;
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
            const ref = this.storage.ref(`story_marker/${id}.jpg`);
            await ref.put(blob);
            const url = await ref.getDownloadURL().toPromise();
            return resolve(url);
          }, "image/jpeg")
        }
        image.src = this.imgBlob;
      });
    }
    if (this.imgBlob) { this.img.setValue(await imagePut(this.marker.id)); }
    this.api.post('query', { table: "story_marker", insert: this.markerForm.value, dupulicate: ['na', 'txt', 'img', 'latlng', 'icon'] }).then(res => {
      let insert = true;
      this.markers.map(marker => {
        if (this.marker.id === marker.id) {
          marker = this.marker;
          insert = false;
        }
        return marker;
      });
      if (insert) this.markers.push(this.marker);
      this.modal.dismiss({ markers: this.markers });
    }).catch(err => {
      this.ui.alert('保存できませんでした。');
    }).finally(() => { this.ui.loadend(); });
  }
}
