import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  OnInit,
} from '@angular/core';
import { ModalData, ModalService } from './modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements OnInit {
  modalData: ModalData | null = null;

  constructor(
    private readonly service: ModalService,
    private readonly cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.service.modalChanged.subscribe(data => {
      this.modalData = data;
      this.cd.detectChanges();
    });
  }

  close() {
    this.service.closeModal();
  }
}
