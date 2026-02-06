const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getHeaders = () => {
    const user = localStorage.getItem('salao_user');
    const token = localStorage.getItem('salon_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (user) {
        try {
            const userData = JSON.parse(user);
            headers['x-user-id'] = userData.id;
        } catch (e) {
            console.error("Error parsing user data", e);
        }
    }
    if (token) {
        headers['x-master-token'] = token;
        headers['Authorization'] = `Bearer ${token}`; // Compatibility
    }
    return headers;
};

const handleResponse = async (res: Response) => {
    const data = await res.json();
    if (!res.ok) {
        // If it's a 403/401, maybe we should redirect to login?
        if (res.status === 401 || res.status === 403) {
            console.error("Auth error:", data);
        }
        throw data;
    }
    return data;
};

export const api = {
    // Auth
    login: async (creds: any) => fetch(`${API_URL}/login`, {
        method: 'POST', body: JSON.stringify(creds), headers: { 'Content-Type': 'application/json' }
    }).then(handleResponse),

    registerSalon: async (data: any) => fetch(`${API_URL}/register-salon`, {
        method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }
    }).then(handleResponse),

    // Professionals
    getProfessionals: async () => fetch(`${API_URL}/professionals`, { headers: getHeaders() }).then(handleResponse).catch(() => []),
    addProfessional: async (data: any) => fetch(`${API_URL}/professionals`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),
    deleteProfessional: async (id: number) => fetch(`${API_URL}/professionals/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

    // Clients
    getClients: async () => fetch(`${API_URL}/clients`, { headers: getHeaders() }).then(handleResponse).catch(() => []),
    addClient: async (data: any) => fetch(`${API_URL}/clients`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),
    deleteClient: async (id: number) => fetch(`${API_URL}/clients/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

    // Services
    getServices: async () => fetch(`${API_URL}/services`, { headers: getHeaders() }).then(handleResponse).catch(() => []),
    addService: async (data: any) => fetch(`${API_URL}/services`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),
    deleteService: async (id: number) => fetch(`${API_URL}/services/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

    // Products
    getProducts: async () => fetch(`${API_URL}/products`, { headers: getHeaders() }).then(handleResponse).catch(() => []),
    addProduct: async (data: any) => fetch(`${API_URL}/products`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),
    updateProduct: async (id: number, data: any) => fetch(`${API_URL}/products/${id}`, {
        method: 'PUT', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),

    // Appointments
    getAppointments: async (date?: string) => {
        let url = `${API_URL}/appointments`;
        if (date) url += `?date=${date}`;
        return fetch(url, { headers: getHeaders() }).then(handleResponse).catch(() => []);
    },
    addAppointment: async (data: any) => fetch(`${API_URL}/appointments`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),
    updateAppointment: async (id: number, data: any) => fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),

    // Transactions
    getTransactions: async () => fetch(`${API_URL}/transactions`, { headers: getHeaders() }).then(handleResponse).catch(() => []),
    addTransaction: async (data: any) => fetch(`${API_URL}/transactions`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),

    // Salon Settings
    getSalon: async () => fetch(`${API_URL}/salon/me`, { headers: getHeaders() }).then(handleResponse),
    updateSalon: async (data: any) => fetch(`${API_URL}/salon/me`, {
        method: 'PUT', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),

    // User Management
    getUsers: async () => fetch(`${API_URL}/users`, { headers: getHeaders() }).then(handleResponse).catch(() => []),
    addUser: async (data: any) => fetch(`${API_URL}/users`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),
    deleteUser: async (id: number) => fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

    // Platform Admin
    getSuperStats: async () => fetch(`${API_URL}/admin/stats`, { headers: getHeaders() }).then(handleResponse).catch(() => null),
    getSuperSalons: async () => fetch(`${API_URL}/admin/salons`, { headers: getHeaders() }).then(handleResponse).catch(() => []),
    updateSuperLicense: async (id: number, data: any) => fetch(`${API_URL}/admin/salons/${id}/license`, {
        method: 'PUT', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),
    createSuperAssistant: async (data: any) => fetch(`${API_URL}/admin/create-super-2`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),
    impersonateSalon: async (id: number) => fetch(`${API_URL}/admin/salons/${id}/impersonate`, {
        method: 'POST', headers: getHeaders()
    }).then(handleResponse),

    // Communication
    sendBulkEmail: async (data: any) => fetch(`${API_URL}/admin/send-bulk-email`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),

    getTickets: async () => fetch(`${API_URL}/tickets`, { headers: getHeaders() }).then(handleResponse).catch(() => []),
    addTicket: async (data: any) => fetch(`${API_URL}/tickets`, {
        method: 'POST', body: JSON.stringify(data), headers: getHeaders()
    }).then(handleResponse),
    addTicketMessage: async (id: number, content: string) => fetch(`${API_URL}/tickets/${id}/messages`, {
        method: 'POST', body: JSON.stringify({ content }), headers: getHeaders()
    }).then(handleResponse),

    // Public
    publicListSalons: async () => fetch(`${API_URL}/public/salons`).then(handleResponse),
    publicSearchServices: async (q: string) => fetch(`${API_URL}/public/search-services?q=${q}`).then(handleResponse),
    publicGetSalon: async (id: string) => fetch(`${API_URL}/public/salons/${id}`).then(handleResponse),
    publicGetSlots: async (id: string, date: string, time?: string) => {
        let url = `${API_URL}/public/salons/${id}/slots?date=${date}`;
        if (time) url += `&time=${time}`;
        return fetch(url).then(handleResponse);
    },
    publicClientLookup: async (params: any) => {
        const query = new URLSearchParams(params).toString();
        return fetch(`${API_URL}/public/client-lookup?${query}`).then(handleResponse);
    },
    publicBook: async (data: any) => fetch(`${API_URL}/public/book-appointment`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    }).then(handleResponse),

    // Subscriptions
    activateSubscription: async (salonId: number, type: string) => fetch(`${API_URL}/subscription/activate`, {
        method: 'POST', body: JSON.stringify({ salonId, type }), headers: getHeaders()
    }).then(handleResponse),

    // Super Admin: Email Management
    getSuperAdminClients: async () => fetch(`${API_URL}/admin/clients`, { headers: getHeaders() }).then(handleResponse).catch(() => []),
    sendWelcomeEmail: async (clientIds: number[]) => fetch(`${API_URL}/admin/send-email/welcome`, {
        method: 'POST', body: JSON.stringify({ clientIds }), headers: getHeaders()
    }).then(handleResponse),
    sendRestoreEmail: async (clientIds: number[]) => fetch(`${API_URL}/admin/send-email/restore`, {
        method: 'POST', body: JSON.stringify({ clientIds }), headers: getHeaders()
    }).then(handleResponse),
    sendCustomEmail: async (subject: string, body: string, clientIds: number[], customEmails: string[]) => fetch(`${API_URL}/admin/send-email/custom`, {
        method: 'POST', body: JSON.stringify({ subject, body, clientIds, customEmails }), headers: getHeaders()
    }).then(handleResponse),
};
