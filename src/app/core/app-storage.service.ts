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
 * `@ionic/storage` v2 opened its database implicitly; `@ionic/storage-angular`
 * v4 requires an explicit `create()` before any read or write. This wrapper
 * performs that handshake exactly once, lazily, and exposes the same
 * `get`/`set`/`remove` surface the services already used — so no caller has to
 * care about driver readiness or ordering.
 */

import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage-angular';

@Injectable({providedIn: 'root'})
export class AppStorage {

    private ready: Promise<Storage> | null = null;

    constructor(private readonly storage: Storage) {
    }

    private open(): Promise<Storage> {
        if (!this.ready) {
            this.ready = this.storage.create();
        }
        return this.ready;
    }

    async get<T = any>(key: string): Promise<T | null> {
        const storage = await this.open();
        return storage.get(key);
    }

    async set<T = any>(key: string, value: T): Promise<T> {
        const storage = await this.open();
        return storage.set(key, value);
    }

    async remove(key: string): Promise<void> {
        const storage = await this.open();
        await storage.remove(key);
    }
}
