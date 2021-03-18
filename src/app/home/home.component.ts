import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
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
  problemTxs: TransactionInfo[] = [];
  sentFilter = false;
  hasWallet = false;
  constructor(
    private mempoolerService: MempoolerService,
    private walletService: WalletService,
    private router: Router,
    private zone: NgZone,
    private cd: ChangeDetectorRef
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
      this.problemTxs = [];
      this.filterTxs();
    });
  }

  filterTxs() {
    this.filteredTxs = this.txs.filter(t => t.isSent === this.sentFilter);
  }

  deleteTx(tx: TransactionInfo) {
    let hex: string;
    let txs: TransactionInfo[];
    this.mempoolerService
      .getTransactionsHex([tx.id])
      .pipe(
        switchMap(data => {
          hex = data[tx.id];
          return this.mempoolerService.deleteTransaction(tx.id);
        }),
        switchMap(res => {
          txs = res.txs;
          return this.walletService.decodeTx([hex]);
        }),
        switchMap(detail => {
          const coins = detail[0].inputs.map((a: any) => ({
            index: a.prevout.index,
            txid: a.prevout.hash
          }));
          return this.walletService.unlockCoins(coins);
        })
      )
      .subscribe(() => {
        this.txs = txs;
        this.problemTxs = [];
        this.filterTxs();
      });
  }

  verifyLocks() {
    const txIds = this.txs.filter(a => !a.isSent).map(a => a.id);
    const hashAndIndex: {
      txid: string;
      index: number;
      localIndex: number;
    }[] = [];
    const problems: {
      txid: string;
      index: number;
      localIndex: number;
    }[] = [];
    this.mempoolerService
      .getTransactionsHex(txIds)
      .pipe(
        switchMap(idToInfo =>
          this.walletService.decodeTx(Object.values(idToInfo))
        ),
        switchMap(decodedTxs => {
          for (let i = 0; i < decodedTxs.length; i++) {
            const t = decodedTxs[i];
            for (const inp of t.result.vin) {
              const item = {
                localIndex: i,
                index: inp.vout,
                txid: inp.txid
              };
              const already = hashAndIndex.find(
                a => a.txid === item.txid && a.index == item.index
              );
              if (already) {
                problems.push(item);
                if (problems.indexOf(already) === -1) {
                  problems.push(already);
                }
              } else {
                hashAndIndex.push(item);
              }
            }
          }
          return this.walletService.getCoins();
        }),
        map(coins => {
          for (const t of hashAndIndex) {
            if (!coins.find(a => a.hash === t.txid && a.index === t.index)) {
              problems.push(t);
            }
          }
        })
      )
      .subscribe(() => {
        const problemIds = problems.map(a => txIds[a.localIndex]);
        this.problemTxs = this.txs.filter(t => problemIds.indexOf(t.id) !== -1);
        this.cd.detectChanges();
        if (problems.length === 0) {
          alert('No problem were found !');
        } else {
          alert(
            'Problems were found :\r\n' +
              this.problemTxs
                .map(
                  a =>
                    `${a.id} ${a.actions
                      .map(a => a.action + ' ' + a.name)
                      .join(',')}`
                )
                .join('\r\n ')
          );
        }
      });
  }

  detailTx(tx: TransactionInfo) {}

  createBid() {
    this.router.navigate(['/create-bid']);
  }

  lockCoins() {
    const toSend = this.txs.filter(a => !a.isSent);
    const txIds = toSend.map(a => a.id);
    if (txIds.length === 0) {
      alert('No coin to lock');
      return;
    }

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
        } else {
          alert('Coins locked successfully');
        }
      });
  }
}
