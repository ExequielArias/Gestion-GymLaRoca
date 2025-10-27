import { Component, OnInit } from '@angular/core';
import { supabase } from '../supabase.client';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NuevoClienteDialogComponent } from './nuevo-cliente-dialog.component';
import { RegistrarPagoDialogComponent } from './registrar-pago-dialog.component';
import { EditarClienteDialogComponent } from './editar-cliente-dialog.component';
import { VerRutinaDialogComponent } from './ver-rutina-dialog.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatDialogModule, RegistrarPagoDialogComponent, EditarClienteDialogComponent, VerRutinaDialogComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})

export class ClientesComponent implements OnInit {
  clients: any[] = [];
  searchTerm: string = '';
  filteredClients: any[] = [];


  async ngOnInit() {
    await this.loadClients();
  }

  async loadClients() {
    const { data, error } = await supabase.from('clientes').select('*');
    if (error) {
      alert('Error al cargar clientes: ' + error.message);
      this.clients = [];
      this.filteredClients = [];
      return;
    }
    // Mapear los campos para que coincidan con la vista
    this.clients = data.map((c: any) => ({
      id: c.id,
      name: `${c.nombres} ${c.apellidos}`,
      dni: c.dni,
      phone: c.telefono
    }));
    this.filterClients();
  }

  filterClients() {
    const term = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.name.toLowerCase().includes(term) ||
      client.dni?.toLowerCase().includes(term) ||
      client.phone?.toLowerCase().includes(term)
    );
  }

  constructor(private dialog: MatDialog) { }

  openNewClientDialog() {
    const dialogRef = this.dialog.open(NuevoClienteDialogComponent, {
      width: '800px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Recargar clientes desde la base de datos
        this.loadClients();
      }
    });
  }

  async editClient(client: any) {
    // Obtener datos completos del cliente
    const { data, error } = await supabase.from('clientes').select('*').eq('id', client.id).single();
    if (error || !data) {
      alert('No se pudo cargar el cliente para editar.');
      return;
    }
    const dialogRef = this.dialog.open(EditarClienteDialogComponent, {
      width: '500px',
      data: data
    });
    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (result) {
        // Actualizar en Supabase
        const { error: updateError } = await supabase.from('clientes').update({
          nombres: result.nombres,
          apellidos: result.apellidos,
          dni: result.dni,
          telefono: result.telefono
        }).eq('id', client.id);
        if (updateError) {
          alert('Error al actualizar cliente: ' + updateError.message);
        } else {
          this.loadClients();
        }
      }
    });
  }

  async viewRoutine(client: any) {
    // Buscar la rutina vinculada a este cliente
    const { data: rutina, error } = await supabase
      .from('rutinas')
      .select('*')
      .eq('cliente_id', client.id)
      .single();
    this.dialog.open(VerRutinaDialogComponent, {
      width: '500px',
      data: {
        cliente: client,
        rutina: rutina || null
      }
    });
  }

  async deleteClient(client: any) {
    if (!confirm(`¿Seguro que deseas eliminar a ${client.name}? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('clientes').delete().eq('id', client.id);
    if (error) {
      alert('Error al eliminar cliente: ' + error.message);
      return;
    }
    this.loadClients();
  }
}
