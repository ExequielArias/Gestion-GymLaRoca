import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-rutina-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Rutina de Entrenamiento</h2>
    <div mat-dialog-content>
      <form #form="ngForm">
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Cliente</mat-label>
          <input matInput [(ngModel)]="cliente" name="cliente" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Nombre de la Rutina</mat-label>
          <input matInput [(ngModel)]="nombreRutina" name="nombreRutina" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Entrenador</mat-label>
          <input matInput [(ngModel)]="entrenador" name="entrenador" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Duración (minutos)</mat-label>
          <input matInput [(ngModel)]="duracion" name="duracion" required type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Descripción</mat-label>
          <textarea matInput [(ngModel)]="descripcion" name="descripcion" rows="2"></textarea>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full mb-4">
          <mat-label>Ejercicios (nombre, series, reps)</mat-label>
          <input matInput [(ngModel)]="ejercicios" name="ejercicios" placeholder="Ej: Sentadillas, 3, 12">
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="!cliente || !nombreRutina || !entrenador || !duracion">Guardar</button>
    </div>
  `
})
export class RutinaDialogComponent {
  cliente = '';
  nombreRutina = '';
  entrenador = '';
  duracion: number | null = null;
  descripcion = '';
  ejercicios = '';

  constructor(private dialogRef: MatDialogRef<RutinaDialogComponent>) { }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close({
      cliente: this.cliente,
      nombreRutina: this.nombreRutina,
      entrenador: this.entrenador,
      duracion: this.duracion,
      descripcion: this.descripcion,
      ejercicios: this.ejercicios
    });
  }
}
