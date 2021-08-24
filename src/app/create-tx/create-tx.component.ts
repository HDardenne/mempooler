import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { MempoolerService } from '../mempooler/mempooler.service';
import { ModalService } from '../modal/modal.service';
import { WalletService } from '../wallet/wallet.service';

@Component({
  selector: 'app-create-tx',
  templateUrl: './create-tx.component.html',
  styleUrls: ['./create-tx.component.scss'],
})
export class CreateTxComponent implements OnInit {
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
      hex: ['', [Validators.required]],
      height: [null, [Validators.required]],
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

    const { hex, height } = this.form.value;
    let coins: any[];
    this.walletService
      .decodeTx([hex])
      .pipe(
        switchMap(txs => {
          coins = txs[0].result.vin.map((a: any) => ({
            index: a.vout,
            txid: a.txid,
          }));
          return this.walletService.lockCoins(coins);
        }),
        switchMap(() => {
          return this.mempoolerService.scheduleTx(hex, height);
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
            title: 'Schedule TX OK',
            detail:
              'All good ! The transaction will be broadcasted at height ' +
              height,
          });
          this.form.controls.hex.reset(null);
          this.loading = false;
          this.ref.detectChanges();
        },
        err => {
          if (coins) {
            this.walletService.unlockCoins(coins);
          }
          this.modalService.openModal({
            type: 'error',
            title: 'Schedule TX KO',
            detail: err.message,
          });
          this.loading = false;
          this.ref.detectChanges();
        }
      );
  }
}
