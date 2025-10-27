import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-editar-cliente-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  template: `
  <div class="p-6 w-full max-w-md mx-auto">
    <h2 class="text-xl font-bold mb-4">Editar Cliente</h2>
    <form (ngSubmit)="guardar()" #editForm="ngForm">
      <div class="mb-4">
        <label class="block mb-1 font-medium">Nombre/s</label>
        <input type="text" [(ngModel)]="cliente.nombres" name="nombres" class="w-full px-3 py-2 border rounded" required />
      </div>
      <div class="mb-4">
        <label class="block mb-1 font-medium">Apellido/s</label>
        <input type="text" [(ngModel)]="cliente.apellidos" name="apellidos" class="w-full px-3 py-2 border rounded" required />
      </div>
      <div class="mb-4">
        <label class="block mb-1 font-medium">DNI</label>
        <input type="text" [(ngModel)]="cliente.dni" name="dni" class="w-full px-3 py-2 border rounded" required />
      </div>
      <div class="mb-4">
        <label class="block mb-1 font-medium">Teléfono</label>
        <input type="text" [(ngModel)]="cliente.telefono" name="telefono" class="w-full px-3 py-2 border rounded" required />
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button type="button" (click)="cancelar()" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
        <button type="submit" class="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700">Guardar</button>
      </div>
    </form>
  </div>
  `
})
export class EditarClienteDialogComponent {
  cliente: any;

  constructor(
    public dialogRef: MatDialogRef<EditarClienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Copia para edición
    this.cliente = { ...data };
  }

  guardar() {
    if (!this.cliente.nombres || !this.cliente.apellidos || !this.cliente.dni || !this.cliente.telefono) {
      alert('Complete todos los campos.');
      return;
    }
    this.dialogRef.close(this.cliente);
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}
