import { Component, OnChanges, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { Marker } from '../marker/marker.component'
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnChanges {
  @Input() typ: string;
  @Input() parent: number;
  @Input() markers: Array<Marker>;
  @Input() icons: Array<any>;
  //@Output() saved = new EventEmitter();
  lat: number = 34.68503331;
  lng: number = 138.85154339;
  openedWindow: number = 1;
  marker: Marker;
  constructor(private api: ApiService, private ui: UiService,) { }
  ngOnInit() {     
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.parent) {
      this.api.get('query', { select: ['id','latlng','na','txt', 'img', 'icon', 'idx'], table: 'story_marker', where: { typ: this.typ, parent: this.parent } }).then(res => {
        this.markers = res.story_markers;
        if(this.markers.length) {
          this.lat=this.markers[0].lat;this.lng=this.markers[0].lng;
        }
      })
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
}
