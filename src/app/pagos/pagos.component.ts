import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { supabase } from '../supabase.client';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent {
  // ...existing code...

  /**
   * Devuelve el estado ('Activo' o 'Vencido') y la clase de color para un pago dado
   */
  getEstadoPago(pago: any): { estado: string, clase: string } {
    if (!pago || !pago.fecha_vencimiento) {
      return { estado: 'Sin datos', clase: 'bg-gray-100 text-gray-800' };
    }
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const venc = new Date(pago.fecha_vencimiento);
    venc.setHours(0,0,0,0);
    if (venc >= hoy) {
      return { estado: 'Activo', clase: 'bg-green-100 text-green-800' };
    } else {
      return { estado: 'Vencido', clase: 'bg-red-100 text-red-800' };
    }
  }
  activeTab = 'search'; // search, profile, history
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

  constructor() {
    this.buscarClientes();
  }

  async buscarClientes() {
    this.cargandoClientes = true;
    let query = supabase.from('clientes').select('*');
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim();
      query = query.ilike('nombres', `%${term}%`).or(`apellidos.ilike.%${term}%,dni.ilike.%${term}%`);
    }
    const { data, error } = await query.order('apellidos', { ascending: true });
    this.clientes = !error && data ? data : [];
    // Para cada cliente, obtener su último pago y calcular estado
    for (const cliente of this.clientes) {
      const { data: pagos, error: errorPagos } = await supabase
        .from('pagos')
        .select('fecha_vencimiento')
        .eq('cliente_id', cliente.id)
        .order('fecha_pago', { ascending: false })
        .limit(1);
      if (!errorPagos && pagos && pagos.length > 0) {
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        const venc = new Date(pagos[0].fecha_vencimiento);
        venc.setHours(0,0,0,0);
        cliente.estadoMembresia = venc >= hoy ? 'Activo' : 'Vencido';
      } else {
        cliente.estadoMembresia = 'Sin pagos';
      }
    }
    this.filtrarClientes();
    this.cargandoClientes = false;
  }

  filtrarClientes() {
    this.clientesFiltrados = this.clientes.filter(cliente => {
      const coincideDni = this.filtroDni ? cliente.dni.includes(this.filtroDni) : true;
      const coincideNombre = this.filtroNombre ? cliente.nombres.toLowerCase().includes(this.filtroNombre.toLowerCase()) : true;
      const coincideApellido = this.filtroApellido ? cliente.apellidos.toLowerCase().includes(this.filtroApellido.toLowerCase()) : true;
      const coincideEstado = this.filtroEstado ? cliente.estadoMembresia === this.filtroEstado : true;
      return coincideDni && coincideNombre && coincideApellido && coincideEstado;
    });
  }

  async selectClient(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.activeTab = 'profile';
    await this.cargarPagosCliente();
  }

  async cargarPagosCliente() {
    if (!this.clienteSeleccionado) {
      this.pagosCliente = [];
      return;
    }
    this.cargandoPagos = true;
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('cliente_id', this.clienteSeleccionado.id)
      .order('fecha_pago', { ascending: false });
    this.pagosCliente = !error && data ? data : [];
    this.cargandoPagos = false;
  }

  viewHistory() {
    this.activeTab = 'history';
  }

  volverBusqueda() {
    if (this.activeTab === 'history') {
      this.activeTab = 'profile';
    } else {
      this.activeTab = 'search';
      this.clienteSeleccionado = null;
      this.pagosCliente = [];
    }
  }

  get ultimoPago() {
    return this.pagosCliente.length > 0 ? this.pagosCliente[0] : null;
  }

  get estadoMembresia() {
    if (!this.ultimoPago) return 'Sin pagos';
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    if (this.ultimoPago.fecha_vencimiento) {
      const venc = new Date(this.ultimoPago.fecha_vencimiento);
      venc.setHours(0,0,0,0);
      return venc >= hoy ? 'Activo' : 'Vencido';
    }
    return 'Sin pagos';
  }

  get tipoMembresia() {
    return this.ultimoPago && this.ultimoPago.tipo_membresia ? this.ultimoPago.tipo_membresia : '-';
  }

  get fechaVencimiento() {
    return this.ultimoPago && this.ultimoPago.fecha_vencimiento ? new Date(this.ultimoPago.fecha_vencimiento).toLocaleDateString() : '-';
  }
}