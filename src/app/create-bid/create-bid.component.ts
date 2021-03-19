import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  debounceTime,
  distinct,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { MempoolerService } from '../mempooler/mempooler.service';
import { ModalService } from '../modal/modal.service';
import { WalletService } from '../wallet/wallet.service';

@Component({
  selector: 'app-create-bid',
  templateUrl: './create-bid.component.html',
  styleUrls: ['./create-bid.component.scss']
})
export class CreateBidComponent implements OnInit {
  loading = false;
  form: FormGroup = null as any;
  get f() {
    return this.form!.controls;
  }

  lastHeight = '';
  constructor(
    private mempoolerService: MempoolerService,
    private walletService: WalletService,
    private router: Router,
    private fb: FormBuilder,
    private ref: ChangeDetectorRef,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      passphrase: ['', [Validators.required]],
      name: ['', [Validators.required]],
      height: [null, [Validators.required]],
      bid: [null, [Validators.required]],
      blind: [null, []]
    });

    this.f.name.valueChanges
      .pipe(
        distinctUntilChanged(),
        tap(a => {
          this.lastHeight = 'Loading';
        }),
        debounceTime(500),
        switchMap(a => {
          if (!a) {
            return of([{ result: { info: null } }]);
          }
          return this.walletService
            .getNamesInfo([a])
            .pipe(takeUntil(this.f.name.valueChanges));
        })
      )
      .subscribe(a => {
        this.lastHeight = a[0].result.info ? a[0].result.info.height + 755 : '';
        this.ref.detectChanges();
      });
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;

    const val = this.form.value;
    if (!val.blind) {
      val.blind = 0;
    }

    let coins: any[];
    let hex: string;
    this.walletService
      .createBid(val.passphrase, val.name, val.bid, val.blind)
      .pipe(
        tap(a => {
          if (a.error) {
            throw new Error(a.error.message);
          }
        }),
        switchMap(a => {
          coins = a.inputs.map((a: any) => ({
            index: a.prevout.index,
            txid: a.prevout.hash
          }));
          hex = a.hex;
          return this.walletService.lockCoins(coins);
        }),
        switchMap(a => {
          return this.mempoolerService.scheduleTx(hex, val.height);
        }),
        tap((a: any) => {
          if (a.err) {
            throw new Error(a.err);
          }
        })
      )
      .subscribe(
        res => {
          this.modalService.openModal({
            type: 'success',
            title: 'Create BID OK',
            detail:
              'All good ! The transaction will be broadcasted at height ' +
              val.height
          });
          this.form.controls.bid.reset(null);
          this.form.controls.blind.reset(null);
          this.form.controls.name.reset('');
          this.loading = false;
          this.ref.detectChanges();
        },
        err => {
          if (coins) {
            this.walletService.unlockCoins(coins);
          }
          this.modalService.openModal({
            type: 'error',
            title: 'Create BID KO',
            detail: err.message
          });
          this.loading = false;
          this.ref.detectChanges();
        }
      );
  }
}
