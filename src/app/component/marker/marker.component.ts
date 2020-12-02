import { Component, OnInit, Input, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/storage';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { APIURL } from '../../../environments/environment';
@Component({
  selector: 'app-marker',
  templateUrl: './marker.component.html',
  styleUrls: ['./marker.component.scss'],
})
export class MarkerComponent implements OnInit {
  @Input() prop;
  @ViewChild('upImg', { read: ElementRef, static: false }) upImg: ElementRef;//メディアファイル選択 
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  id = new FormControl(0, [Validators.required]);  
  user = new FormControl("", [Validators.required]);
  latlng = new FormControl("", [Validators.required]);
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]);
  txt = new FormControl("", [Validators.minLength(2), Validators.maxLength(500), Validators.required]);
  phone = new FormControl("", [Validators.pattern(/^(([0-9]{2,4}-[0-9]{2,4}-[0-9]{3,4}))$/)]);
  url = new FormControl("", [Validators.pattern(/^https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/)]);
  img = new FormControl("");
  simg = new FormControl("");
  icon = new FormControl(0, [Validators.required]);
  marker={id:0,na:"",txt:"",lat:0,lng:0,url:"",phone:"",user:"",img:"",simg:"",icon:0};
  markerForm = this.builder.group({
    id: this.id, user: this.user, latlng:this.latlng,na: this.na,txt: this.txt, phone: this.phone, url: this.url, 
    img: this.img, simg: this.simg,icon:this.icon,
  });
  undoing: boolean = false;
  imgBlob;
  noimgUrl=APIURL+'img/noimg.jpg';
  eraseable: boolean = false;
  saving: boolean = false;
  icons=[];
  constructor(private api: ApiService, public modal: ModalController, private builder: FormBuilder,
    private storage: AngularFireStorage, private ui: UiService,private router: Router,) { }
  ngOnInit() {   
    this.api.get("query",{select:['id','na','url'],table:'markericon'}).then(res=>{
      this.icons=res.markericons;
      if (this.prop.marker) {
        this.marker=this.prop.marker;
        if(this.marker.icon){
          let icons=this.icons.filter(icon=>{return icon.url===this.marker.icon;});
          this.marker.icon=icons.length?icons[0].id:null;
        }
        this.undo();
      }     
    })  
  }
  undo() {
    const controls = this.markerForm.controls
    for (let key of Object.keys(controls)) {
      if(key!=="lat"&&key!=="lng"){
        controls[key].setValue(this.marker[key]);
      }
    } 
    this.latlng.setValue(`POINT(${this.marker.lng} ${this.marker.lat})`);
    this.markerForm.markAsPristine();
  }
  imgChange(e) {
    if (e.target.files[0].type.match(/image.*/)) {
      this.imgBlob=window.URL.createObjectURL(e.target.files[0]);
    }else{
      this.ui.pop("画像ファイルjpgまたはpngを選択してください。");
    }
  }
  async save() {
    if (this.saving) return;
    this.saving = true;
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
    const imagePut = (id:number,typ:string) => {
      return new Promise<string>(resolve => {
        if (!this.imgBlob) return resolve("");
        let canvas: HTMLCanvasElement = this.canvas.nativeElement;
        let ctx = canvas.getContext('2d');        
        let image = new Image();
          image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const px = typ=='small' ? 160 : 640;
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
              const ref = this.storage.ref(`marker/${id}/${typ}.jpg`);
              await ref.put(blob);
              const url = await ref.getDownloadURL().toPromise();
              return resolve(url);
            }, "image/jpeg")
          }
          image.src = this.imgBlob;
        });
    }  
    let res: any;
    let id = this.id.value;
    if (id) {//更新
      if(this.imgBlob){
        this.simg.setValue(await imagePut(id,'small')); this.img.setValue(await imagePut(id,'medium'));
      }
      res = await this.api.post('query', { table: "marker", update: this.markerForm.value, where: { id: id } });
    } else {//新規      
      let update = { simg: "", img: "" };
      res = await this.api.post('query', { table: "marker", insert: this.markerForm.value });
      id = res.marker.id;
      const simg = await imagePut(id,'small');
      const img = await imagePut(id,'medium');
      update = { simg: simg, img: img };
      res.marker.simg = simg; res.marker.img = img;
      await this.api.post('query', { table: "marker", update: update, where: { id: id } });
    }
    delete res.marker.latlng;    
    this.modal.dismiss({...res.marker,lat:this.marker.lat,lng:this.marker.lng});
  }
  async erase() {
    if (await this.ui.confirm(`削除確認`, `このマーカーを本当に削除しますか？`)) {
      this.modal.dismiss();
      await this.api.post('query', { table: "marker", delete: { id: this.marker.id } });
      this.storage.ref(`marker/${this.marker.id}/small.jpg`).delete();
      this.storage.ref(`marker/${this.marker.id}/medium.jpg`).delete();
    }
  }
  postStory(){
    this.router.navigate(['/post/marker', this.marker.id]);
    this.modal.dismiss();
  }
}
