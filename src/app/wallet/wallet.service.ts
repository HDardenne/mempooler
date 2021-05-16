import { Injectable, NgZone } from '@angular/core';
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
  private _walletApiKeyChange = new BehaviorSubject('');
  get walletApiKeyChange() {
    return this._walletApiKeyChange as Observable<string>;
  }
  get walletApiKey() {
    return this._walletApiKeyChange.value;
  }

  private _nodeApiKeyChange = new BehaviorSubject('');
  get nodeApiKeyChange() {
    return this._nodeApiKeyChange as Observable<string>;
  }
  get nodeApiKey() {
    return this._nodeApiKeyChange.value;
  }

  private _walletIdChange = new BehaviorSubject('');
  get walletIdChange() {
    return this._walletIdChange as Observable<string>;
  }
  get walletId() {
    return this._walletIdChange.value;
  }

  constructor(private readonly zone: NgZone) {
    electron.ipcRenderer.on(
      WalletEvent.setWalletApiKey + EventType.Response,
      (event: any, walletApiKey: string) => {
        this.zone.run(() => this._walletApiKeyChange.next(walletApiKey));
      }
    );

    electron.ipcRenderer.on(
      WalletEvent.setNodeApiKey + EventType.Response,
      (event: any, nodeApiKey: string) => {
        this.zone.run(() => this._nodeApiKeyChange.next(nodeApiKey));
      }
    );

    electron.ipcRenderer.on(
      WalletEvent.setWalletId + EventType.Response,
      (event: any, newWalletId: string) => {
        this.zone.run(() => this._walletIdChange.next(newWalletId));
      }
    );
  }

  request<T>(event: WalletEvent, reqArg: any): Observable<T> {
    return Utils.request(electron, event, reqArg, this.zone);
  }

  createBid(
    passphrase: string,
    name: string,
    bid: number,
    blind: number,
    withReveal: boolean
  ) {
    const obs = this.request<any>(WalletEvent.createBid, {
      passphrase,
      name,
      bid,
      blind,
      withReveal
    });
    return obs;
  }

  setWalletApiKey(apiKey: string) {
    electron.ipcRenderer.send(
      WalletEvent.setWalletApiKey + EventType.Request,
      apiKey
    );
    return this._walletApiKeyChange.pipe(skip(1), take(1));
  }

  setNodeApiKey(apiKey: string) {
    electron.ipcRenderer.send(
      WalletEvent.setNodeApiKey + EventType.Request,
      apiKey
    );
    return this._nodeApiKeyChange.pipe(skip(1), take(1));
  }

  verifyWalletApiKey(apiKey: string) {
    const obs = this.request<boolean>(WalletEvent.verifyWalletApiKey, apiKey);
    return obs;
  }

  verifyNodeApiKey(apiKey: string) {
    const obs = this.request<boolean>(WalletEvent.verifyNodeApiKey, apiKey);
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

  getCapabilities() {
    const obs = this.request<any>(WalletEvent.getCapabilities, undefined);
    return obs;
  }
}
