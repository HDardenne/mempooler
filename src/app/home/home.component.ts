import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MempoolerService } from '../mempooler/mempooler.service';
import { TransactionInfo } from '../model/transaction-info';
import { forkJoin } from 'rxjs';
import { WalletService } from '../wallet/wallet.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ModalService } from '../modal/modal.service';

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
  hasNodeKey = false;
  get hasFullAccess() {
    return this.hasWallet && this.hasNodeKey;
  }
  loading = false;

  constructor(
    private mempoolerService: MempoolerService,
    private walletService: WalletService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.mempoolerService.IsLoggedChange.subscribe(a => {
      this.isLogged = a;
      if (this.isLogged) {
        this.loadTransactions();
      }
    });

    this.walletService.walletIdChange.subscribe(a => {
      this.hasWallet = !!a;
    });

    this.walletService.nodeApiKeyChange.subscribe(a => {
      this.hasNodeKey = !!a;
    });
  }

  loadTransactions() {
    this.loading = true;
    this.mempoolerService.getTransactions().subscribe(res => {
      this.txs = res.txs;
      this.problemTxs = [];
      this.filterTxs();
      this.loading = false;
    });
  }

  filterTxs() {
    this.filteredTxs = this.txs.filter(t => t.isSent === this.sentFilter);
  }

  deleteTx(tx: TransactionInfo) {
    let hex: string;
    let txs: TransactionInfo[];
    this.loading = true;
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
          const coins = detail[0].result.vin.map((a: any) => ({
            index: a.vout,
            txid: a.txid
          }));
          return this.walletService.unlockCoins(coins);
        })
      )
      .subscribe(
        () => {
          this.txs = txs;
          this.problemTxs = [];
          this.filterTxs();
          this.loading = false;
        },
        err => {
          this.loading = false;
        }
      );
  }

  verifyLocks() {
    const txIds = this.txs.filter(a => !a.isSent).map(a => a.id);
    if (txIds.length === 0) {
      this.modalService.openModal({
        type: 'error',
        title: 'Verify coins KO',
        detail: 'No transaction to verify'
      });
      return;
    }

    this.loading = true;
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

    let decodedTxs: any[];
    this.mempoolerService
      .getTransactionsHex(txIds)
      .pipe(
        switchMap(idToInfo =>
          this.walletService.decodeTx(Object.values(idToInfo))
        ),
        switchMap(decodedTxsReceived => {
          decodedTxs = decodedTxsReceived;
          return this.walletService.getCoins();
        }),
        map(coins => {
          for (let i = 0; i < decodedTxs.length; i++) {
            const t = decodedTxs[i];
            let hasError = false;
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
                hasError = true;
                problems.push(item);
                if (problems.indexOf(already) === -1) {
                  problems.push(already);
                }
              } else if (
                !coins.find(a => a.hash === item.txid && a.index === item.index)
              ) {
                hasError = true;
                problems.push(item);
              } else {
                hashAndIndex.push(item);
              }
            }
            if (!hasError) {
              for (const inp of t.result.vout) {
                const item = {
                  index: inp.n,
                  hash: t.result.txid
                };
                coins.push(item);
              }
            }
          }
        })
      )
      .subscribe(
        () => {
          this.loading = false;
          const problemIds = problems.map(a => txIds[a.localIndex]);
          this.problemTxs = this.txs.filter(
            t => problemIds.indexOf(t.id) !== -1
          );
          if (problems.length === 0) {
            this.modalService.openModal({
              type: 'success',
              title: 'Verify coins OK',
              detail: 'No problem found'
            });
          } else {
            this.modalService.openModal({
              type: 'error',
              title: 'Verify coins KO',
              detail:
                'Problems found :\r\n' +
                this.problemTxs
                  .map(
                    a =>
                      `- ${a.id} ${a.actions
                        .map(a => a.action + ' ' + a.name)
                        .join(',')}`
                  )
                  .join('\r\n ')
            });
          }
        },
        err => {
          this.loading = false;
          this.modalService.openModal({
            type: 'error',
            title: 'Verify coins KO',
            detail: 'something went wrong'
          });
        }
      );
  }

  detailTx(tx: TransactionInfo) {}

  createBid() {
    this.router.navigate(['/create-bid']);
  }

  lockCoins() {
    const toSend = this.txs.filter(a => !a.isSent);
    const txIds = toSend.map(a => a.id);
    if (txIds.length === 0) {
      this.modalService.openModal({
        type: 'error',
        title: 'Lock coins KO',
        detail: 'No coin to lock'
      });
      return;
    }

    this.loading = true;
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
        }),
        tap(locks => {
          if (locks.some(a => !a)) {
            throw new Error('Something went wrong');
          }
        })
      )
      .subscribe(
        locks => {
          this.loading = false;
          this.modalService.openModal({
            type: 'success',
            title: 'Lock coins OK',
            detail: 'Coins locked successfully'
          });
        },
        err => {
          this.loading = false;
          this.modalService.openModal({
            type: 'error',
            title: 'Lock coins KO',
            detail: 'Something went wrong'
          });
        }
      );
  }
}
