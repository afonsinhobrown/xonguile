const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// --- DATABASE CONNECTION STRATEGY ---
// Cloud (PostgreSQL) or Local (SQLite)
const DATABASE_URL = process.env.DATABASE_URL;

let sequelize;

if (DATABASE_URL) {
    // CLOUD MODE (PostgreSQL)
    console.log("🔌 Connecting to CLOUD Database (PostgreSQL)...");
    sequelize = new Sequelize(DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    // OFFLINE/LOCAL MODE (SQLite)
    console.log("🔌 Connecting to LOCAL Database (SQLite)...");
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, 'salao_saas.sqlite'),
        logging: false
    });
}

// --- SAAS CORE MODELS ---

// 1. The Tenant (The Salon Company)
const Salon = sequelize.define('Salon', {
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true }, // unique url or id
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    address: DataTypes.STRING,
    // Receipt Configuration
    nuit: DataTypes.STRING, // Tax ID
    logo: DataTypes.TEXT, // Base64 string for logo
    receiptFooter: DataTypes.STRING
});

// 2. The License (Control Access)
const License = sequelize.define('License', {
    key: { type: DataTypes.STRING, unique: true },
    type: { type: DataTypes.ENUM('trial', 'standard_month', 'standard_year', 'gold_month', 'gold_year', 'premium_month', 'premium_year'), defaultValue: 'trial' },
    status: { type: DataTypes.ENUM('active', 'expired', 'suspended'), defaultValue: 'active' },
    validUntil: { type: DataTypes.DATE, allowNull: false },
    bookingLimit: { type: DataTypes.INTEGER, defaultValue: 50 }, // 50, 70, or 999999 for unlimited
    hasWaitingList: { type: DataTypes.BOOLEAN, defaultValue: false }, // Premium only
    reportLevel: { type: DataTypes.INTEGER, defaultValue: 1 } // 1: basic, 2: extended, 3: full
});

// 3. The User (Login)
const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false }, // In prod, hash this!
    role: { type: DataTypes.ENUM('super_level_1', 'super_level_2', 'admin', 'professional', 'reception'), defaultValue: 'admin' },
    parentId: DataTypes.INTEGER // For tracking which super_level_1 created which super_level_2
});

// --- SALON DATA MODELS (All must have SalonId) ---

const Professional = sequelize.define('Professional', {
    name: DataTypes.STRING,
    role: DataTypes.STRING,
    color: DataTypes.STRING,
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const Client = sequelize.define('Client', {
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    xonguileId: { type: DataTypes.STRING, unique: true },
    notes: DataTypes.TEXT
});

Client.beforeCreate((client) => {
    if (!client.xonguileId) {
        client.xonguileId = `XON-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
});

const Service = sequelize.define('Service', {
    name: DataTypes.STRING,
    price: DataTypes.FLOAT,
    duration: DataTypes.INTEGER, // minutes
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const Product = sequelize.define('Product', {
    name: DataTypes.STRING,
    price: DataTypes.FLOAT,
    cost: DataTypes.FLOAT,
    quantity: DataTypes.INTEGER,
    minQuantity: DataTypes.INTEGER,
    category: { type: DataTypes.ENUM('resale', 'internal'), defaultValue: 'resale' }
});

const Appointment = sequelize.define('Appointment', {
    date: DataTypes.STRING, // YYYY-MM-DD
    startTime: DataTypes.STRING, // HH:mm
    endTime: DataTypes.STRING,
    status: { type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'), defaultValue: 'scheduled' },
    price: DataTypes.FLOAT,
    notes: DataTypes.TEXT
});

const Transaction = sequelize.define('Transaction', {
    description: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    type: { type: DataTypes.ENUM('income', 'expense', 'license_payment'), allowNull: false },
    category: DataTypes.STRING,
    paymentMethod: DataTypes.STRING,
    date: DataTypes.DATE
});

const Ticket = sequelize.define('Ticket', {
    subject: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('open', 'pending', 'resolved', 'closed'), defaultValue: 'open' },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' }
    ,
    // PeerJS ID published by support when they listen for voice calls
    supportPeerId: { type: DataTypes.STRING, allowNull: true }
});

const Message = sequelize.define('Message', {
    content: { type: DataTypes.TEXT, allowNull: false },
    senderRole: { type: DataTypes.ENUM('admin', 'super_level_1', 'super_level_2'), allowNull: false },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// --- RELATIONSHIPS (Multi-tenancy Wire-up) ---

// A Salon has one License
Salon.hasOne(License);
License.belongsTo(Salon);

// A Salon has many Users
Salon.hasMany(User);
User.belongsTo(Salon);

// Everything belongs to a Salon (Tenant Isolation)
Salon.hasMany(Professional); Professional.belongsTo(Salon);
Salon.hasMany(Client); Client.belongsTo(Salon);
Salon.hasMany(Service); Service.belongsTo(Salon);
Salon.hasMany(Product); Product.belongsTo(Salon);
Salon.hasMany(Appointment); Appointment.belongsTo(Salon);
Salon.hasMany(Transaction); Transaction.belongsTo(Salon);
Salon.hasMany(Ticket); Ticket.belongsTo(Salon);

// Internal Relations
Professional.hasMany(Appointment); Appointment.belongsTo(Professional);
Client.hasMany(Appointment); Appointment.belongsTo(Client);
Service.hasMany(Appointment); Appointment.belongsTo(Service);

// Communication Relations
Ticket.hasMany(Message); Message.belongsTo(Ticket);
User.hasMany(Message); Message.belongsTo(User);

module.exports = {
    sequelize,
    Salon,
    License,
    User,
    Professional,
    Client,
    Service,
    Product,
    Appointment,
    Transaction,
    Ticket,
    Message
};
