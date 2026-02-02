import Dexie, { type Table } from 'dexie';

// ... (Existing interfaces)

export interface Product {
    id?: number;
    name: string;
    description?: string;
    price: number; // Selling price
    cost: number; // Cost price
    quantity: number;
    minQuantity: number; // For alerts
    category: 'resale' | 'internal'; // Resale or Internal Use
    barcode?: string;
}

export interface ProductMovement {
    id?: number;
    productId: number;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    date: Date;
    reason?: string;
}

export class SalaoDexie extends Dexie {
    clients!: Table<Client>;
    professionals!: Table<Professional>;
    services!: Table<Service>;
    appointments!: Table<Appointment>;
    transactions!: Table<Transaction>;
    products!: Table<Product>;          // New
    productMovements!: Table<ProductMovement>; // New

    constructor() {
        super('SalaoAppDB');
        this.version(1).stores({
            clients: '++id, name, phone',
            professionals: '++id, name, role',
            services: '++id, name',
            appointments: '++id, date, status, clientId, professionalId',
            transactions: '++id, date, type, category',
        });

        // Add version 2 for products schema migration
        this.version(2).stores({
            products: '++id, name, category, barcode',
            productMovements: '++id, productId, date, type'
        });
    }
}

export const db = new SalaoDexie();
// ...
