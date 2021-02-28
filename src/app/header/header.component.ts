import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { map, switchMap, tap } from 'rxjs/operators';
import { MempoolerService } from '../mempooler/mempooler.service';
import { WalletService } from '../wallet/wallet.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  loginError = '';
  apiKeyError = '';
  authorizationUrl = '';
  needLogin = true;
  needApiKey = true;
  needWalletId = true;
  loadingMempooler = false;
  wallets: string[] = [];
  apiKey = '';
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
    this.walletService.apiKeyChange.subscribe(a => {
      this.apiKey = a;
      this.apiKeyError = '';
      this.needApiKey = !a;
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

  setApiKey() {
    const newApiKey = this.apiKey;
    this.walletService
      .verifyApiKey(newApiKey)
      .pipe(
        switchMap(valid => {
          if (!valid) {
            throw new Error('Wrong API key');
          }
          return this.walletService.setApiKey(this.apiKey);
        }),
        switchMap(() => {
          return this.walletService.getWallets();
        })
      )
      .subscribe(
        w => {
          this.needApiKey = false;
          this.wallets = w;
          this.ref.detectChanges();
        },
        err => {
          this.needApiKey = true;
          this.apiKeyError = 'Wrong API key or hsd not up ?';
          this.ref.detectChanges();
        }
      );
  }

  clearApiKey() {
    this.walletService.setApiKey('').subscribe(a => {
      this.wallets = [];
      this.clearWalletId();
    });
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
