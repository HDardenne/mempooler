import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  SettingEvent,
  SettingEventResponse
} from 'electron/settings/settings.event';
import { BehaviorSubject, Observable } from 'rxjs';
import { skip, take, tap } from 'rxjs/operators';
import { TransactionInfo } from '../model/transaction-info';

const electron = (<any>window).require('electron');

@Injectable({
  providedIn: 'root'
})
export class MempoolerService {
  _baseUrlChange = new BehaviorSubject<string>('');
  get baseUrlChange() {
    return this._baseUrlChange as Observable<string>;
  }
  get baseUrl() {
    return this._baseUrlChange.value;
  }

  _isLogged = new BehaviorSubject(false);
  get IsLogged() {
    return this._isLogged.value;
  }
  get IsLoggedChange() {
    return this._isLogged as Observable<boolean>;
  }

  constructor(private readonly httpService: HttpClient) {
    electron.ipcRenderer.on(
      SettingEventResponse.setSetting,
      (event: any, data: { key: string; value: any }) => {
        if (data.key === 'mempoolerUrl') {
          this._baseUrlChange.next(data.value);
        }
      }
    );
  }

  init() {
    return this.getBaseUrl()
      .pipe(
        tap(a => {
          this._baseUrlChange.next(a);
        })
      )
      .toPromise();
  }

  getHasAccess() {
    return this.httpService.get(`${this.baseUrl}/has-access`).pipe(
      tap((a: any) => {
        if (!a.hasAccess) {
          throw 'Login failed !';
        }
      })
    );
  }

  getTransactions() {
    return this.httpService.get<{ txs: TransactionInfo[] }>(
      `${this.baseUrl}/transactions`
    );
  }

  getTransactionsHex(txIds: string[]) {
    return this.httpService.get<{ [id: string]: string }>(
      `${this.baseUrl}/transactions/raw`,
      { params: { ids: txIds } }
    );
  }

  deleteTransaction(id: string) {
    return this.httpService.delete<any>(`${this.baseUrl}/transactions/${id}`);
  }

  setIsLogged(isLogged: boolean) {
    if (this._isLogged.value == isLogged) {
      return;
    }

    this._isLogged.next(isLogged);
  }

  scheduleTx(hex: string, height: number) {
    return this.httpService.post<any>(`${this.baseUrl}/add-to-mempool`, {
      heightToSend: height,
      hexData: hex
    });
  }

  getBaseUrl() {
    electron.ipcRenderer.send(SettingEvent.getSetting, 'mempoolerUrl');
    return new Observable<string>(s => {
      electron.ipcRenderer.once(
        SettingEventResponse.getSetting,
        (event: any, data: string) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }

  setBaseUrl(url: string) {
    electron.ipcRenderer.send(SettingEvent.setSetting, {
      key: 'mempoolerUrl',
      value: url
    });
    return this._baseUrlChange.pipe(skip(1), take(1));
  }
}
