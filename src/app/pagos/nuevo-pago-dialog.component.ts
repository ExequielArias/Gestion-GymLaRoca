import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-nuevo-pago-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Nuevo Pago</h2>
    <div mat-dialog-content>
      <form #form="ngForm">
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Cliente</mat-label>
          <input matInput [(ngModel)]="cliente" name="cliente" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Producto/Servicio</mat-label>
          <input matInput [(ngModel)]="producto" name="producto" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Monto</mat-label>
          <input matInput [(ngModel)]="monto" name="monto" required type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Método de Pago</mat-label>
          <input matInput [(ngModel)]="metodo" name="metodo" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Alias</mat-label>
          <input matInput [(ngModel)]="alias" name="alias">
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>CBU/CVU</mat-label>
          <input matInput [(ngModel)]="cbu" name="cbu">
        </mat-form-field>
        <div class="mb-4">
          <label class="block mb-2 font-medium">Código QR</label>
          <input type="text" [(ngModel)]="qr" name="qr" class="w-full border rounded px-3 py-2">
        </div>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="!cliente || !producto || !monto || !metodo">Registrar</button>
    </div>
  `
})
export class NuevoPagoDialogComponent {
  cliente = '';
  producto = '';
  monto: number | null = null;
  metodo = '';
  alias = '';
  cbu = '';
  qr = '';

  constructor(private dialogRef: MatDialogRef<NuevoPagoDialogComponent>) { }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close({ cliente: this.cliente, producto: this.producto, monto: this.monto, metodo: this.metodo, alias: this.alias, cbu: this.cbu, qr: this.qr });
  }
}
