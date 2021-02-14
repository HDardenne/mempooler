import { Component, NgZone, OnInit } from '@angular/core';
import { MempoolerService } from '../mempooler/mempooler.service';
import { TransactionInfo } from '../model/transaction-info';
import { forkJoin } from 'rxjs';
import { WalletService } from '../wallet/wallet.service';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  isLogged = false;
  txs: TransactionInfo[] = [];
  filteredTxs: TransactionInfo[] = [];
  sentFilter = false;
  hasWallet = false;
  constructor(
    private mempoolerService: MempoolerService,
    private walletService: WalletService,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.mempoolerService.IsLoggedChange.subscribe(a => {
      this.zone.run(() => {
        this.isLogged = a;
        if (this.isLogged) {
          this.loadTransactions();
        }
      });
    });

    this.walletService.walletIdChange.subscribe(a => {
      this.zone.run(() => {
        this.hasWallet = !!a;
      });
    });
  }

  loadTransactions() {
    this.mempoolerService.getTransactions().subscribe(res => {
      this.txs = res.txs;
      this.filterTxs();
    });
  }

  filterTxs() {
    this.filteredTxs = this.txs.filter(t => t.isSent === this.sentFilter);
  }

  deleteTx(tx: TransactionInfo) {
    this.mempoolerService.deleteTransaction(tx.id).subscribe(res => {
      this.txs = res.txs;
      this.filterTxs();
    });
  }
  detailTx(tx: TransactionInfo) {}

  createBid() {
    this.router.navigate(['/create-bid']);
  }

  lockCoins() {
    const toSend = this.txs.filter(a => !a.isSent);
    const txIds = toSend.map(a => a.id);
    this.mempoolerService
      .getTransactionsHex(txIds)
      .pipe(
        switchMap(a => this.walletService.decodeTx(Object.values(a))),
        switchMap((a: any[]) => {
          const hexes = a
            .map((t: any) =>
              t.result.vin.map((v: any) => ({ txid: v.txid, index: v.vout }))
            )
            .reduce((prev, cur) => prev.concat(cur), []) as any[];
          return forkJoin(this.walletService.lockCoins(hexes));
        })
      )
      .subscribe(locks => {
        let error = '';
        if (locks.some(a => !a)) {
          error = 'Something went wrong';
        }
      });
  }
}
