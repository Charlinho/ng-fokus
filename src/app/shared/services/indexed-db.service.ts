import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take, switchMap } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';
import { TaskItem } from '../components/task-manager/task-item';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private readonly db$ = new BehaviorSubject<IDBDatabase | null>(null);
  private readonly store = { name: 'tasks', key: 'uuid' };
  private dbReady$ = new BehaviorSubject<boolean>(false);
  private readonly secretKey = 'caad7153-27bf-43b7-896f-8cf21e28d846';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initDB();
    }
  }

  private encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey).toString();
  }

  private decrypt(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  private initDB(): void {
    const request = indexedDB.open('TaskManagerDB', 1);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.store.name)) {
        db.createObjectStore(this.store.name, { keyPath: this.store.key });
      }
    };

    request.onsuccess = (e) => {
      this.db$.next((e.target as IDBOpenDBRequest).result);
      this.dbReady$.next(true);
    };
  }

  private waitForDB(): Observable<boolean> {
    return this.dbReady$.pipe(
      filter(ready => ready),
      take(1)
    );
  }

  private get store$(): IDBObjectStore {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('IndexedDB is only available in browser');
    }
    const db = this.db$.getValue();
    return db?.transaction(this.store.name, 'readwrite').objectStore(this.store.name)
      ?? (() => { throw new Error('DB not initialized') })();
  }

  addTask(task: TaskItem): Observable<TaskItem> {
    return this.waitForDB().pipe(
      switchMap(() => new Observable<TaskItem>(obs => {
        const encryptedTask = {
          uuid: task.uuid,
          encryptedData: this.encrypt({
            ...task
          })
        };

        const req = this.store$.add(encryptedTask);
        req.onsuccess = () => { obs.next(task); obs.complete(); };
        req.onerror = () => obs.error('Add task failed');
      }))
    );
  }

  listAllTasks(): Observable<TaskItem[]> {
    return this.waitForDB().pipe(
      switchMap(() => new Observable<TaskItem[]>(obs => {
        const req = this.store$.getAll();
        req.onsuccess = () => {
          try {
            const decryptedTasks = req.result.map(encryptedTask => {
              const decryptedData = this.decrypt(encryptedTask.encryptedData);
              return {
                ...decryptedData,
                uuid: encryptedTask.uuid
              };
            });
            obs.next(decryptedTasks);
            obs.complete();
          } catch (error) {
            obs.error('Decryption failed');
          }
        };
        req.onerror = () => obs.error('List tasks failed');
      }))
    );
  }
}
