import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TransactionInfo } from '../model/transaction-info';

const electron = (<any>window).require('electron');

@Injectable({
  providedIn: 'root'
})
export class MempoolerService {
  // baseUrl = 'https://hda-hns.herokuapp.com/api/mempooler';
  baseUrl = 'http://localhost:4200/api/mempooler';

  _isLogged = new BehaviorSubject(false);
  get IsLogged() {
    return this._isLogged.value;
  }
  get IsLoggedChange() {
    return this._isLogged as Observable<boolean>;
  }

  constructor(private readonly httpService: HttpClient) {}

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
}
