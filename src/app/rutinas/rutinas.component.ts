
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RutinasService } from './rutinas.service';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../clientes/error-dialog.component';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, FormsModule, ErrorDialogComponent],
  templateUrl: './rutinas.component.html',
  styleUrls: ['./rutinas.component.css']
})
export class RutinasComponent implements OnInit {
  // Estado UI
  activeTab: 'search' | 'evaluation' | 'preview' = 'search';
  searchTerm = '';
  clients: any[] = [];
  filteredClients: any[] = [];
  cliente: any = null;
  rutina: any = { objetivo: '', dias: [] };
  rutinaPreview: any = null;
  clientePreview: any = null;

  constructor(private rutinasService: RutinasService, private dialog: MatDialog) { }

  async ngOnInit() {
    await this.loadClients();
  }

  async loadClients() {
    try {
      this.clients = await this.rutinasService.getClientesConRutina();
      this.filterClients();
    } catch (e: any) {
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'Error al cargar clientes: ' + e.message }
      });
      this.clients = [];
      this.filteredClients = [];
    }
  }

  filterClients() {
    const term = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.dni && c.dni.toString().includes(term)) ||
      (c.phone && c.phone.toString().includes(term))
    );
  }

  crearOModificarRutina(cliente: any) {
    this.cliente = cliente;
    this.rutina = { objetivo: '', dias: [] };
    this.activeTab = 'evaluation';
    this.rutinasService.getRutinaByClienteId(cliente.id).then(rutina => {
      if (rutina && rutina.ejercicios) {
        this.rutina = {
          objetivo: rutina.objetivo || '',
          dias: rutina.ejercicios.map((d: any) => ({
            nombre: d.dia,
            ejercicios: Array.isArray(d.ejercicios) ? d.ejercicios : []
          }))
        };
      }
    });
  }

  volverABusqueda() {
    this.activeTab = 'search';
  }

  mostrarVistaPrevia() {
    this.activeTab = 'preview';
  }

  agregarDia() {
    this.rutina.dias.push({ nombre: '', ejercicios: [] });
  }

  eliminarDia(index: number) {
    this.rutina.dias.splice(index, 1);
  }

  agregarEjercicio(diaIndex: number) {
    this.rutina.dias[diaIndex].ejercicios.push({ nombre: '', detalle: '' });
  }

  eliminarEjercicio(diaIndex: number, ejercicioIndex: number) {
    this.rutina.dias[diaIndex].ejercicios.splice(ejercicioIndex, 1);
  }

  async guardarRutina() {
    if (!this.cliente) return;
    // Validar rutina vacía: no permitir guardar si no hay días o si todos los días están vacíos
    // Validar que haya al menos un día con nombre y al menos un ejercicio con nombre
    if (!this.rutina.dias ||
        this.rutina.dias.length === 0 ||
        this.rutina.dias.every((dia: any) => !dia.nombre.trim() || !dia.ejercicios || dia.ejercicios.length === 0 || dia.ejercicios.every((ej: any) => !ej.nombre || !ej.nombre.trim()))
    ) {
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'No se puede guardar una rutina vacía. Agregue al menos un día y un ejercicio con nombre.' }
      });
      return;
    }
    try {
      await this.rutinasService.saveRutina(this.cliente.id, this.rutina);
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'Rutina guardada correctamente' }
      });
      this.activeTab = 'search';
      await this.loadClients();
    } catch (e: any) {
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'Error al guardar rutina: ' + e.message }
      });
    }
  }

  async eliminarRutina() {
    if (!this.cliente) return;
    if (!confirm('¿Seguro que deseas eliminar la rutina de este cliente?')) return;
    try {
      await this.rutinasService.deleteRutina(this.cliente.id);
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'Rutina eliminada correctamente' }
      });
      this.activeTab = 'search';
      await this.loadClients();
      this.cliente = null;
      this.rutina = { objetivo: '', dias: [] };
    } catch (e: any) {
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'Error al eliminar rutina: ' + e.message }
      });
    }
  }

  async verRutinaPreview(cliente: any) {
    const rutina = await this.rutinasService.getRutinaByClienteId(cliente.id);
    if (!rutina) {
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'No se pudo cargar la rutina para vista previa.' }
      });
      return;
    }
    // Transformar la rutina para que tenga dias y ejercicios
    this.rutinaPreview = {
      objetivo: rutina.objetivo || '',
      dias: Array.isArray(rutina.ejercicios)
        ? rutina.ejercicios.map((d: any) => ({
            nombre: d.dia,
            ejercicios: Array.isArray(d.ejercicios) ? d.ejercicios : []
          }))
        : []
    };
    this.clientePreview = cliente;
    this.activeTab = 'preview';
  }

  async descargarPDF() {
    const jsPDF = (await import('jspdf')).jsPDF;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgUrl = 'https://cycbwbiszlojxhyovpfu.supabase.co/storage/v1/object/public/imagenes/fotos/iconoDos.png';

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgUrl;
    await new Promise(resolve => { img.onload = resolve; });

    const getAlphaImage = (img: HTMLImageElement, width: number, height: number, alpha: number): string => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    };
    const marcaAguaDataUrl = getAlphaImage(img, 150, 150, 0.08);
    doc.addImage(marcaAguaDataUrl, 'PNG', 30, 60, 150, 150, '', 'NONE');

    doc.setFillColor(220, 38, 38);
    doc.roundedRect(0, 0, pageWidth, 28, 0, 0, 'F');
    const logoW = 18, logoH = 18;
    const centerX = pageWidth / 2;
    const text = 'Gym LaRoca';
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const textWidth = doc.getTextWidth(text);
    const totalWidth = logoW + 6 + textWidth;
    const logoX = centerX - (totalWidth / 2);
    const textX = logoX + logoW + 6 + textWidth / 2;
    doc.addImage(img, 'PNG', logoX, 5, logoW, logoH, '', 'NONE');
    doc.setTextColor(255, 255, 255);
    doc.text(text, textX, 18, { align: 'center' });

    doc.setFontSize(15);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rutina para: ${this.clientePreview?.name || ''}`, pageWidth / 2, 38, { align: 'center' });

    let y = 50;
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('Objetivo:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(this.rutinaPreview?.objetivo || '', 45, y);
    y += 10;

    if (this.rutinaPreview?.dias) {
      for (const dia of this.rutinaPreview.dias) {
        y += 6;
        doc.setDrawColor(34, 58, 170);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, y - 4, pageWidth - 30, 8, 2, 2, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(`Día: ${dia.nombre}`, 20, y + 2);
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        for (const ejercicio of dia.ejercicios) {
          let texto = `• ${ejercicio.nombre}`;
          if (ejercicio.detalle) texto += ` (${ejercicio.detalle})`;
          doc.text(texto, 28, y);
          y += 7;
          if (y > pageHeight - 30) {
            doc.setFontSize(9);
            doc.setTextColor(180, 180, 180);
            doc.text('Documento generado automáticamente por Gym LaRoca', pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.addPage();
            doc.addImage(img, 'PNG', 30, 60, 150, 150, '', 'NONE', 0.08);
            y = 30;
          }
        }
        y += 8;
      }
    }

    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text('Documento generado automáticamente por Gym LaRoca', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.save(`Rutina_${this.clientePreview?.name || 'cliente'}.pdf`);
  }

  enviarWhatsApp() {
    if (!this.rutinaPreview || !this.clientePreview) {
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'No hay rutina para enviar.' }
      });
      return;
    }
    let mensaje = `*Rutina de ${this.clientePreview.name}*\n`;
    mensaje += `Objetivo: ${this.rutinaPreview.objetivo}\n`;
    for (const dia of this.rutinaPreview.dias) {
      mensaje += `\n*${dia.nombre}*\n`;
      for (const ejercicio of dia.ejercicios) {
        mensaje += `- ${ejercicio.nombre}`;
        if (ejercicio.detalle) mensaje += ` (${ejercicio.detalle})`;
        mensaje += '\n';
      }
    }
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  get isEvaluationTab() {
    return this.activeTab === 'evaluation';
  }

  get isPreviewTab() {
    return this.activeTab === 'preview';
  }
}
