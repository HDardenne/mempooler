import { Injectable } from '@angular/core';
import { WalletEvent, WalletEventResponse } from 'electron/wallet/wallet.event';

import { BehaviorSubject, Observable } from 'rxjs';
import { skip, take } from 'rxjs/operators';

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
      WalletEventResponse.setApiKey,
      (event: any, newWalletId: string) => {
        this._apiKeyChange.next(newWalletId);
      }
    );

    electron.ipcRenderer.on(
      WalletEventResponse.setWalletId,
      (event: any, newWalletId: string) => {
        this._walletIdChange.next(newWalletId);
      }
    );
  }

  createBid(passphrase: string, name: string, bid: number, blind: number) {
    electron.ipcRenderer.send(WalletEvent.createBid, {
      passphrase,
      name,
      bid,
      blind
    });
    return new Observable<any>(s => {
      electron.ipcRenderer.once(
        WalletEventResponse.createBid,
        (event: any, data: any) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }

  setApiKey(apiKey: string) {
    electron.ipcRenderer.send(WalletEvent.setApiKey, apiKey);
    return this._apiKeyChange.pipe(skip(1), take(1));
  }

  verifyApiKey(apiKey: string) {
    electron.ipcRenderer.send(WalletEvent.verifyApiKey, apiKey);
    return new Observable<boolean>(s => {
      electron.ipcRenderer.once(
        WalletEventResponse.verifyApiKey,
        (event: any, data: boolean) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }

  setWalletId(walletId: string) {
    electron.ipcRenderer.send(WalletEvent.setWalletId, walletId);
    return this._walletIdChange.pipe(skip(1), take(1));
  }

  getWallets() {
    electron.ipcRenderer.send(WalletEvent.getWallets);
    return new Observable<string[]>(s => {
      electron.ipcRenderer.once(
        WalletEventResponse.getWallets,
        (event: any, data: string[]) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }

  decodeTx(hexes: string[]) {
    electron.ipcRenderer.send(WalletEvent.decodeTx, hexes);
    return new Observable<any[]>(s => {
      electron.ipcRenderer.once(
        WalletEventResponse.decodeTx,
        (event: any, data: any[]) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }

  getNamesInfo(names: string[]) {
    electron.ipcRenderer.send(WalletEvent.getNamesInfo, names);
    return new Observable<any[]>(s => {
      electron.ipcRenderer.once(
        WalletEventResponse.getNamesInfo,
        (event: any, data: any[]) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }

  lockCoins(txs: { txid: any; index: any }[]): any {
    electron.ipcRenderer.send(WalletEvent.lockCoins, txs);
    return new Observable<any>(s => {
      electron.ipcRenderer.once(
        WalletEventResponse.lockCoins,
        (event: any, data: boolean[]) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }

  unlockCoins(txs: { txid: any; index: any }[]): any {
    electron.ipcRenderer.send(WalletEvent.unlockCoins, txs);
    return new Observable<any>(s => {
      electron.ipcRenderer.once(
        WalletEventResponse.unlockCoins,
        (event: any, data: boolean[]) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }

  getCoins() {
    electron.ipcRenderer.send(WalletEvent.getCoins);
    return new Observable<any[]>(s => {
      electron.ipcRenderer.once(
        WalletEventResponse.getCoins,
        (event: any, data: any[]) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }
}
