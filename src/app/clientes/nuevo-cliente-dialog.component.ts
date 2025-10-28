// ...existing code...
import { Component } from '@angular/core';
import { supabase } from '../supabase.client';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { RegistrarPagoDialogComponent } from './registrar-pago-dialog.component';
import { ErrorDialogComponent } from './error-dialog.component';

@Component({
  selector: 'app-nuevo-cliente-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    ErrorDialogComponent
  ],
  templateUrl: './nuevo-cliente-dialog.component.html'
})
export class NuevoClienteDialogComponent {
  // Si en el futuro se quiere mostrar una lista de clientes, definir aquí
  // filteredClients: any[] = [];
  client = {
    name: '',
    lastName: '',
    dni: '',
    phone: '',
    membership: 'Pase Libre'
  };
  // El pago se gestiona en el dialogo aparte

  constructor(private dialogRef: MatDialogRef<NuevoClienteDialogComponent>, private dialog: MatDialog) { }

  async saveClient() {
    if (!this.client.name || !this.client.lastName || !this.client.dni || !this.client.phone) {
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'Por favor complete todos los campos obligatorios.' }
      });
      return;
    }

    // Abrir dialogo de pago
    const pagoDialog = this.dialog.open(RegistrarPagoDialogComponent, {
      width: '400px',
      data: {}
    });

    pagoDialog.afterClosed().subscribe(async (pagoResult: any) => {
      if (!pagoResult) return; // Cancelado
      if (!pagoResult.pagoRealizado) {
        this.dialog.open(ErrorDialogComponent, {
          data: { message: 'No se registró el cliente porque no pagó la inscripción.' }
        });
        return;
      }

      // Guardar cliente en Supabase
      const { data: clienteData, error: clienteError } = await supabase.from('clientes').insert([
        {
          nombres: this.client.name,
          apellidos: this.client.lastName,
          dni: this.client.dni,
          telefono: this.client.phone
        }
      ]).select();

      if (clienteError || !clienteData || !clienteData[0]) {
        this.dialog.open(ErrorDialogComponent, {
          data: { message: 'Error al registrar el cliente: ' + (clienteError?.message || 'Error desconocido') }
        });
        return;
      }

      // Calcular fecha de vencimiento sumando los meses pagados
      const mesesPagados = pagoResult.meses || 1;
      const fechaPago = new Date();
      const fechaVencimiento = new Date(fechaPago);
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + mesesPagados);

      // Registrar el pago en la tabla pagos
      const clienteId = clienteData[0].id;
      const periodo = `${fechaPago.getFullYear()}-${(fechaPago.getMonth()+1).toString().padStart(2,'0')}`;
      const { error: pagoError } = await supabase.from('pagos').insert([
        {
          cliente_id: clienteId,
          fecha_pago: fechaPago.toISOString(),
          monto: pagoResult.monto,
          periodo: periodo,
          metodo_pago: pagoResult.metodo,
          meses_pagados: mesesPagados,
          fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0] // solo fecha
        }
      ]);
      if (pagoError) {
        this.dialog.open(ErrorDialogComponent, {
          data: { message: 'Cliente registrado, pero error al registrar el pago: ' + pagoError.message }
        });
        this.dialogRef.close(this.client);
        return;
      }

      this.dialogRef.close(this.client);
    });
  }
}
