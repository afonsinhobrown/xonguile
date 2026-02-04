const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getHeaders = () => {
    const user = localStorage.getItem('salao_user');
    const headers: any = { 'Content-Type': 'application/json' };
    if (user) {
        const userData = JSON.parse(user);
        headers['x-user-id'] = userData.id;
    }
    return headers;
};

export const api = {
    // Auth
    login: async (creds: any) => fetch(`${API_URL}/login`, {
        method: 'POST', body: JSON.stringify(creds), headers: { 'Content-Type': 'application/json' }
    }).then(async res => {
        if (!res.ok) throw await res.json();
        return res.json();
    }),

    registerSalon: async (data: any) => fetch(`${API_URL}/register-salon`, {
        method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }
    }).then(async res => {
        if (!res.ok) throw await res.json();
        return res.json();
    }),

    // Professionals
    getProfessionals: async () => fetch(`${API_URL}/professionals`, { headers: getHeaders() }).then(res => res.json()),
    addProfessional: async (data: any) => fetch(`${API_URL}/professionals`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),
    deleteProfessional: async (id: number) => fetch(`${API_URL}/professionals/${id}`, { method: 'DELETE', headers: getHeaders() }),

    // Clients
    getClients: async () => fetch(`${API_URL}/clients`, { headers: getHeaders() }).then(res => res.json()),
    addClient: async (data: any) => fetch(`${API_URL}/clients`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),
    deleteClient: async (id: number) => fetch(`${API_URL}/clients/${id}`, { method: 'DELETE', headers: getHeaders() }),

    // Services
    getServices: async () => fetch(`${API_URL}/services`, { headers: getHeaders() }).then(res => res.json()),
    addService: async (data: any) => fetch(`${API_URL}/services`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),
    deleteService: async (id: number) => fetch(`${API_URL}/services/${id}`, { method: 'DELETE', headers: getHeaders() }),

    // Products
    getProducts: async () => fetch(`${API_URL}/products`, { headers: getHeaders() }).then(res => res.json()),
    addProduct: async (data: any) => fetch(`${API_URL}/products`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),
    updateProduct: async (id: number, data: any) => fetch(`${API_URL}/products/${id}`, {
        method: 'PUT', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),

    // Appointments
    getAppointments: async (date?: string) => {
        let url = `${API_URL}/appointments`;
        if (date) url += `?date=${date}`;
        return fetch(url, { headers: getHeaders() }).then(res => res.json());
    },
    addAppointment: async (data: any) => fetch(`${API_URL}/appointments`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),
    updateAppointment: async (id: number, data: any) => fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),

    // Transactions
    getTransactions: async () => fetch(`${API_URL}/transactions`, { headers: getHeaders() }).then(res => res.json()),
    addTransaction: async (data: any) => fetch(`${API_URL}/transactions`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),

    // Salon Settings
    getSalon: async () => fetch(`${API_URL}/salon/me`, { headers: getHeaders() }).then(res => res.json()),
    updateSalon: async (data: any) => fetch(`${API_URL}/salon/me`, {
        method: 'PUT', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),

    // User Management
    getUsers: async () => fetch(`${API_URL}/users`, { headers: getHeaders() }).then(res => res.json()),
    addUser: async (data: any) => fetch(`${API_URL}/users`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),
    deleteUser: async (id: number) => fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: getHeaders() }),
    // Platform Admin
    adminTokenRequest: async () => fetch(`${API_URL}/admin-login-token`, { method: 'POST' }).then(res => res.json()),
    getSuperSalons: async () => fetch(`${API_URL}/admin/salons`, { headers: getHeaders() }).then(res => res.json()),
    updateSuperLicense: async (id: number, data: any) => fetch(`${API_URL}/admin/salons/${id}/license`, {
        method: 'PUT', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),
    createSuperAssistant: async (data: any) => fetch(`${API_URL}/admin/create-super-2`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(res => res.json()),

    // --- PUBLIC METHODS ---
    publicListSalons: async () => fetch(`${API_URL}/public/salons`).then(res => res.json()),
    publicSearchServices: async (q: string) => fetch(`${API_URL}/public/search-services?q=${q}`).then(res => res.json()),
    publicGetSalon: async (id: string) => fetch(`${API_URL}/public/salons/${id}`).then(res => res.json()),
    publicGetSlots: async (id: string, date: string) => fetch(`${API_URL}/public/salons/${id}/slots?date=${date}`).then(res => res.json()),
    publicClientLookup: async (params: any) => {
        const query = new URLSearchParams(params).toString();
        return fetch(`${API_URL}/public/client-lookup?${query}`).then(res => res.json());
    },
    publicBook: async (data: any) => fetch(`${API_URL}/public/book-appointment`, {
        method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
};
