import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-error-dialog',
  template: `
    <div style="padding: 2rem; text-align: center;">
      <h2 style="color: #ef4444; margin-bottom: 1rem;">Error</h2>
      <p style="margin-bottom: 2rem;">{{ data.message }}</p>
      <button mat-button color="warn" (click)="close()">Cerrar</button>
    </div>
  `
})
export class ErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
