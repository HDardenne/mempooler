import { Injectable } from '@angular/core';
import { EventType } from 'electron/eventType';
import { WalletEvent } from 'electron/wallet/wallet.event';

import { BehaviorSubject, Observable } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { Utils } from '../utils';

const electron = (<any>window).require('electron');

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private _apiKeyChange = new BehaviorSubject('');
  get apiKeyChange() {
    return this._apiKeyChange as Observable<string>;
  }
  get apiKey() {
    return this._apiKeyChange.value;
  }

  private _walletIdChange = new BehaviorSubject('');
  get walletIdChange() {
    return this._walletIdChange as Observable<string>;
  }
  get walletId() {
    return this._walletIdChange.value;
  }

  constructor() {
    electron.ipcRenderer.on(
      WalletEvent.setApiKey + EventType.Response,
      (event: any, newWalletId: string) => {
        this._apiKeyChange.next(newWalletId);
      }
    );

    electron.ipcRenderer.on(
      WalletEvent.setWalletId + EventType.Response,
      (event: any, newWalletId: string) => {
        this._walletIdChange.next(newWalletId);
      }
    );
  }

  request<T>(event: WalletEvent, reqArg: any): Observable<T> {
    return Utils.request(electron, event, reqArg);
  }

  createBid(passphrase: string, name: string, bid: number, blind: number) {
    const obs = this.request<any>(WalletEvent.createBid, {
      passphrase,
      name,
      bid,
      blind
    });
    return obs;
  }

  setApiKey(apiKey: string) {
    electron.ipcRenderer.send(
      WalletEvent.setApiKey + EventType.Request,
      apiKey
    );
    return this._apiKeyChange.pipe(skip(1), take(1));
  }

  verifyApiKey(apiKey: string) {
    const obs = this.request<boolean>(WalletEvent.verifyApiKey, apiKey);
    return obs;
  }

  setWalletId(walletId: string) {
    electron.ipcRenderer.send(
      WalletEvent.setWalletId + EventType.Request,
      walletId
    );
    return this._walletIdChange.pipe(skip(1), take(1));
  }

  getWallets() {
    const obs = this.request<string[]>(WalletEvent.getWallets, undefined);
    return obs;
  }

  decodeTx(hexes: string[]) {
    const obs = this.request<any[]>(WalletEvent.decodeTx, hexes);
    return obs;
  }

  getNamesInfo(names: string[]) {
    const obs = this.request<any[]>(WalletEvent.getNamesInfo, names);
    return obs;
  }

  lockCoins(txs: { txid: any; index: any }[]) {
    const obs = this.request<boolean[]>(WalletEvent.lockCoins, txs);
    return obs;
  }

  unlockCoins(txs: { txid: any; index: any }[]) {
    const obs = this.request<boolean[]>(WalletEvent.unlockCoins, txs);
    return obs;
  }

  getCoins() {
    const obs = this.request<any[]>(WalletEvent.getCoins, undefined);
    return obs;
  }
}
