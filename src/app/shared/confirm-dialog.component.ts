import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="p-6">
      <h2 class="text-lg font-bold mb-4">{{ data.title || 'Confirmar' }}</h2>
      <p class="mb-6">{{ data.message }}</p>
      <div class="flex justify-end gap-2">
        <button mat-button (click)="onCancel()">{{ data.cancelLabel || 'Cancelar' }}</button>
        <button mat-flat-button color="primary" (click)="onConfirm()">{{ data.confirmLabel || 'Aceptar' }}</button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title?: string; message: string; confirmLabel?: string; cancelLabel?: string }
  ) {}

  onConfirm() {
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
