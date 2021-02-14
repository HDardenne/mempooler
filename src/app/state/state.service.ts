import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MempoolerService } from '../mempooler/mempooler.service';
import { WalletService } from '../wallet/wallet.service';

const electron = (<any>window).require('electron');

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private _ready = new BehaviorSubject(false);
  get ready() {
    return this._ready as Observable<boolean>;
  }

  constructor(
    private mempoolerService: MempoolerService,
    private walletService: WalletService
  ) {
    this.mempoolerService.IsLoggedChange.subscribe(a => {
      this.updateReady();
    });
    this.walletService.apiKeyChange.subscribe(a => {
      this.updateReady();
    });
    this.walletService.walletIdChange.subscribe(a => {
      this.updateReady();
    });
  }

  private updateReady() {
    const newState =
      this.mempoolerService.IsLogged &&
      !!this.walletService.apiKey &&
      !!this.walletService.walletId;
    if (newState === this._ready.value) {
      return;
    }
    this._ready.next(newState);
  }
}
