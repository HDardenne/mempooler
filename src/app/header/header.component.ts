import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { map, switchMap, tap } from 'rxjs/operators';
import { MempoolerService } from '../mempooler/mempooler.service';
import { WalletService } from '../wallet/wallet.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  loginError = '';
  walletApiKeyError = '';
  nodeApiKeyError = '';
  authorizationUrl = '';
  needLogin = true;
  needWalletApiKey = true;
  needNodeApiKey = true;
  needWalletId = true;
  loadingMempooler = false;
  wallets: string[] = [];
  walletApiKey = '';
  nodeApiKey = '';
  walletId = '';

  constructor(
    private readonly httpService: HttpClient,
    private readonly mempoolerService: MempoolerService,
    private readonly walletService: WalletService,
    private ref: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.mempoolerService.baseUrl) {
      this.isLogged();
    }
    this.walletService.walletApiKeyChange.subscribe(a => {
      this.walletApiKey = a;
      this.walletApiKeyError = '';
      this.needWalletApiKey = !a;
      this.ref.detectChanges();
    });
    this.walletService.nodeApiKeyChange.subscribe(a => {
      this.nodeApiKey = a;
      this.nodeApiKeyError = '';
      this.needNodeApiKey = !a;
      this.ref.detectChanges();
    });
    this.walletService.walletIdChange.subscribe(a => {
      this.walletId = a;
      this.needWalletId = !a;
      this.ref.detectChanges();
    });
    this.mempoolerService.IsLoggedChange.subscribe(a => {
      this.needLogin = !a;
      this.ref.detectChanges();
    });
  }

  setWalletApiKey() {
    const newApiKey = this.walletApiKey;
    this.walletService
      .verifyWalletApiKey(newApiKey)
      .pipe(
        switchMap(valid => {
          if (!valid) {
            throw new Error('Wrong API key');
          }
          return this.walletService.setWalletApiKey(this.walletApiKey);
        }),
        switchMap(() => {
          return this.walletService.getWallets();
        })
      )
      .subscribe(
        w => {
          this.needWalletApiKey = false;
          this.wallets = w;
          this.ref.detectChanges();
        },
        err => {
          this.needWalletApiKey = true;
          this.walletApiKeyError = 'Wrong API key or hsd not up ?';
          this.ref.detectChanges();
        }
      );
  }

  setNodeApiKey() {
    const newApiKey = this.nodeApiKey;
    this.walletService
      .verifyNodeApiKey(newApiKey)
      .pipe(
        switchMap(valid => {
          if (!valid) {
            throw new Error('Wrong API key');
          }
          return this.walletService.setNodeApiKey(this.nodeApiKey);
        })
      )
      .subscribe(
        w => {
          this.needNodeApiKey = false;
          this.ref.detectChanges();
        },
        err => {
          this.needNodeApiKey = true;
          this.nodeApiKeyError = 'Wrong API key or hsd not up ?';
          this.ref.detectChanges();
        }
      );
  }

  clearWalletApiKey() {
    this.walletService.setWalletApiKey('').subscribe(a => {
      this.wallets = [];
      this.clearWalletId();
    });
  }

  clearNodeApiKey() {
    this.walletService.setNodeApiKey('').subscribe(a => {});
  }

  setWalletId() {
    this.walletService.setWalletId(this.walletId).subscribe();
  }
  clearWalletId() {
    this.walletService.setWalletId('').subscribe();
  }

  isLogged(logError: boolean = false) {
    this.loginError = '';
    this.loadingMempooler = true;
    this.mempoolerService
      .getHasAccess()
      .pipe(
        tap((a: any) => {
          if (!a.hasAccess) {
            throw new Error('Login failed !');
          }
        })
      )
      .subscribe(
        a => {
          if (logError) {
            this.loginError = '';
          }
          this.loadingMempooler = false;
          this.mempoolerService.setIsLogged(true);
        },
        err => {
          this.loadingMempooler = false;
          this.mempoolerService.setIsLogged(false);
          if (logError) {
            // todo : à revoir pour avoir la vrai valeur car la ça fait de la merde
            this.loginError =
              typeof err.error === 'string'
                ? err.message
                : 'Something went wrong';
          }
        }
      );
  }

  login() {
    this.loginError = '';
    this.loadingMempooler = true;
    this.httpService
      .get(this.authorizationUrl, { responseType: 'blob', observe: 'response' })
      .pipe(
        switchMap(a => {
          const key = '/api/mempooler';
          const baseUrl = this.authorizationUrl.substring(
            0,
            this.authorizationUrl.indexOf(key) + key.length
          );
          return this.mempoolerService.setBaseUrl(baseUrl);
        })
      )
      .subscribe(a => {
        return this.isLogged();
      });
  }

  logout() {
    this.mempoolerService
      .setBaseUrl('')
      .pipe(
        map(() => {
          this.mempoolerService.setIsLogged(false);
        })
      )
      .subscribe();
  }
}
