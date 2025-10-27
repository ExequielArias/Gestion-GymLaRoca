
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { supabase } from '../supabase.client';

@Component({
  selector: 'app-asistencias',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatDialogModule],
  templateUrl: './asistencias.component.html',
  styleUrls: ['./asistencias.component.css']
})
export class AsistenciasComponent {
  searchTerm = '';
  result: any = null;
  currentTime = new Date().toLocaleTimeString();
  currentDate = new Date().toLocaleDateString();

  attendanceRecords: any[] = []; // Histórico completo
  todayAttendance: any[] = [];   // Solo asistencias de hoy
  accessLog: any[] = [];
  totalIngress = 0;
  allowedAccesses = 0;
  deniedAccesses = 0;

  constructor() {
    this.loadAllAttendance();
    this.loadTodayAttendance();
  }

  async loadAllAttendance() {
    // Traer todo el historial de asistencias
    const { data, error } = await supabase
      .from('asistencias')
      .select('hora, cliente_nombre, cliente_dni, estado, observaciones, fecha')
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });
    if (!error && data) {
      this.attendanceRecords = data.map((r: any) => ({
        time: r.hora,
        client: r.cliente_nombre,
        dni: r.cliente_dni,
        status: r.estado,
        notes: r.observaciones || '',
        date: r.fecha
      }));
    } else {
      this.attendanceRecords = [];
    }
  }

  async loadTodayAttendance() {
    // Get today's date in YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Fetch attendance records for today
    const { data, error } = await supabase
      .from('asistencias')
      .select('hora, cliente_nombre, cliente_dni, estado, observaciones')
      .eq('fecha', todayStr)
      .order('hora', { ascending: false });
    if (!error && data) {
      this.todayAttendance = data.map((r: any) => ({
        time: r.hora,
        client: r.cliente_nombre,
        dni: r.cliente_dni,
        status: r.estado,
        notes: r.observaciones || ''
      }));
      this.accessLog = this.todayAttendance.map(r => ({
        client: r.client,
        time: r.time,
        status: r.status
      }));
      this.totalIngress = this.todayAttendance.length;
      this.allowedAccesses = this.todayAttendance.filter(r => r.status === 'Permitido').length;
      this.deniedAccesses = this.todayAttendance.filter(r => r.status === 'Denegado').length;
    } else {
      this.todayAttendance = [];
      this.accessLog = [];
      this.totalIngress = 0;
      this.allowedAccesses = 0;
      this.deniedAccesses = 0;
    }
  }


  async verifyAccess() {
    if (!this.searchTerm) return;


    // Buscar cliente solo por DNI
    const { data: clientList, error: clientError } = await supabase
      .from('clientes')
      .select('*')
      .eq('dni', this.searchTerm);
    const client = Array.isArray(clientList) && clientList.length > 0 ? clientList[0] : null;

    if (clientError || !client) {
      this.result = {
        client: 'No encontrado',
        dni: this.searchTerm,
        membership: '-',
        expirationDate: '-',
        status: 'denegado'
      };
      try {
        await this.registerAttendance(null, 'Denegado', 'Cliente no encontrado');
      } catch (e: any) {
        alert('Error registrando asistencia: ' + (typeof e === 'object' && e && 'message' in e ? (e as any).message : e));
      }
      try {
        await this.loadTodayAttendance();
      } catch (e: any) {
        alert('Error cargando asistencias: ' + (typeof e === 'object' && e && 'message' in e ? (e as any).message : e));
      }
      return;
    }


    // Buscar pagos válidos (no vencidos)
    const { data: pagos, error: pagosError } = await supabase
      .from('pagos')
      .select('*')
      .eq('cliente_id', client.id)
      .order('fecha_vencimiento', { ascending: false });

    let membership = '-';
    let expirationDate = '-';
    let isActive = false;
    if (!pagosError && pagos && pagos.length > 0) {
      // Buscar el pago con fecha de vencimiento igual o posterior a hoy (usando Date para evitar problemas de zona horaria y formato)
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Ignorar hora
      const pagoValido = pagos.find((p: any) => {
        if (!p.fecha_vencimiento) return false;
        const vencimiento = new Date(p.fecha_vencimiento);
        vencimiento.setHours(0, 0, 0, 0);
        return vencimiento >= hoy;
      });
      if (pagoValido) {
        membership = pagoValido.tipo_membresia || '-';
        expirationDate = pagoValido.fecha_vencimiento ? new Date(pagoValido.fecha_vencimiento).toLocaleDateString() : '-';
        isActive = true;
      } else {
        // Si no hay pagos válidos, mostrar el último pago para info
        const ultimoPago = pagos[0];
        membership = ultimoPago.tipo_membresia || '-';
        expirationDate = ultimoPago.fecha_vencimiento ? new Date(ultimoPago.fecha_vencimiento).toLocaleDateString() : '-';
        isActive = false;
      }
    }

    this.result = {
      client: `${client.nombres} ${client.apellidos}`.trim(),
      dni: client.dni,
      membership,
      expirationDate,
      status: isActive ? 'permitido' : 'denegado'
    };

  await this.registerAttendance(client, isActive ? 'Permitido' : 'Denegado', isActive ? '' : 'Membresía vencida');
  // Forzar recarga inmediata de estadísticas e historial
  await this.loadTodayAttendance();
  await this.loadAllAttendance();
  }

  async registerAttendance(client: any, estado: string, observaciones: string) {
    // Registrar asistencia en la tabla 'asistencias'
    const now = new Date();
    const fecha = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const hora = now.toLocaleTimeString();
    await supabase.from('asistencias').insert([
      {
        fecha,
        hora,
        cliente_id: client ? client.id : null,
        cliente_nombre: client ? `${client.nombres} ${client.apellidos}`.trim() : 'No encontrado',
        cliente_dni: client ? client.dni : this.searchTerm,
        estado,
        observaciones
      }
    ]);
  }

  clearSearch() {
    this.searchTerm = '';
    this.result = null;
  }
}