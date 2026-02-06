const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sequelize, Salon, License, User, Professional, Client, Service, Product, Appointment, Transaction, Ticket, Message } = require('./database');

const app = express();
const PORT = 3001;
const nodemailer = require('nodemailer');

// --- EMAIL CONFIG (PONTO 7) ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    if (!process.env.EMAIL_USER) {
        console.log("⚠️ EMAIL NÃO CONFIGURADO. Logando no console:");
        console.log(`Para: ${to}\nAssunto: ${subject}\nCorpo: ${html}`);
        return;
    }
    try {
        await transporter.sendMail({ from: `"Xonguile App" <${process.env.EMAIL_USER}>`, to, subject, html });
        console.log(`✅ Email enviado para ${to}`);
    } catch (e) {
        console.error("❌ Erro ao enviar email:", e);
    }
};

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE: AUTH & TENANCY ---
// In a real app, use JWT. For this MVP, we send { 'x-user-id': 1 } in headers
const authenticate = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const token = req.query.token || req.headers['x-master-token'];

    // Bypass for public routes
    if (['/login', '/register-salon', '/admin-login-token'].includes(req.path) || req.path.startsWith('/public/')) return next();

    let user;
    if (token) {
        // Simple mock token: just find super admin by hardcoded email for this prototype
        user = await User.findOne({ where: { role: 'super_level_1' }, include: [{ model: Salon, include: [License] }] });
    } else if (userId) {
        user = await User.findByPk(userId, { include: [{ model: Salon, include: [License] }] });
    }

    if (!user) {
        console.log(`[AUTH] Failed to find user for userId:${userId} token:${token}`);
        return res.status(401).json({ error: 'Não autenticado' });
    }

    console.log(`[AUTH] User Authenticated: ${user.email} (Role: ${user.role})`);

    // Check License (Exclude Super Users)
    if (!['super_level_1', 'super_level_2'].includes(user.role)) {
        const license = user.Salon?.License;
        if (!license) return res.status(403).json({ error: 'Salão sem licença' });

        if (license.status !== 'active') return res.status(403).json({ error: 'Licença suspensa ou expirada. Efetue o pagamento para continuar.' });

        if (new Date() > new Date(license.validUntil)) {
            await license.update({ status: 'expired' });
            return res.status(403).json({ error: 'Licença expirou. Por favor renovar.' });
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

// 4. Get available professionals for a time (PONTO 2)
app.get('/public/salons/:id/slots', async (req, res) => {
    const { date, time } = req.query;
    const salonId = req.params.id;

    if (time) {
        // Se passar a hora, devolve profissionais livres
        const busyProfsIds = (await Appointment.findAll({
            where: { SalonId: salonId, date, startTime: time, status: { [require('sequelize').Op.ne]: 'cancelled' } }
        })).map(a => a.ProfessionalId || a.professionalId);

        const availableProfs = await Professional.findAll({
            where: { SalonId: salonId, active: true, id: { [require('sequelize').Op.notIn]: busyProfsIds.length ? busyProfsIds : [0] } }
        });
        return res.json(availableProfs);
    }

    // Se não passar a hora, devolve apenas as horas que têm pelo menos 1 profissional livre
    const apps = await Appointment.findAll({ where: { SalonId: salonId, date, status: { [require('sequelize').Op.ne]: 'cancelled' } } });
    const staffCount = await Professional.count({ where: { SalonId: salonId, active: true } });

    const slots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    const available = slots.filter(s => {
        const busyAtThisTime = apps.filter(a => a.startTime === s).length;
        return busyAtThisTime < staffCount; // Tem que ter pelo menos um livre
    });

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
    try {
        let { salonId, serviceId, date, startTime, time, clientData, professionalId } = req.body;
        if (!startTime && time) startTime = time;
        if (!startTime) startTime = '09:00';

        // Ensure startTime is a string for split()
        const startStr = String(startTime);

        const salon = await Salon.findByPk(salonId, { include: [License] });
        if (!salon || !salon.License) throw new Error("Salão não encontrado.");

        const result = await sequelize.transaction(async (t) => {
            let client = await Client.findOne({
                where: {
                    [require('sequelize').Op.or]: [
                        { xonguileId: clientData.xonguileId || '---' },
                        { phone: clientData.phone || '---' }
                    ]
                }
            }, { transaction: t });

            if (!client) {
                client = await Client.create({
                    ...clientData,
                    SalonId: salonId
                }, { transaction: t });
            }

            const service = await Service.findByPk(serviceId);
            const duration = service ? service.duration : 60;
            const [h, m] = startStr.split(':').map(Number);
            const endTime = new Date(0, 0, 0, h, m + (duration || 60)).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

            const app = await Appointment.create({
                date,
                startTime: startStr,
                endTime,
                price: service ? service.price : 0,
                status: 'scheduled',
                SalonId: salonId,
                ClientId: client.id,
                ServiceId: serviceId,
                ProfessionalId: professionalId || null
            }, { transaction: t });

            return { app, client };
        });

        res.json(result);
    } catch (e) {
        console.error('SERVER CRASH PREVENTED:', e);
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

            // PONTO 1: Trial com ACESSO TOTAL
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 14); // 14 Dias de teste

            await License.create({
                key: `TRL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                type: 'trial',
                status: 'active',
                validUntil: validUntil,
                bookingLimit: 999999, // Sem barreiras
                hasWaitingList: true, // Funcionalidades abertas
                reportLevel: 3,       // Tudo liberado para testar
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

// 1. Get all salons with license and admin info
app.get('/admin/salons', async (req, res) => {
    if (!['super_level_1', 'super_level_2', 'admin'].includes(req.user.role)) {
        console.log(`[403] Access Denied to /admin/salons. User role: ${req.user.role}`);
        return res.status(403).json({ error: 'Acesso negado' });
    }
    const salons = await Salon.findAll({
        include: [
            License,
            { model: User, where: { role: 'admin' }, required: false }
        ]
    });
    res.json(salons);
});

// 2. Impersonate Salon (ENTRAR NO SALÃO)
app.post('/admin/salons/:id/impersonate', async (req, res) => {
    if (req.user.role !== 'super_level_1') return res.status(403).json({ error: 'Apenas Master pode impersonar' });
    const admin = await User.findOne({ where: { SalonId: req.params.id, role: 'admin' }, include: [Salon] });
    if (!admin) return res.status(404).json({ error: 'Admin do salão não encontrado' });

    res.json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        SalonId: admin.SalonId,
        salon: {
            name: admin.Salon.name,
            slug: admin.Salon.slug,
            license: admin.Salon.License
        }
    });
});

// 3. Global Stats (RECEITAS GLOBAIS)
app.get('/admin/stats', async (req, res) => {
    if (!['super_level_1', 'super_level_2', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Acesso negado' });

    const licenseRevenue = (await Transaction.sum('amount', { where: { type: 'license_payment' } })) || 0;
    const totalGmv = (await Transaction.sum('amount', { where: { type: 'income' } })) || 0;
    const totalSalons = await Salon.count();
    const activeSalons = await License.count({ where: { status: 'active' } });

    res.json({
        licenseRevenue,
        totalGmv,
        totalSalons,
        activeSalons
    });
});

// 4. Update License
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

// 5. Create Super Assistant
app.post('/admin/create-super-2', async (req, res) => {
    if (req.user.role !== 'super_level_1') return res.status(403).json({ error: 'Apenas Super Nível 1 podem criar assistentes.' });
    const { name, email, password } = req.body;
    const user = await User.create({
        name, email, password, role: 'super_level_2'
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

// 6. Send Bulk Email (PONTO 7)
app.post('/admin/send-bulk-email', async (req, res) => {
    if (!['super_level_1', 'super_level_2'].includes(req.user.role)) return res.status(403).json({ error: 'Acesso negado' });
    const { target, subject, message } = req.body;

    let recipients = [];
    if (target === 'all_salons') {
        const users = await User.findAll({ where: { role: 'admin' } });
        recipients = users.map(u => u.email);
    } else if (target === 'all_clients') {
        const clients = await Client.findAll();
        recipients = clients.map(c => c.email).filter(e => e);
    } else if (target === 'active_licenses') {
        const activeSalons = await License.findAll({ where: { status: 'active' }, include: [Salon] });
        const ids = activeSalons.map(l => l.SalonId);
        const users = await User.findAll({ where: { SalonId: ids, role: 'admin' } });
        recipients = users.map(u => u.email);
    } else if (target === 'expired_licenses') {
        const expiredSalons = await License.findAll({ where: { status: 'expired' }, include: [Salon] });
        const ids = expiredSalons.map(l => l.SalonId);
        const users = await User.findAll({ where: { SalonId: ids, role: 'admin' } });
        recipients = users.map(u => u.email);
    }

    // Send emails (In prod use a queue!)
    for (const email of recipients) {
        await sendEmail(email, subject, message);
    }

    res.json({ success: true, count: recipients.length });
});

// --- COMMUNICATION (TICKETS/CHAT) ROUTES ---

app.get('/tickets', async (req, res) => {
    const where = ['super_level_1', 'super_level_2'].includes(req.user.role) ? {} : { SalonId: req.salonId };
    const tickets = await Ticket.findAll({
        where,
        include: [Salon, { model: Message, include: [User] }],
        order: [['createdAt', 'DESC']]
    });
    res.json(tickets);
});

app.post('/tickets', async (req, res) => {
    const { subject, priority, content } = req.body;
    const ticket = await Ticket.create({
        subject,
        priority: priority || 'medium',
        SalonId: req.salonId,
        status: 'open'
    });

    await Message.create({
        TicketId: ticket.id,
        UserId: req.user.id,
        content,
        senderRole: req.user.role
    });

    res.json(ticket);
});

app.post('/tickets/:id/messages', async (req, res) => {
    const { content } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });

    const message = await Message.create({
        TicketId: ticket.id,
        UserId: req.user.id,
        content,
        senderRole: req.user.role.includes('super') ? 'super_level_1' : 'admin'
    });

    // If super admin replies, set status to pending/resolved?
    if (req.user.role.includes('super')) {
        await ticket.update({ status: 'pending' });
    } else {
        await ticket.update({ status: 'open' });
    }

    res.json(message);
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
    const data = await Appointment.findAll({
        where,
        include: [Client, Service, Professional]
    });
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

// --- SUBSCRIPTION & PAYPAL ---
app.post('/subscription/activate', async (req, res) => {
    // In prod, verify with PayPal API!
    const { salonId, type } = req.body;
    const license = await License.findOne({ where: { SalonId: salonId } });
    if (license) {
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + (type.includes('year') ? 12 : 1));

        await license.update({
            status: 'active',
            type: type,
            validUntil: validUntil
        });
        res.json({ success: true, message: 'Subscrição ativada com sucesso!' });
    } else {
        res.status(404).json({ error: 'Licença não encontrada' });
    }
});

// --- SERVER START & BOOTSTRAP ---
const START_PORT = process.env.PORT || 3001;
app.listen(START_PORT, async () => {
    console.log(`🚀 XONGUILE SERVER RUNNING ON PORT ${START_PORT}`);
    try {
        await sequelize.sync();
        console.log('Database Synced.');

        // Ensure Master Admin exists regardless of salons
        const [adminSalon] = await Salon.findOrCreate({
            where: { slug: 'admin' },
            defaults: { name: 'Xonguile App Admin' }
        });

        const [masterUser, created] = await User.findOrCreate({
            where: { email: 'encubadoradesolucoes@gmail.com' },
            defaults: {
                name: 'Afonsinho Brown',
                password: '123',
                role: 'super_level_1',
                SalonId: adminSalon.id
            }
        });

        if (created) {
            console.log("✅ MASTER USER CREATED: encubadoradesolucoes@gmail.com / 123");

            // Create license for admin salon
            const validUntil = new Date();
            validUntil.setFullYear(validUntil.getFullYear() + 10);
            await License.findOrCreate({
                where: { SalonId: adminSalon.id },
                defaults: {
                    key: 'XONGUILE-ADMIN-MASTER-KEY',
                    type: 'premium_year',
                    status: 'active',
                    validUntil: validUntil,
                    bookingLimit: 999999,
                    hasWaitingList: true,
                    reportLevel: 3
                }
            });
        }
    } catch (error) {
        console.error('DB Connection Error:', error);
    }
});

// --- SUPER ADMIN: EMAIL MANAGEMENT ---
// Get all clients from all salons
app.get('/admin/clients', async (req, res) => {
    if (!['super_level_1', 'super_level_2', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    const clients = await Client.findAll({
        include: [{ model: Salon, attributes: ['id', 'name'] }],
        order: [['createdAt', 'DESC']]
    });
    res.json(clients);
});

// Send welcome email
app.post('/admin/send-email/welcome', async (req, res) => {
    if (!['super_level_1', 'super_level_2', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    const { clientIds } = req.body;
    const clients = await Client.findAll({ where: { id: clientIds } });

    for (const client of clients) {
        await sendEmail(
            client.email,
            'Bem-vindo à Xonguile App!',
            `<h2>Bem-vindo, ${client.name}!</h2><p>Estamos felizes em tê-lo conosco.</p>`
        );
    }
    res.json({ success: true, sent: clients.length });
});

// Send system restore email
app.post('/admin/send-email/restore', async (req, res) => {
    if (!['super_level_1', 'super_level_2', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    const { clientIds } = req.body;
    const clients = await Client.findAll({ where: { id: clientIds } });

    for (const client of clients) {
        await sendEmail(
            client.email,
            'Restauração do Sistema',
            `<h2>Aviso Importante</h2><p>Realizamos uma restauração no sistema. Seu acesso foi restaurado com sucesso!</p>`
        );
    }
    res.json({ success: true, sent: clients.length });
});

// Send custom email
app.post('/admin/send-email/custom', async (req, res) => {
    if (!['super_level_1', 'super_level_2', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    const { subject, body, clientIds, customEmails } = req.body;
    const allEmails = [];

    if (clientIds && clientIds.length > 0) {
        const clients = await Client.findAll({ where: { id: clientIds } });
        allEmails.push(...clients.map(c => c.email));
    }
    if (customEmails) {
        allEmails.push(...customEmails.filter(e => e && !allEmails.includes(e)));
    }

    for (const email of allEmails) {
        await sendEmail(email, subject, body);
    }
    res.json({ success: true, sent: allEmails.length });
});

// Server already started above with database sync
