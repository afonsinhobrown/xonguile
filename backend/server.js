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
    const token = req.query.token;

    // Bypass for public routes
    if (['/login', '/register-salon', '/admin-login-token'].includes(req.path) || req.path.startsWith('/public/')) return next();

    let user;
    if (token) {
        // Simple mock token: just find super admin by hardcoded email for this prototype
        user = await User.findOne({ where: { email: 'vampire@xonguile.com' }, include: [{ model: Salon, include: [License] }] });
    } else if (userId) {
        user = await User.findByPk(userId, { include: [{ model: Salon, include: [License] }] });
    }

    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    // Check License (Exclude Super Users)
    if (!['super_level_1', 'super_level_2'].includes(user.role)) {
        const license = user.Salon?.License;
        if (!license) return res.status(403).json({ error: 'Salão sem licença' });

        // Show trial message if in trial
        req.isTrial = license.type === 'trial';

        if (license.status !== 'active') return res.status(403).json({ error: 'Licença expirada ou suspensa' });
        if (new Date() > new Date(license.validUntil)) {
            await license.update({ status: 'expired' });
            return res.status(403).json({ error: 'Licença expirou hoje' });
        }
    }

    req.user = user;
    req.salonId = user.SalonId;
    next();
};

// Admin Token Simulation
app.post('/admin-login-token', async (req, res) => {
    const adminEmail = 'vampire@xonguile.com';
    console.log(`[TOKEN_SENT] Admin Token Link sent to ${adminEmail}: http://localhost:5173/login?token=XONGUILE-ADMIN-MASTER-TOKEN`);
    res.json({ success: true, message: 'Link de acesso enviado para o email do administrador.' });
});

app.use(authenticate);

// --- AUTH ROUTES ---

// --- PUBLIC EXPLORATION & BOOKING ROUTES ---

// 1. List all salons
app.get('/public/salons', async (req, res) => {
    const salons = await Salon.findAll({
        include: [{ model: License, where: { status: 'active' } }]
    });
    res.json(salons);
});

// 2. Search salons by service
app.get('/public/search-services', async (req, res) => {
    const { q } = req.query;
    const services = await Service.findAll({
        where: {
            name: { [require('sequelize').Op.iLike || require('sequelize').Op.like]: `%${q}%` },
            active: true
        },
        include: [Salon]
    });
    // Group by salon to show a list of salons
    const salons = services.map(s => s.Salon).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    res.json(salons);
});

// 3. Get salon details & services
app.get('/public/salons/:id', async (req, res) => {
    const salon = await Salon.findByPk(req.params.id, {
        include: [Service, Professional]
    });
    res.json(salon);
});

// 4. Get available slots (Simplified: return 08:00 to 18:00 check against existing apps)
app.get('/public/salons/:id/slots', async (req, res) => {
    const { date } = req.query;
    const apps = await Appointment.findAll({ where: { SalonId: req.params.id, date } });
    const busyTimes = apps.map(a => a.startTime);

    const slots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const available = slots.filter(s => !busyTimes.includes(s));
    res.json(available);
});

// 5. Client Lookup
app.get('/public/client-lookup', async (req, res) => {
    const { xonguileId, phone, email } = req.query;
    let client = null;
    if (xonguileId) client = await Client.findOne({ where: { xonguileId } });
    if (!client && phone) client = await Client.findOne({ where: { phone } });
    if (!client && email) client = await Client.findOne({ where: { email } });

    res.json(client);
});

// 6. Public Booking
app.post('/public/book-appointment', async (req, res) => {
    const { salonId, serviceId, date, startTime, clientData } = req.body;

    try {
        // Enforce Plan Limits
        const salon = await Salon.findByPk(salonId, { include: [License] });
        if (!salon || !salon.License) throw new Error("Salão não encontrado ou sem licença.");

        const limit = salon.License.bookingLimit || 50;

        // Count appointments for the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const count = await Appointment.count({
            where: {
                SalonId: salonId,
                createdAt: { [require('sequelize').Op.gte]: startOfMonth }
            }
        });

        if (count >= limit) {
            throw new Error(`Este salão atingiu o limite de agendamentos online para o plano atual (${limit}). Por favor, contacte o salão diretamente.`);
        }

        const result = await sequelize.transaction(async (t) => {
            // Find or Create Client
            let client = null;
            if (clientData.xonguileId) client = await Client.findOne({ where: { xonguileId: clientData.xonguileId } }, { transaction: t });

            if (!client) {
                // Secondary check by phone/email to avoid duplicates
                client = await Client.findOne({
                    where: {
                        [require('sequelize').Op.or]: [
                            { phone: clientData.phone || 'ignore' },
                            { email: clientData.email || 'ignore' }
                        ]
                    }
                }, { transaction: t });
            }

            let isNew = false;
            if (!client) {
                client = await Client.create({
                    ...clientData,
                    SalonId: salonId,
                    xonguileId: `XON-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
                }, { transaction: t });
                isNew = true;
            }

            const service = await Service.findByPk(serviceId);

            const app = await Appointment.create({
                date,
                startTime,
                price: service.price,
                status: 'scheduled',
                SalonId: salonId,
                ClientId: client.id,
                ServiceId: serviceId
            }, { transaction: t });

            return { app, client, isNew };
        });

        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

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

// --- SUPER ADMIN ROUTES ---

// 1. Get all salons with license info
app.get('/admin/salons', async (req, res) => {
    if (!['super_level_1', 'super_level_2'].includes(req.user.role)) return res.status(403).json({ error: 'Acesso negado' });
    const salons = await Salon.findAll({
        include: [
            License,
            { model: User, where: { role: 'admin' }, required: false }
        ]
    });
    res.json(salons);
});

// 2. Update Salon Status or License
app.put('/admin/salons/:id/license', async (req, res) => {
    if (!['super_level_1', 'super_level_2'].includes(req.user.role)) return res.status(403).json({ error: 'Acesso negado' });
    const { type, status, validUntil, bookingLimit, hasWaitingList, reportLevel } = req.body;
    const license = await License.findOne({ where: { SalonId: req.params.id } });
    if (license) {
        await license.update({ type, status, validUntil, bookingLimit, hasWaitingList, reportLevel });
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Licença não encontrada' });
    }
});

// 3. Create Super Level 2 User (Level 1 only)
app.post('/admin/create-super-2', async (req, res) => {
    if (req.user.role !== 'super_level_1') return res.status(403).json({ error: 'Apenas Super Nível 1 podem criar assistentes.' });
    const { name, email, password } = req.body;
    const user = await User.create({
        name, email, password, role: 'super_level_2', parentId: req.user.id
    });
    res.json(user);
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

            // 10-Day Trial (No lifetime)
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 10);

            await License.create({
                key: 'XONGUILE-ADMIN-TRIAL',
                type: 'trial',
                status: 'active',
                validUntil: validUntil,
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
        } else {
            // FIX: Convert any existing lifetime license to 10-day trial starting today
            const lifetimeLicenses = await License.findAll({ where: { type: 'lifetime' } });
            if (lifetimeLicenses.length > 0) {
                console.log(`--- Corrigindo ${lifetimeLicenses.length} licenças vitalícias ---`);
                const trialUntil = new Date();
                trialUntil.setDate(trialUntil.getDate() + 10);

                for (const lic of lifetimeLicenses) {
                    await lic.update({
                        type: 'trial',
                        validUntil: trialUntil,
                        key: `FIX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
                    });
                }
                console.log('--- Licenças vitalícias corrigidas com sucesso ---');
            }
        }

    } catch (error) {
        console.error('DB Connection Error:', error);
    }
});
