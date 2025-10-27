import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-registrar-pago-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: './registrar-pago-dialog.component.html'
})
export class RegistrarPagoDialogComponent {
  monto: number | null = null;
  metodo: 'efectivo' | 'transferencia' = 'efectivo';
  pagoRealizado: boolean | null = null;
  meses: number = 1;

  constructor(
    public dialogRef: MatDialogRef<RegistrarPagoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmar() {
    if (this.pagoRealizado === null) {
      alert('Debe indicar si el cliente pagó o no.');
      return;
    }
    if (this.pagoRealizado && (this.monto === null || this.monto <= 0)) {
      alert('Debe ingresar el monto pagado.');
      return;
    }
    if (this.pagoRealizado && (this.meses === null || this.meses < 1)) {
      alert('Debe ingresar la cantidad de meses a pagar (mínimo 1).');
      return;
    }
    if (this.pagoRealizado) {
      this.dialogRef.close({
        monto: this.monto,
        metodo: this.metodo,
        meses: this.meses,
        pagoRealizado: true
      });
    } else {
      this.dialogRef.close({ pagoRealizado: false });
    }
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}
