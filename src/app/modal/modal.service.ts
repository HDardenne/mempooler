import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalData {
  type: 'success' | 'error' | 'warning';
  title: string;
  detail: string;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  modalChanged = new Subject<ModalData | null>();
  constructor() {}

  openModal(data: ModalData) {
    this.modalChanged.next(data);
  }

  closeModal() {
    this.modalChanged.next(null);
  }
}
