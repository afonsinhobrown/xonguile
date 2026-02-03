const express = require('express');
const cors = require('cors');
const { sequelize, Salon, License, User, Professional, Client, Service, Product, Appointment, Transaction } = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE: AUTH & TENANCY ---
// In a real app, use JWT. For this MVP, we send { 'x-user-id': 1 } in headers
const authenticate = async (req, res, next) => {
    const userId = req.headers['x-user-id'];

    // Bypass for login/register
    if (req.path === '/login' || req.path === '/register-salon' || req.path.startsWith('/admin/')) return next();

    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const user = await User.findByPk(userId, { include: [{ model: Salon, include: [License] }] });
    if (!user) return res.status(401).json({ error: 'Usuário inválido' });

    // Check License
    if (user.role !== 'superadmin') {
        const license = user.Salon?.License;
        if (!license) return res.status(403).json({ error: 'Salão sem licença' });
        if (license.status !== 'active') return res.status(403).json({ error: 'Licença expirada ou suspensa' });
        if (new Date() > new Date(license.validUntil)) {
            // Auto expire
            await license.update({ status: 'expired' });
            return res.status(403).json({ error: 'Licença expirou hoje' });
        }
    }

    req.user = user;
    req.salonId = user.SalonId;
    next();
};

app.use(authenticate);

// --- AUTH ROUTES ---

// --- PUBLIC AUTH ROUTES ---

app.post('/register-salon', async (req, res) => {
    const { salonName, adminName, adminEmail, adminPassword, phone } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: adminEmail } });
        if (existingUser) {
            return res.status(400).json({ error: 'Este email já está em uso por outro salão.' });
        }

        const result = await sequelize.transaction(async (t) => {
            // 1. Create Salon
            const slugBase = salonName ? salonName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') : 'unnamed-salon';
            const slug = `${slugBase}-${Math.floor(Math.random() * 10000)}`;

            const salon = await Salon.create({
                name: salonName || 'Novo Salão',
                slug,
                phone: phone || ''
            }, { transaction: t });

            // 2. Create 10-Day Free Trial License
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 10); // +10 Days Trial

            await License.create({
                key: `TRIAL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                type: 'trial',
                status: 'active',
                validUntil: validUntil,
                SalonId: salon.id
            }, { transaction: t });

            // 3. Create Admin User
            const user = await User.create({
                name: adminName,
                email: adminEmail,
                password: adminPassword, // Hash in prod
                role: 'admin',
                SalonId: salon.id
            }, { transaction: t });

            return { salon, user };
        });

        res.json({ success: true, salon: result.salon });
    } catch (e) {
        console.error(e);
        res.status(400).json({ error: 'Erro ao registrar. Verifique os dados.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({
        where: { email, password },
        include: [{
            model: Salon,
            include: [License]
        }]
    });

    if (!user) return res.status(400).json({ error: 'Credenciais inválidas' });

    res.json({
        id: user.id,
        name: user.name,
        role: user.role,
        salon: user.Salon ? {
            name: user.Salon.name,
            slug: user.Salon.slug,
            license: user.Salon.License ? {
                type: user.Salon.License.type,
                validUntil: user.Salon.License.validUntil
            } : null
        } : null
    });
});

// --- SUPER ADMIN ROUTES --- (No salon filter)

// List all salons
app.get('/admin/salons', async (req, res) => {
    // Basic auth check (Should strictly be superadmin in prod)
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        // allowing 'admin' for demo purposes if they are the platform owner, 
        // but strictly the 'admin' of the platform shouldn't be confused with 'admin' of a salon.
        // For now, let's assume the user with ID 1 or specific email is the superadmin.
    }

    const salons = await Salon.findAll({
        include: [
            { model: License },
            { model: User, where: { role: 'admin' }, required: false, limit: 1 }
        ]
    });
    res.json(salons);
});

// Toggle Salon Status
app.put('/admin/salons/:id/status', async (req, res) => {
    const { status } = req.body;
    const salon = await Salon.findByPk(req.params.id, { include: [License] });

    if (salon && salon.License) {
        await salon.License.update({ status });
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Salão ou licença não encontrada' });
    }
});

app.post('/admin/create-salon', async (req, res) => {
    // Simplified creation
    const { salonName, adminEmail, adminPassword, licenseType, months } = req.body;

    try {
        const result = await sequelize.transaction(async (t) => {
            const salon = await Salon.create({ name: salonName, slug: salonName.toLowerCase().replace(/\s/g, '-') }, { transaction: t });

            const validUntil = new Date();
            validUntil.setMonth(validUntil.getMonth() + (months || 12));

            await License.create({
                key: `KEY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                type: licenseType || 'yearly',
                status: 'active',
                validUntil: validUntil,
                SalonId: salon.id
            }, { transaction: t });

            const user = await User.create({
                name: 'Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                SalonId: salon.id
            }, { transaction: t });

            return { salon, user };
        });
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao criar salão' });
    }
});

// --- SALON SETTINGS ROUTES ---

app.get('/salon/me', async (req, res) => {
    const salon = await Salon.findByPk(req.salonId);
    res.json(salon);
});

app.put('/salon/me', async (req, res) => {
    // Prevent changing critical fields like id or License
    const allowed = ['name', 'phone', 'email', 'address', 'nuit', 'logo', 'receiptFooter'];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await Salon.update(updates, { where: { id: req.salonId } });
    res.json({ success: true });
});

// --- USER MANAGEMENT ROUTES (For Tenant Admin) ---

app.get('/users', async (req, res) => {
    // Only allow admin/manager to see users? For now allow all
    const users = await User.findAll({
        where: { SalonId: req.salonId },
        attributes: ['id', 'name', 'email', 'role'] // Don't send passwords
    });
    res.json(users);
});

app.post('/users', async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Apenas administradores podem criar usuários' });
    }
    const { name, email, password, role } = req.body;
    try {
        const user = await User.create({
            name,
            email,
            password, // In prod hash this
            role: role || 'professional',
            SalonId: req.salonId
        });
        res.json({ id: user.id, name: user.name, email: user.email });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao criar usuário. Email já existe?' });
    }
});

app.delete('/users/:id', async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Apenas administradores podem remover usuários' });
    }
    if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({ error: 'Não pode excluir a si mesmo' });
    }
    await User.destroy({ where: { id: req.params.id, SalonId: req.salonId } });
    res.json({ success: true });
});

// --- TENANT ROUTES (Filtered by req.salonId) ---

const crudParams = (req) => ({ where: { SalonId: req.salonId } });
const attachSalon = (req) => ({ ...req.body, SalonId: req.salonId });

// Professionals
app.get('/professionals', async (req, res) => res.json(await Professional.findAll(crudParams(req))));
app.post('/professionals', async (req, res) => res.json(await Professional.create(attachSalon(req))));
app.delete('/professionals/:id', async (req, res) => {
    await Professional.destroy({ where: { id: req.params.id, SalonId: req.salonId } });
    res.json({ success: true });
});

// Clients
app.get('/clients', async (req, res) => res.json(await Client.findAll(crudParams(req))));
app.post('/clients', async (req, res) => res.json(await Client.create(attachSalon(req))));
app.delete('/clients/:id', async (req, res) => {
    await Client.destroy({ where: { id: req.params.id, SalonId: req.salonId } });
    res.json({ success: true });
});

// Services
app.get('/services', async (req, res) => res.json(await Service.findAll(crudParams(req))));
app.post('/services', async (req, res) => res.json(await Service.create(attachSalon(req))));
app.delete('/services/:id', async (req, res) => {
    await Service.destroy({ where: { id: req.params.id, SalonId: req.salonId } });
    res.json({ success: true });
});

// Products
app.get('/products', async (req, res) => res.json(await Product.findAll(crudParams(req))));
app.post('/products', async (req, res) => res.json(await Product.create(attachSalon(req))));
app.put('/products/:id', async (req, res) => {
    await Product.update(req.body, { where: { id: req.params.id, SalonId: req.salonId } });
    res.json({ success: true });
});

// Appointments
app.get('/appointments', async (req, res) => {
    const { date } = req.query;
    const where = { SalonId: req.salonId };
    if (date) where.date = date;
    const data = await Appointment.findAll({ where });
    res.json(data);
});
app.post('/appointments', async (req, res) => res.json(await Appointment.create(attachSalon(req))));
app.put('/appointments/:id', async (req, res) => {
    await Appointment.update(req.body, { where: { id: req.params.id, SalonId: req.salonId } });
    res.json({ success: true });
});

// Transactions
app.get('/transactions', async (req, res) => {
    const data = await Transaction.findAll({ where: { SalonId: req.salonId }, order: [['createdAt', 'DESC']] });
    res.json(data);
});
app.post('/transactions', async (req, res) => res.json(await Transaction.create(attachSalon(req))));

// --- SERVER START & BOOTSTRAP ---
app.listen(PORT, async () => {
    console.log(`SAAS SERVER RUNNING ON PORT ${PORT}`);
    try {
        await sequelize.sync();
        console.log('Database Synced.');

        // Bootstrap default salon if empty
        const count = await Salon.count();
        if (count === 0) {
            console.log("Creating Official Admin Tenant...");
            const salon = await Salon.create({ name: 'Xonguile App Admin', slug: 'admin' });

            // Lifetime license
            await License.create({
                key: 'XONGUILE-MASTER-001',
                type: 'lifetime',
                status: 'active',
                validUntil: new Date('2099-12-31'),
                SalonId: salon.id
            });

            // Default User
            await User.create({
                name: 'Afonsinho Brown',
                email: 'admin@angiarte.com',
                password: '123',
                role: 'admin',
                SalonId: salon.id
            });
            console.log("OFFICIAL ADMIN CREATED: admin@angiarte.com / 123");
        }

    } catch (error) {
        console.error('DB Connection Error:', error);
    }
});
