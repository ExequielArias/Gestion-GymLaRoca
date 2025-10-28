
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, ChartData, ChartDataset, Chart } from 'chart.js';
import { supabase } from '../supabase.client';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

    isLoading = true;

    // Totales para tarjetas resumen
    totalClientesActivos = 0;
    totalClientesNuevos = 0;
    totalAsistenciasHoy = 0;
    totalTiposMembresia = 0;

    // Chart.js ChartData para ng2-charts
    activeClientsChartData: ChartData<'line'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Clientes activos', borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)', fill: true, tension: 0.3 }
        ]
    };
    newClientsChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Clientes nuevos', backgroundColor: '#f87171', borderRadius: 8 }
        ]
    };
    attendanceChartData: ChartData<'line'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Asistencias diarias', borderColor: '#facc15', backgroundColor: 'rgba(250,204,21,0.15)', fill: true, tension: 0.3 }
        ]
    };
    membershipPieData: ChartData<'doughnut'> = {
        labels: [],
        datasets: [
            { data: [], backgroundColor: ['#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b'] }
        ]
    };

    // Opciones minimalistas y plugins
    lineChartOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
        scales: {
            x: {
                ticks: {
                    color: '#ccc',
                    callback: function(value, index, ticks) {
                        // value es el índice del label
                        const labels = this.getLabels ? this.getLabels() : (this.chart?.data?.labels || []);
                        const idx = typeof value === 'number' ? value : parseInt(value as any, 10);
                        const label = labels[idx] || value;
                        // Si es fecha tipo 'YYYY-MM-DD', mostrar 'DD/MM'
                        if (typeof label === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(label)) {
                            const [year, month, day] = label.split('-');
                            return `${day}/${month}`;
                        }
                        // Si es 'YYYY-MM', mostrar 'Mes Año'
                        if (typeof label === 'string' && label.includes('-')) {
                            const [year, month] = label.split('-');
                            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            const m = parseInt(month, 10);
                            return `${monthNames[m-1]} ${year}`;
                        }
                        return typeof label === 'string' || typeof label === 'number' ? label : '';
                    }
                },
                grid: { color: '#222' }
            },
            y: {
                ticks: {
                    color: '#ccc',
                    precision: 0,
                    callback: function(value) {
                        // Solo mostrar enteros
                        return Number.isInteger(value) ? value : '';
                    }
                },
                grid: { color: '#222' }
            }
        }
    };
    barChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
        scales: {
            x: {
                ticks: {
                    color: '#ccc',
                    callback: function(value, index, ticks) {
                        const labels = this.getLabels ? this.getLabels() : (this.chart?.data?.labels || []);
                        const idx = typeof value === 'number' ? value : parseInt(value as any, 10);
                        const label = labels[idx] || value;
                        if (typeof label === 'string' && label.includes('-')) {
                            const [year, month] = label.split('-');
                            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            const m = parseInt(month, 10);
                            return `${monthNames[m-1]} ${year}`;
                        }
                        return typeof label === 'string' || typeof label === 'number' ? label : '';
                    }
                },
                grid: { color: '#222' }
            },
            y: {
                ticks: {
                    color: '#ccc',
                    precision: 0,
                    callback: function(value) {
                        return Number.isInteger(value) ? value : '';
                    }
                },
                grid: { color: '#222' }
            }
        }
    };
    pieChartOptions: ChartOptions<'doughnut'> = {
        responsive: true,
        plugins: {
            legend: { display: true, labels: { color: '#fff', font: { size: 14 } }, position: 'bottom' },
            tooltip: { enabled: true },
        }
    };
    chartPlugins = [];

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

    // 📈 CLIENTES ACTIVOS POR MES
    async renderActiveClientsChart() {
        // Traer todos los pagos con cliente_id y fecha_vencimiento
        const { data, error } = await supabase.from('pagos').select('cliente_id, fecha_vencimiento, fecha_pago');
        if (error) {
            console.error('Error cargando pagos:', error.message);
            return;
        }

        // Calcular clientes activos por día (últimos 30 días)
        const today = new Date();
        const labels: string[] = [];
        const dataArr: number[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const key = d.toISOString().split('T')[0];
            labels.push(key);
            // Para cada día, contar clientes con pago vigente (fecha_pago <= d <= fecha_vencimiento)
            const clientesActivos = new Set<number>();
            data?.forEach(p => {
                const pago = new Date(p.fecha_pago);
                const venc = new Date(p.fecha_vencimiento);
                if (pago <= d && venc >= d) {
                    clientesActivos.add(p.cliente_id);
                }
            });
            dataArr.push(clientesActivos.size);
        }
        // El día actual es el último
        this.totalClientesActivos = dataArr[dataArr.length - 1];

        this.activeClientsChartData.labels = labels;
        this.activeClientsChartData.datasets[0].data = dataArr;
    }

    // 🧍‍♂️ CLIENTES NUEVOS POR MES
    async renderNewClientsChart() {
        const { data, error } = await supabase.from('clientes').select('fecha_alta');
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
            // Contar clientes cuyo fecha_alta está dentro de ese mes
            const count = data?.filter(c => {
                if (!c.fecha_alta) return false;
                const fecha = new Date(c.fecha_alta);
                return fecha >= start && fecha <= end;
            }).length || 0;
            dataArr.push(count);
        }
        // El mes actual es el último
        this.totalClientesNuevos = dataArr[dataArr.length - 1];

        this.newClientsChartData.labels = labels;
        this.newClientsChartData.datasets[0].data = dataArr;
    }

    // 🕒 ASISTENCIAS (ÚLTIMOS 15 DÍAS)
    async renderAttendanceChart() {
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

    this.attendanceChartData.labels = labels;
    this.attendanceChartData.datasets[0].data = dataArr;
    }

    // 🍩 DISTRIBUCIÓN DE MEMBRESÍAS
    async renderMembershipPie() {
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

    this.membershipPieData.labels = labels;
    this.membershipPieData.datasets[0].data = dataArr;
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
