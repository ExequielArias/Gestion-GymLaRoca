import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../clientes/error-dialog.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { SuccessDialogComponent } from '../clientes/success-dialog.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TiendaService } from './tienda.service';
import { supabase } from '../supabase.client';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    image: string;
    category: 'Todos' | 'Ropa' | 'Suplementos' | 'Bebidas';
}

@Component({
    selector: 'app-tienda',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './tienda.component.html'
})
export class TiendaComponent {
    searchTerm = '';
    currentCategory: 'Todos' | 'Ropa' | 'Suplementos' | 'Bebidas' = 'Todos';
    categories: ('Todos' | 'Ropa' | 'Suplementos' | 'Bebidas')[] = ['Todos', 'Ropa', 'Suplementos', 'Bebidas'];
    showCart = false;
    selectedPaymentMethod = 'efectivo';

    // Carrito de compras
    cart: any[] = [];

    // Lista completa de productos (se cargará desde Supabase)
    products: Product[] = [];

    // Productos filtrados (por búsqueda y categoría)
    filteredProducts: Product[] = [];

    constructor(private dialog: MatDialog, private tiendaService: TiendaService) { }

    async ngOnInit() {
        try {
            const productos = await this.tiendaService.getProductos();
            console.debug('[TiendaComponent] productos raw from service:', productos);
            // Normalizar categorías (evita problemas por mayúsculas, espacios o sinónimos)
            this.products = productos.map(p => {
                const rawCat = (p.Categoria ?? '').toString().trim().toLowerCase();
                let category: Product['category'] = 'Todos';

                if (['bebidas', 'bebida', 'drink', 'drinks'].includes(rawCat)) category = 'Bebidas';
                else if (['ropa', 'vestimenta', 'clothing'].includes(rawCat)) category = 'Ropa';
                else if (['suplementos', 'suplemento', 'supplement', 'supplements'].includes(rawCat)) category = 'Suplementos';
                else if (rawCat === '') category = 'Todos';
                else {
                    // si viene algo distinto, intentar capitalizar primera letra y usar como categoría conocida
                    const capitalized = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
                    if (capitalized === 'Bebidas' || capitalized === 'Ropa' || capitalized === 'Suplementos') {
                        category = capitalized as Product['category'];
                    } else {
                        // fallback a 'Todos' para que no desaparezca el producto
                        category = 'Todos';
                    }
                }

                return {
                    id: Number(p.id),
                    name: p.Nombre,
                    description: p.Descripcion ?? '',
                    price: Number(p.Precio ?? 0),
                    stock: Number(p.Cantidad ?? 0),
                    image: p.imageUrl ?? 'https://via.placeholder.com/300x300?text=Sin+imagen',
                    category
                };
            });
            console.debug('[TiendaComponent] mapped products:', this.products.length);
            this.filterProducts();
        } catch (err) {
            console.error('Error cargando productos desde Supabase', err);
        }
    }

    // Filtrar productos por categoría y búsqueda
    setCategory(category: 'Todos' | 'Ropa' | 'Suplementos' | 'Bebidas') {
        this.currentCategory = category;
        this.filterProducts();
    }

    filterProducts() {
        this.filteredProducts = this.products.filter(product => {
            const matchesCategory = this.currentCategory === 'Todos' || product.category === this.currentCategory;
            const matchesSearch = product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(this.searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }

    // Carrito de compras
    toggleCart() {
        this.showCart = !this.showCart;
    }

    addToCart(product: Product) {
        if (product.stock <= 0) return;

        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            }
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
    }

    increaseQuantity(item: any) {
        const product = this.products.find(p => p.id === item.id);
        if (product && item.quantity < product.stock) {
            item.quantity++;
        }
    }

    decreaseQuantity(item: any) {
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            this.removeFromCart(item);
        }
    }

    removeFromCart(item: any) {
        this.cart = this.cart.filter(cartItem => cartItem.id !== item.id);
    }

    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    processSale() {
        if (this.cart.length === 0) return;

        // Proceso dependiendo del método de pago
        if (this.selectedPaymentMethod === 'efectivo') {
            this.handleImmediatePayment();
            return;
        }

        if (this.selectedPaymentMethod === 'transferencia') {
            // Abrir diálogo de espera/confirmación; el dueño verificará y confirmará
            const ref = this.dialog.open(ConfirmDialogComponent, {
                data: {
                    title: 'Transferencia bancaria',
                    message: 'Esperando acreditación de la transferencia. Cuando el pago sea confirmado por el dueño, presione "Pago acreditado". Si desea cancelar, presione "Cancelar".',
                    confirmLabel: 'Pago acreditado',
                    cancelLabel: 'Cancelar'
                }
            });

            ref.afterClosed().subscribe(async (confirmed: boolean) => {
                if (confirmed) {
                    await this.handleImmediatePayment();
                } else {
                    this.dialog.open(ErrorDialogComponent, { data: { message: 'La compra fue cancelada.' } });
                }
            });
            return;
        }
    }

    private async handleImmediatePayment() {
        // Verificar stock en el cliente antes de intentar procesar
        for (const item of this.cart) {
            const product = this.products.find(p => p.id === item.id);
            if (!product) {
                this.dialog.open(ErrorDialogComponent, { data: { message: `Producto con id ${item.id} no encontrado.` } });
                return;
            }
            if (item.quantity > product.stock) {
                this.dialog.open(ErrorDialogComponent, { data: { message: `Stock insuficiente para ${product.name}. Stock actual: ${product.stock}` } });
                return;
            }
        }

        // Preparar payload para el servicio
        const payload = this.cart.map(i => ({ id: i.id, quantity: i.quantity }));

        const result = await this.tiendaService.applySale(payload);
        if (!result || !result.success) {
            console.error('Error aplicando la venta:', result);
            this.dialog.open(ErrorDialogComponent, { data: { message: 'Ocurrió un error al procesar la venta. Revisar consola para detalles.' } });
            return;
        }

        // Actualizar stock en frontend
        for (const item of this.cart) {
            const prod = this.products.find(p => p.id === item.id);
            if (prod) {
                prod.stock = Math.max(0, prod.stock - item.quantity);
            }
        }
        this.filterProducts();

        // Registrar la venta en la tabla 'pagos' para que el dashboard la lea
        try {
            const totalAmount = this.getTotal();
            const fechaPago = new Date().toISOString();

            // Intentar insertar ventas por ítem en la tabla 'ventas' (si existe)
            const ventaRows = this.cart.map(item => ({
                fecha: fechaPago,
                producto_id: item.id,
                cantidad: item.quantity,
                precio_unitario: item.price,
                total: Number(item.price) * Number(item.quantity)
            }));

            try {
                const { error: ventasErr } = await supabase.from('ventas').insert(ventaRows);
                if (ventasErr) {
                    // Si falla, intentar insertar en 'pagos_items' (si existe) o volver al fallback a 'pagos'
                    console.warn('No se pudo insertar en tabla ventas, error:', ventasErr.message || ventasErr);
                    // Intentar insertar items en 'pagos_items'
                    try {
                        const pagosItems = ventaRows.map(v => ({ fecha_pago: v.fecha, producto_id: v.producto_id, cantidad: v.cantidad, precio_unitario: v.precio_unitario, total: v.total }));
                        const { error: pagosItemsErr } = await supabase.from('pagos_items').insert(pagosItems);
                        if (pagosItemsErr) {
                            console.warn('No se pudo insertar en pagos_items:', pagosItemsErr.message || pagosItemsErr);
                            // Fallback: insertar un resumen en 'pagos' (como antes)
                            const { error: pagoError } = await supabase.from('pagos').insert([
                                { fecha_pago: fechaPago, monto: totalAmount, metodo_pago: this.selectedPaymentMethod }
                            ]);
                            if (pagoError) console.error('Error registrando venta en pagos (fallback):', pagoError);
                        }
                    } catch (e) {
                        console.error('Error intentando insertar en pagos_items:', e);
                    }
                }
            } catch (e) {
                console.warn('Excepción insertando en ventas:', e);
                // Fallback: insertar un resumen en 'pagos'
                const { error: pagoError } = await supabase.from('pagos').insert([
                    { fecha_pago: fechaPago, monto: totalAmount, metodo_pago: this.selectedPaymentMethod }
                ]);
                if (pagoError) console.error('Error registrando venta en pagos (fallback):', pagoError);
            }

            // Notificar a otros componentes (ej. dashboard) que hay nuevos datos
            try {
                // Incluir detalle de items para permitir actualización optimista en el cliente
                window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'tienda', monto: totalAmount, items: ventaRows } }));
            } catch (e) {
                try { window.dispatchEvent(new Event('data-updated')); } catch (e2) { /* ignore */ }
            }
        } catch (e) {
            console.error('Error al intentar registrar venta en la base de datos:', e);
        }

        this.dialog.open(SuccessDialogComponent, { data: { message: `Venta procesada por $${this.getTotal().toLocaleString('es-AR')} con método de pago: ${this.selectedPaymentMethod}` } });
        this.cart = [];
        this.showCart = false;
    }
}