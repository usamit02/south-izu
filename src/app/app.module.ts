import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { firebaseConfig } from '../environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireFunctionsModule ,REGION} from '@angular/fire/functions';
import { AgmCoreModule } from '@agm/core';
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule,
    AngularFireModule.initializeApp(firebaseConfig), AngularFireAuthModule, AngularFirestoreModule, AngularFireDatabaseModule, AngularFireStorageModule, AngularFireFunctionsModule,
    AgmCoreModule.forRoot({apiKey: 'AIzaSyB4D969VIv64a6rMFtrtX2wpHUhuosD9h0'}),//'AIzaSyDTHLyzh5B37YJPU8esWD0fV0ntvE9QOwI'})*/
   ],
  providers: [
    StatusBar, SplashScreen, { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: REGION, useValue: 'asia-northeast1' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
