import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-registrar-asistencia-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Registrar Asistencia</h2>
    <div mat-dialog-content>
      <form #form="ngForm">
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Cliente</mat-label>
          <input matInput [(ngModel)]="cliente" name="cliente" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Hora de Entrada</mat-label>
          <input matInput [(ngModel)]="entrada" name="entrada" required type="time">
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="!cliente || !entrada">Registrar</button>
    </div>
  `
})
export class RegistrarAsistenciaDialogComponent {
  cliente = '';
  entrada = '';

  constructor(private dialogRef: MatDialogRef<RegistrarAsistenciaDialogComponent>) {}

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close({ cliente: this.cliente, entrada: this.entrada });
  }
}
