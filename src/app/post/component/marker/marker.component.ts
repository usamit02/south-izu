import { Component, OnChanges, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Marker, MARKER } from '../../../class';
import { Story } from '../story/story.component';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
@Component({
  selector: 'app-marker',
  templateUrl: './marker.component.html',
  styleUrls: ['./marker.component.scss'],
})
export class MarkerComponent implements OnInit, OnChanges {
  @Input() typ: string;
  @Input() parent: number;
  @Input() lat: number;@Input() lng: number;
  @Input() markers: Array<Marker>;
  @Input() story:Story;
  zoom: number = 8;
  center;
  openedWindow: number = 1;
  marker: Marker = MARKER;
  constructor(private api: ApiService, public modal: ModalController,) { }
  ngOnInit() { }
  async ngOnChanges(changes: SimpleChanges) {
    if (changes.story) {
      if(!this.markers.length){
        const res=await this.api.get('query', { select: ['*'], table: 'story_marker', where: { typ: this.typ, parent: this.parent } },"マーカー取得中");
        this.markers = res.story_markers;
      }
      let markers=this.markers.filter(marker=>{return marker.id===this.story.id;});
      if(markers.length) this.marker=markers[0];
    }
    if(changes.lat){
      this.center={lat:this.lat,lng:this.lng};
    }
  }
  markerClick(marker){

  }
  markerRightClick(marker){

  }
  mouseOver(e,marker){

  }
  openWindow(id) {
    this.openedWindow = id;
  }
  isInfoWindowOpen(id) {
    return this.openedWindow == id;
  }
  save(){
    this.modal.dismiss({marker:this.marker,markers:this.markers});
  }
}
