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
 * Local replacement for `ionic-log-file-appender`, which is pinned to
 * Ionic 3 / Angular 5 / RxJS 5 and cannot be installed alongside Angular 20.
 *
 * It keeps the `LogProvider` name and the `init()` / `log()` / `getLogFiles()`
 * surface the app already used, and writes rotating daily log files through
 * `@awesome-cordova-plugins/file`. In the browser it falls back to `console`
 * plus an in-memory ring buffer, so `ng serve` and unit tests work unchanged.
 */

import {Injectable} from '@angular/core';
import {File} from '@awesome-cordova-plugins/file/ngx';

export interface LogProviderConfig {
    /** Directory name under the app's data directory. Default: `logs`. */
    logDir?: string;
    /** Days of history to keep. Default: 3. */
    retentionDays?: number;
    /** Also mirror every entry to the console. Default: true. */
    console?: boolean;
}

const MEMORY_LIMIT = 2000;

@Injectable({providedIn: 'root'})
export class LogProvider {

    private config: Required<LogProviderConfig> = {logDir: 'logs', retentionDays: 3, console: true};
    private readonly memory: string[] = [];
    private rootDir: string | null = null;
    private writeQueue: Promise<void> = Promise.resolve();

    constructor(private readonly file: File) {
    }

    /** Prepares the log directory. Safe to call outside Cordova. */
    async init(config: LogProviderConfig = {}): Promise<void> {
        this.config = {...this.config, ...config};
        const base = this.file.dataDirectory;
        if (!base) {
            return;
        }
        try {
            await this.file.createDir(base, this.config.logDir, false).catch(() => undefined);
            this.rootDir = base;
            await this.pruneOldLogs();
        } catch (error) {
            console.warn('LogProvider.init failed; falling back to console logging', error);
            this.rootDir = null;
        }
    }

    /** Appends one timestamped line to today's log file. */
    log(content: string): void {
        const line = `${new Date().toISOString()} ${content}`;
        if (this.config.console) {
            console.log(line);
        }
        this.memory.push(line);
        if (this.memory.length > MEMORY_LIMIT) {
            this.memory.shift();
        }
        if (!this.rootDir) {
            return;
        }
        // Serialise writes so concurrent log() calls cannot interleave.
        this.writeQueue = this.writeQueue
            .then(() => this.append(line))
            .catch(error => console.warn('LogProvider write failed', error));
    }

    /** Most recent in-memory lines, newest last. */
    getRecentLines(): string[] {
        return [...this.memory];
    }

    /** Names of the log files currently on disk. */
    async getLogFiles(): Promise<string[]> {
        if (!this.rootDir) {
            return [];
        }
        const entries = await this.file.listDir(this.rootDir, this.config.logDir);
        return entries.filter(e => e.isFile).map(e => e.name).sort();
    }

    private async append(line: string): Promise<void> {
        const dir = `${this.rootDir}${this.config.logDir}`;
        const name = this.fileNameFor(new Date());
        try {
            await this.file.writeFile(dir, name, `${line}\n`, {append: true, replace: false});
        } catch {
            await this.file.writeFile(dir, name, `${line}\n`, {replace: true});
        }
    }

    private fileNameFor(date: Date): string {
        return `followme-${date.toISOString().slice(0, 10)}.log`;
    }

    private async pruneOldLogs(): Promise<void> {
        const keep = new Set<string>();
        for (let i = 0; i < this.config.retentionDays; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            keep.add(this.fileNameFor(d));
        }
        const files = await this.getLogFiles();
        for (const name of files) {
            if (!keep.has(name)) {
                await this.file.removeFile(`${this.rootDir}${this.config.logDir}`, name).catch(() => undefined);
            }
        }
    }
}
