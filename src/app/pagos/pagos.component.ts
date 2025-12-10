import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { supabase } from '../supabase.client';

// Dialog components
import { DialogPagarMembresiaComponent } from './dialogs/dialog-pagar-membresia.component';
import { DialogExtenderMembresiaComponent } from './dialogs/dialog-extender-membresia.component';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatDialogModule],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent {

  activeTab = 'search';
  searchTerm = '';

  filtroDni = '';
  filtroNombre = '';
  filtroApellido = '';
  filtroEstado = '';

  clientes: any[] = [];
  clientesFiltrados: any[] = [];

  clienteSeleccionado: any = null;

  cargandoClientes = false;
  pagosCliente: any[] = [];
  cargandoPagos = false;

  constructor(private dialog: MatDialog) {
    this.buscarClientes();
  }

  // -----------------------
  // Convertir fecha a ISO local sin desfase
  // -----------------------
  toLocalISO(d: Date): string {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  }

  // Mostrar DD/MM/AAAA
  toDisplay(iso: string | undefined): string {
    if (!iso) {
      return '-'; // O cualquier otro texto predeterminado
    }
    // Crear un nuevo Date basado en la representación local de la cadena ISO
    // Esto evita efectos secundarios de zonas horarias
    const date = new Date(iso);
    // Formatear manualmente para garantizar DD/MM/AAAA
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // --------------------------
  //  ESTADO DEL PAGO
  // --------------------------
  getEstadoPago(pago: any): { estado: string, clase: string } {
    if (!pago?.fecha_vencimiento)
      return { estado: 'Sin datos', clase: 'bg-gray-100 text-gray-800' };

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const venc = new Date(pago.fecha_vencimiento); venc.setHours(0, 0, 0, 0);

    if (venc >= hoy) return { estado: 'Activo', clase: 'bg-green-100 text-green-800' };
    return { estado: 'Vencido', clase: 'bg-red-100 text-red-800' };
  }

  // --------------------------
  //  BUSCAR CLIENTES
  // --------------------------
  async buscarClientes() {
    this.cargandoClientes = true;

    try {
      let query = supabase.from('clientes').select('*');

      if (this.searchTerm.trim() !== '') {
        const term = this.searchTerm.trim();
        query = supabase
          .from('clientes')
          .select('*')
          .or(`nombres.ilike.%${term}%,apellidos.ilike.%${term}%,dni.ilike.%${term}%`)
          .order('apellidos', { ascending: true });

        const { data } = await query;
        this.clientes = data || [];
      } else {
        const { data } = await query.order('apellidos', { ascending: true });
        this.clientes = data || [];
      }

      // Determinar estado de membresía
      for (const cliente of this.clientes) {
        const { data: pagos } = await supabase
          .from('pagos')
          .select('fecha_vencimiento')
          .eq('cliente_id', cliente.id)
          .order('fecha_vencimiento', { ascending: false })
          .limit(1);

        if (pagos && pagos.length > 0) {
          cliente.ultimaFechaVencimiento = pagos[0].fecha_vencimiento;

          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);

          const venc = new Date(pagos[0].fecha_vencimiento);
          venc.setHours(0, 0, 0, 0);

          cliente.estadoMembresia = venc >= hoy ? 'Activo' : 'Vencido';
        } else {
          cliente.estadoMembresia = 'Sin pagos';
          cliente.ultimaFechaVencimiento = null;
        }
      }

      this.filtrarClientes();

    } catch (err) {
      console.error('Error buscando clientes', err);
      this.clientes = [];
    }

    this.cargandoClientes = false;
  }

  // --------------------------
  // FILTRAR CLIENTES
  // --------------------------
  filtrarClientes() {
    this.clientesFiltrados = this.clientes.filter(c => {
      const coincideDni = this.filtroDni ? (c.dni || '').includes(this.filtroDni) : true;
      const coincideNombre = this.filtroNombre ? (c.nombres || '').toLowerCase().includes(this.filtroNombre.toLowerCase()) : true;
      const coincideApellido = this.filtroApellido ? (c.apellidos || '').toLowerCase().includes(this.filtroApellido.toLowerCase()) : true;
      const coincideEstado = this.filtroEstado ? c.estadoMembresia === this.filtroEstado : true;

      return coincideDni && coincideNombre && coincideApellido && coincideEstado;
    });
  }

  // --------------------------
  // SELECCIONAR CLIENTE
  // --------------------------
  async selectClient(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.activeTab = 'profile';
    await this.cargarPagosCliente();
  }

  // --------------------------
  // CARGAR PAGOS
  // --------------------------
  async cargarPagosCliente() {
    if (!this.clienteSeleccionado) return;

    this.cargandoPagos = true;

    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('cliente_id', this.clienteSeleccionado.id)
      .order('fecha_vencimiento', { ascending: false });


    this.pagosCliente = !error ? data : [];

    this.cargandoPagos = false;
  }

  // --------------------------
  // GETTERS
  // --------------------------
  get ultimoPago() {
    return this.pagosCliente.length > 0 ? this.pagosCliente[0] : null;
  }

  get estadoMembresia(): string {
    if (!this.ultimoPago?.fecha_vencimiento) {
      return 'Sin pagos';
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar la hora de 'hoy'
    // Normalizar la hora de la fecha de vencimiento recuperada
    const venc = new Date(this.ultimoPago.fecha_vencimiento);
    venc.setHours(0, 0, 0, 0);

    return venc >= hoy ? 'Activo' : 'Vencido';
  }

  get fechaVencimiento(): string {
    // Usa el getter ultimoPago para obtener la fecha del último pago
    // Y luego formátela usando toDisplay
    if (!this.ultimoPago?.fecha_vencimiento) {
      // Si no hay último pago, quizás quieras mostrar la última fecha de vencimiento del cliente
      // o simplemente '-'.
      // Por consistencia con estadoMembresia, si no hay pago, debería haber 'Sin pagos'.
      // Pero si quieres mostrar la fecha almacenada en clienteSeleccionado (aunque no tenga sentido si no pagó nada):
      // return this.clienteSeleccionado?.ultimaFechaVencimiento ? this.toDisplay(this.clienteSeleccionado.ultimaFechaVencimiento) : '-';
      // Lo más coherente es mostrar '-' si no hay último pago registrado.
      return '-'; // O quizás un mensaje como "No aplica"
    }
    return this.toDisplay(this.ultimoPago.fecha_vencimiento);
  }

  get tipoMembresia() {
    if (!this.ultimoPago) return '-';

    const meses = this.ultimoPago.meses_pagados || 1;

    if (meses === 1) return 'Mensual';
    if (meses === 3) return 'Trimestral';
    if (meses === 6) return 'Semestral';
    if (meses === 12) return 'Anual';

    return `${meses} meses`;
  }

  // --------------------------
  // PAGAR MEMBRESÍA
  // --------------------------
  abrirDialogPagar() {
    if (!this.clienteSeleccionado) return;

    const dialogRef = this.dialog.open(DialogPagarMembresiaComponent, {
      width: '420px',
      panelClass: 'custom-dark-dialog',
      data: { cliente: this.clienteSeleccionado }
    });

    dialogRef.afterClosed().subscribe(async r => {
      if (!r) return;

      try {
        const fechaPago = new Date();

        let base = this.ultimoPago?.fecha_vencimiento
          ? new Date(this.ultimoPago.fecha_vencimiento)
          : new Date();

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        if (base < hoy) base = new Date(hoy);

        base.setMonth(base.getMonth() + 1);

        const fechaVencLocal = this.toLocalISO(base);
        const fechaPagoLocal = this.toLocalISO(fechaPago);

        const periodo = `${base.getMonth() + 1}/${base.getFullYear()}`;

        const { error } = await supabase.from('pagos').insert([{
          cliente_id: this.clienteSeleccionado.id,
          monto: r.monto,
          metodo_pago: r.metodo,
          fecha_pago: fechaPagoLocal,
          fecha_vencimiento: fechaVencLocal,
          periodo,
          meses_pagados: 1
        }]);

        if (error) {
          console.error('Error guardando pago', error);
          alert('No se pudo registrar el pago.');
          return;
        }

        await supabase
          .from('clientes')
          .update({ estadoMembresia: 'Activo', fecha_vencimiento: fechaVencLocal })
          .eq('id', this.clienteSeleccionado.id);

        await this.cargarPagosCliente();
        await this.buscarClientes();

      } catch (err) {
        console.error('Error en pagar membresía', err);
      }
    });
  }

  // --------------------------
  // EXTENDER MEMBRESÍA
  // --------------------------
  abrirDialogExtender() {
    if (!this.clienteSeleccionado) return;

    const dialogRef = this.dialog.open(DialogExtenderMembresiaComponent, {
      width: '480px',
      panelClass: 'custom-dark-dialog',
      data: { cliente: this.clienteSeleccionado }
    });

    dialogRef.afterClosed().subscribe(async r => {
      if (!r) return;

      try {
        const meses = Number(r.meses);
        const montoTotal = Number(r.montoTotal);

        let base = this.ultimoPago?.fecha_vencimiento
          ? new Date(this.ultimoPago.fecha_vencimiento)
          : new Date();

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        if (base < hoy) base = new Date(hoy);

        base.setMonth(base.getMonth() + meses);

        const fechaVencLocal = this.toLocalISO(base);
        const fechaPagoLocal = this.toLocalISO(new Date());

        const periodo = `${base.getMonth() + 1}/${base.getFullYear()}`;

        const { error } = await supabase.from('pagos').insert([{
          cliente_id: this.clienteSeleccionado.id,
          monto: montoTotal,
          metodo_pago: r.metodo,
          fecha_pago: fechaPagoLocal,
          fecha_vencimiento: fechaVencLocal,
          periodo,
          meses_pagados: meses
        }]);

        if (error) {
          console.error('Error extendiendo membresía', error);
          alert('No se pudo extender la membresía.');
          return;
        }

        await supabase
          .from('clientes')
          .update({ estadoMembresia: 'Activo', fecha_vencimiento: fechaVencLocal })
          .eq('id', this.clienteSeleccionado.id);

        await this.cargarPagosCliente();
        await this.buscarClientes();

      } catch (err) {
        console.error('Error extendiendo membresía', err);
      }
    });
  }

  // --------------------------
  // CAMBIO DE PANTALLAS
  // --------------------------
  viewHistory() {
    this.activeTab = 'history';
  }

  volverBusqueda() {
    if (this.activeTab === 'history') {
      this.activeTab = 'profile';
      return;
    }
    this.activeTab = 'search';
    this.clienteSeleccionado = null;
    this.pagosCliente = [];
  }
}
