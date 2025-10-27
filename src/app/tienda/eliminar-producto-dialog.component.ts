import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-eliminar-producto-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Eliminar Producto</h2>
    <div mat-dialog-content>
      <p>¿Estás seguro que deseas eliminar este producto?</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="warn" (click)="onDelete()">Eliminar</button>
    </div>
  `
})
export class EliminarProductoDialogComponent {
  constructor(private dialogRef: MatDialogRef<EliminarProductoDialogComponent>) {}

  onCancel() {
    this.dialogRef.close(false);
  }

  onDelete() {
    this.dialogRef.close(true);
  }
}
