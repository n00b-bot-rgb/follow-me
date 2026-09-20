/*
 * FollowMe
 *
 * Copyright (C) 2020 République et canton de Genève
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { enableProdMode, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';


import { environment } from './environments/environment';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';
import { SplashScreen } from '@awesome-cordova-plugins/splash-screen/ngx';
import { DeviceOrientation } from '@awesome-cordova-plugins/device-orientation/ngx';
import { BackgroundGeolocation } from '@awesome-cordova-plugins/background-geolocation/ngx';
import { BatteryStatus } from '@awesome-cordova-plugins/battery-status/ngx';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { EmmAppConfig } from './app/native/emm-app-config.service';
import { DatePipe } from '@angular/common';
import { LogProvider } from './app/native/file-logger.service';
import { AppStorage } from './app/core/app-storage.service';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy, IonicModule } from '@ionic/angular';
import { SettingsService } from './app/services/settings/settings.service';
import { ApiService } from './app/services/api/api.service';
import { BufferService } from './app/services/buffer/buffer.service';
import { LogsService } from './app/services/logs/logs.service';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, IonicModule.forRoot(), IonicStorageModule.forRoot({
            name: 'followme',
            driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
        }), AppRoutingModule),
        provideZoneChangeDetection({ eventCoalescing: true }),
        File,
        StatusBar,
        SplashScreen,
        DeviceOrientation,
        BackgroundGeolocation,
        BatteryStatus,
        AppVersion,
        Device,
        HTTP,
        EmmAppConfig,
        DatePipe,
        LogProvider,
        AppStorage,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        SettingsService,
        ApiService,
        BufferService,
        LogsService,
        { provide: Window, useValue: window }
    ]
})
  .catch(err => console.log(err));
