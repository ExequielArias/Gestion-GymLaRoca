import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { supabase } from '../supabase.client';

Chart.register(...registerables);

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    private chartRefs: { [key: string]: Chart | null } = {
        activeClientsChart: null,
        newClientsChart: null,
        attendanceChart: null,
        membershipPie: null
    };
    isLoading = true;

    // Totales para tarjetas resumen
    totalClientesActivos = 0;
    totalClientesNuevos = 0;
    totalAsistenciasHoy = 0;
    totalTiposMembresia = 0;

    constructor() { }

    async ngOnInit() {
        await this.loadCharts();
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible') {
                await this.loadCharts();
            }
        });
    }

    async loadCharts() {
        this.isLoading = true;
        try {
            await Promise.all([
                this.renderActiveClientsChart(),
                this.renderNewClientsChart(),
                this.renderAttendanceChart(),
                this.renderMembershipPie()
            ]);
        } finally {
            this.isLoading = false;
        }
    }

    // Destruye el gráfico anterior si existe
    private destroyChart(chartId: string) {
        if (this.chartRefs[chartId]) {
            this.chartRefs[chartId]?.destroy();
            this.chartRefs[chartId] = null;
        }
    }

    // 📈 CLIENTES ACTIVOS POR MES
    async renderActiveClientsChart() {
        this.destroyChart('activeClientsChart');
        // Traer todos los pagos con cliente_id y fecha_vencimiento
        const { data, error } = await supabase.from('pagos').select('cliente_id, fecha_vencimiento');
        if (error) {
            console.error('Error cargando pagos:', error.message);
            return;
        }

        // Calcular clientes activos por mes (últimos 6 meses)
        const now = new Date();
        const labels: string[] = [];
        const date = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            labels.push(key);
        }

        // Para cada mes, contar clientes únicos con pago vigente en ese mes
        const dataArr: number[] = [];
        for (const label of labels) {
            const [year, month] = label.split('-').map(Number);
            // Clientes con al menos un pago vigente en ese mes
            const clientesActivos = new Set<number>();
            data?.forEach(p => {
                const venc = new Date(p.fecha_vencimiento);
                // Si el pago está vigente en ese mes
                if (
                    venc.getFullYear() > year ||
                    (venc.getFullYear() === year && venc.getMonth() + 1 >= month)
                ) {
                    clientesActivos.add(p.cliente_id);
                }
            });
            dataArr.push(clientesActivos.size);
        }
        // El mes actual es el último
        this.totalClientesActivos = dataArr[dataArr.length - 1];

        this.chartRefs['activeClientsChart'] = new Chart('activeClientsChart', {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Clientes activos',
                    data: dataArr,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.3)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: this.chartOptions()
        });
    }

    // 🧍‍♂️ CLIENTES NUEVOS POR MES
    async renderNewClientsChart() {
        this.destroyChart('newClientsChart');
        const { data, error } = await supabase.from('clientes').select('created_at');
        if (error) {
            console.error('Error cargando clientes:', error.message);
            return;
        }

        // Rellenar los últimos 6 meses
        const labels: string[] = [];
        const date = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            labels.push(key);
        }

        // Contar clientes nuevos por mes usando rangos de fecha exactos
        const dataArr: number[] = [];
        for (const label of labels) {
            const [year, month] = label.split('-').map(Number);
            // Primer día del mes
            const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
            // Último día del mes
            const end = new Date(year, month, 0, 23, 59, 59, 999);
            // Contar clientes cuyo created_at está dentro de ese mes
            const count = data?.filter(c => {
                const fecha = new Date(c.created_at);
                return fecha >= start && fecha <= end;
            }).length || 0;
            dataArr.push(count);
        }
        // El mes actual es el último
        this.totalClientesNuevos = dataArr[dataArr.length - 1];

        this.chartRefs['newClientsChart'] = new Chart('newClientsChart', {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Clientes nuevos',
                    data: dataArr,
                    backgroundColor: '#f87171'
                }]
            },
            options: this.chartOptions()
        });
    }

    // 🕒 ASISTENCIAS (ÚLTIMOS 15 DÍAS)
    async renderAttendanceChart() {
        this.destroyChart('attendanceChart');
        const today = new Date();
        const fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 14); // 15 días incluyendo hoy

        const { data, error } = await supabase
            .from('asistencias')
            .select('fecha')
            .gte('fecha', fromDate.toISOString().split('T')[0]);

        if (error) {
            console.error('Error cargando asistencias:', error.message);
            return;
        }

        // Contar asistencias por día
        const counts: Record<string, number> = {};
        data?.forEach(a => counts[a.fecha] = (counts[a.fecha] || 0) + 1);

        // Rellenar los últimos 15 días aunque no haya datos
        const labels: string[] = [];
        const dataArr: number[] = [];
        for (let i = 14; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const key = d.toISOString().split('T')[0];
            labels.push(key);
            dataArr.push(counts[key] || 0);
        }
        // Asistencias de hoy
        this.totalAsistenciasHoy = dataArr[dataArr.length - 1];

        this.chartRefs['attendanceChart'] = new Chart('attendanceChart', {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Asistencias diarias',
                    data: dataArr,
                    borderColor: '#facc15',
                    backgroundColor: 'rgba(250,204,21,0.3)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: this.chartOptions()
        });
    }

    // 🍩 DISTRIBUCIÓN DE MEMBRESÍAS
    async renderMembershipPie() {
        this.destroyChart('membershipPie');
        const { data, error } = await supabase.from('pagos').select('tipo_membresia');
        if (error) {
            console.error('Error cargando membresías:', error.message);
            return;
        }

        // Contar tipos de membresía
        const counts: Record<string, number> = {};
        data?.forEach(p => counts[p.tipo_membresia] = (counts[p.tipo_membresia] || 0) + 1);
        const labels = Object.keys(counts);
        const dataArr = Object.values(counts);
        this.totalTiposMembresia = labels.length;

        this.chartRefs['membershipPie'] = new Chart('membershipPie', {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: dataArr,
                    backgroundColor: ['#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b']
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: { color: '#fff' },
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // 🎨 Opciones globales de diseño para mantener coherencia
    private chartOptions(): any {
        return {
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                x: { ticks: { color: '#ccc' }, grid: { color: '#333' } },
                y: { ticks: { color: '#ccc' }, grid: { color: '#333' } }
            }
        };
    }
}
