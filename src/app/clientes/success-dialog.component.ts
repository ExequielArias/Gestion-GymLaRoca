import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-success-dialog',
  template: `
    <div style="padding: 2rem; text-align: center;">
      <h2 style="color: #10b981; margin-bottom: 1rem;">Éxito</h2>
      <p style="margin-bottom: 2rem;">{{ data.message }}</p>
      <button mat-button color="primary" (click)="close()">OK</button>
    </div>
  `
})
export class SuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
