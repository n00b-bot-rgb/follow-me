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

/**
 * Local replacement for `@awesome-cordova-plugins/emm-app-config`, which was never ported
 * to `@awesome-cordova-plugins`. It talks to the bundled
 * `cordova-plugin-emm-app-config` directly and keeps the same public surface
 * (`getValue`, `registerChangedListener`) so calling code is unchanged.
 *
 * Outside a Cordova container (e.g. `ng serve`, unit tests) it degrades to a
 * no-op that returns `null` values and an Observable that never emits.
 */

import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';

interface EmmAppConfigPlugin {
    getValue(key: string): unknown;

    registerChangedListener(callback: () => void): void;
}

@Injectable({providedIn: 'root'})
export class EmmAppConfig {

    private readonly changed$ = new Subject<void>();
    private listenerRegistered = false;

    private get plugin(): EmmAppConfigPlugin | null {
        const cordova = (window as unknown as { cordova?: { plugins?: Record<string, unknown> } }).cordova;
        const plugin = cordova?.plugins?.['emmAppConfig'];
        return (plugin as EmmAppConfigPlugin) ?? null;
    }

    /** Returns the managed-configuration value for `key`, or null when unavailable. */
    getValue(key: string): any {
        const plugin = this.plugin;
        if (!plugin) {
            return null;
        }
        try {
            const value = plugin.getValue(key);
            return value === undefined ? null : value;
        } catch (error) {
            console.warn(`EmmAppConfig.getValue('${key}') failed`, error);
            return null;
        }
    }

    /** Emits whenever the MDM pushes a new managed configuration. */
    registerChangedListener(): Observable<void> {
        const plugin = this.plugin;
        if (plugin && !this.listenerRegistered) {
            this.listenerRegistered = true;
            try {
                plugin.registerChangedListener(() => this.changed$.next());
            } catch (error) {
                console.warn('EmmAppConfig.registerChangedListener failed', error);
            }
        }
        return this.changed$.asObservable();
    }
}
