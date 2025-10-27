import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-agregar-producto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Agregar Producto</h2>
    <div mat-dialog-content>
      <form #form="ngForm">
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Nombre</mat-label>
          <input matInput [(ngModel)]="name" name="name" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Descripción</mat-label>
          <input matInput [(ngModel)]="description" name="description" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Precio</mat-label>
          <input matInput [(ngModel)]="price" name="price" required type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Etiqueta</mat-label>
          <input matInput [(ngModel)]="badge" name="badge">
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="!name || !description || !price">Agregar</button>
    </div>
  `
})
export class AgregarProductoDialogComponent {
  name = '';
  description = '';
  price: number | null = null;
  badge = '';

  constructor(private dialogRef: MatDialogRef<AgregarProductoDialogComponent>) {}

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close({ name: this.name, description: this.description, price: this.price, badge: this.badge });
  }
}
