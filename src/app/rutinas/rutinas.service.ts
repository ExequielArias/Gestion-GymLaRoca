/*
  RutinasService: Servicio para manejar la lógica de rutinas (carga, guardado, borrado) y desacoplar la lógica del componente visual.
*/
import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({ providedIn: 'root' })
export class RutinasService {
  async getClientesConRutina() {
    const { data: clientes, error: errorClientes } = await supabase.from('clientes').select('*');
    if (errorClientes) throw new Error(errorClientes.message);
    const { data: rutinas, error: errorRutinas } = await supabase.from('rutinas').select('cliente_id');
    if (errorRutinas) throw new Error(errorRutinas.message);
    const clientesConRutina = new Set((rutinas ?? []).map((r: any) => r.cliente_id));
    return clientes.map((c: any) => ({
      id: c.id,
      name: `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim(),
      dni: c.dni,
      phone: c.telefono,
      tieneRutina: clientesConRutina.has(c.id)
    }));
  }

  async getRutinaByClienteId(clienteId: number) {
    const { data, error } = await supabase.from('rutinas').select('*').eq('cliente_id', clienteId).single();
    if (error) return null;
    return data;
  }

  async saveRutina(clienteId: number, rutina: any) {
    const rutinaData = {
      cliente_id: clienteId,
      objetivo: rutina.objetivo,
      ejercicios: rutina.dias.map((d: any) => ({ dia: d.nombre, ejercicios: d.ejercicios }))
    };
    const { data: existente, error: errorExistente } = await supabase.from('rutinas').select('id').eq('cliente_id', clienteId).single();
    let result;
    if (!errorExistente && existente) {
      result = await supabase.from('rutinas').update(rutinaData).eq('cliente_id', clienteId);
    } else {
      result = await supabase.from('rutinas').insert(rutinaData);
    }
    if (result.error) throw new Error(result.error.message);
    return true;
  }

  async deleteRutina(clienteId: number) {
    const { error } = await supabase.from('rutinas').delete().eq('cliente_id', clienteId);
    if (error) throw new Error(error.message);
    return true;
  }
}
