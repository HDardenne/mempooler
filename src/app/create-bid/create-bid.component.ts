import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
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
  canAutoReveal = false;
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
      blind: [null, []],
      withReveal: [false, []],
      revealDelay: [
        null,
        [
          this.dependOnValidator(
            () => this.f.withReveal.value,
            Validators.required
          ),
          this.dependOnValidator(
            () => this.f.withReveal.value,
            Validators.min(0)
          )
        ]
      ]
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
        this.lastHeight =
          a[0].result && a[0].result.info ? a[0].result.info.height + 755 : '';
      });

    this.f.withReveal.valueChanges.subscribe(() => {
      this.f.revealDelay.updateValueAndValidity();
    });

    this.walletService.getCapabilities().subscribe(a => {
      this.canAutoReveal = a.prepareReveal;
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
    let bidHex: string;
    let revealHex: string;
    this.walletService
      .createBid(val.passphrase, val.name, val.bid, val.blind, val.withReveal)
      .pipe(
        tap(a => {
          if (a.error) {
            throw new Error(a.error.message);
          }
        }),
        switchMap(txs => {
          const { bid, reveal } = txs;
          coins = bid.inputs.map((a: any) => ({
            index: a.prevout.index,
            txid: a.prevout.hash
          }));
          bidHex = bid.hex;
          if (reveal) {
            revealHex = reveal.hex;
          }
          return this.walletService.lockCoins(coins);
        }),
        switchMap(() => {
          return val.withReveal
            ? this.mempoolerService.scheduleTxs([
                { hexData: bidHex, heightToSend: val.height },
                {
                  hexData: revealHex,
                  heightToSend: this.lastHeight + 1 + val.revealDelay
                }
              ])
            : this.mempoolerService.scheduleTx(bidHex, val.height);
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
            title: 'Schedule BID OK',
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
            title: 'Schedule BID KO',
            detail: err.message
          });
          this.loading = false;
          this.ref.detectChanges();
        }
      );
  }

  dependOnValidator(
    condition: () => boolean,
    validator: ValidatorFn
  ): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const isRequired = this.form && condition();
      // let isEmpty = control.value == null || control.value.length === 0;
      const error = validator(control);
      return isRequired ? validator(control) : null;
    };
  }
}
