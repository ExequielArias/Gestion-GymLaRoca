import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-producto-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Detalles del Producto</h2>
    <div mat-dialog-content>
      <div class="mb-4">
        <strong>Nombre:</strong> {{ data.name }}
      </div>
      <div class="mb-4">
        <strong>Descripción:</strong> {{ data.description }}
      </div>
      <div class="mb-4">
        <strong>Precio:</strong> {{ data.price }}
      </div>
      <div class="mb-4">
        <strong>Etiqueta:</strong> {{ data.badge }}
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Cerrar</button>
    </div>
  `
})
export class ProductoDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
