import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

    // Lista completa de productos
    products: Product[] = [
        // ROPA
        {
            id: 1,
            name: 'Musculosa Gym Córdoba',
            description: 'Musculosa de algodón, diseño exclusivo del gimnasio',
            price: 15000,
            stock: 12,
            image: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=Musculosa',
            category: 'Ropa'
        },
        {
            id: 2,
            name: 'Remera Gym Córdoba',
            description: 'Remera de poliéster, tecnología dry-fit',
            price: 18000,
            stock: 8,
            image: 'https://via.placeholder.com/300x300/ef4444/ffffff?text=Remera',
            category: 'Ropa'
        },
        {
            id: 3,
            name: 'Gorra Gym Córdoba',
            description: 'Gorra ajustable con logo bordado',
            price: 8000,
            stock: 25,
            image: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Gorra',
            category: 'Ropa'
        },
        {
            id: 4,
            name: 'Short Deportivo',
            description: 'Short con bolsillos y tecnología anti-humedad',
            price: 12000,
            stock: 15,
            image: 'https://via.placeholder.com/300x300/10b981/ffffff?text=Short',
            category: 'Ropa'
        },

        // SUPLEMENTOS
        {
            id: 5,
            name: 'Proteína Whey 1kg',
            description: 'Proteína de suero de leche, sabor chocolate',
            price: 45000,
            stock: 20,
            image: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Proteína',
            category: 'Suplementos'
        },
        {
            id: 6,
            name: 'Creatina Monohidratada 300g',
            description: 'Creatina pura para aumentar fuerza y masa muscular',
            price: 25000,
            stock: 18,
            image: 'https://via.placeholder.com/300x300/f97316/ffffff?text=Creatina',
            category: 'Suplementos'
        },
        {
            id: 7,
            name: 'Quemador de Grasa Termogénico',
            description: 'Suplemento termogénico para acelerar metabolismo',
            price: 32000,
            stock: 10,
            image: 'https://via.placeholder.com/300x300/ef4444/ffffff?text=Quemador',
            category: 'Suplementos'
        },
        {
            id: 8,
            name: 'BCAA Aminoácidos 500g',
            description: 'Aminoácidos de cadena ramificada para recuperación',
            price: 35000,
            stock: 14,
            image: 'https://via.placeholder.com/300x300/06b6d4/ffffff?text=BCAA',
            category: 'Suplementos'
        },

        // BEBIDAS
        {
            id: 9,
            name: 'Monster Energy 473ml',
            description: 'Bebida energética sabor original',
            price: 3500,
            stock: 50,
            image: 'https://via.placeholder.com/300x300/000000/ffffff?text=Monster',
            category: 'Bebidas'
        },
        {
            id: 10,
            name: 'Powerade 500ml',
            description: 'Bebida isotónica sabor naranja',
            price: 2500,
            stock: 45,
            image: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Powerade',
            category: 'Bebidas'
        },
        {
            id: 11,
            name: 'Gatorade 500ml',
            description: 'Bebida hidratante sabor limón',
            price: 2800,
            stock: 40,
            image: 'https://via.placeholder.com/300x300/10b981/ffffff?text=Gatorade',
            category: 'Bebidas'
        },
        {
            id: 12,
            name: 'Red Bull 250ml',
            description: 'Bebida energética en lata',
            price: 4000,
            stock: 35,
            image: 'https://via.placeholder.com/300x300/ef4444/ffffff?text=Red+Bull',
            category: 'Bebidas'
        }
    ];

    // Productos filtrados (por búsqueda y categoría)
    filteredProducts: Product[] = [...this.products];

    constructor() { }

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

        alert(`Venta procesada por $${this.getTotal().toLocaleString('es-AR')} con método de pago: ${this.selectedPaymentMethod}`);
        this.cart = [];
        this.showCart = false;
    }
}