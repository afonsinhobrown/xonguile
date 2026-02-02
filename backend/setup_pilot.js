const { sequelize, Salon, License, User } = require('./database');

async function setupPilot() {
    try {
        await sequelize.sync();

        // 1. Create or Update Salon
        const [salon, created] = await Salon.findOrCreate({
            where: { slug: 'angi-arte' },
            defaults: {
                name: 'Angi-Arte Cabeleireiros',
                slug: 'angi-arte',
                phone: '+258 21 414 922',
                address: 'Rua da Resistência, numero 757, Malhangalene, Maputo Cidade',
                email: 'contacto@angiarte.com',
                nuit: '400123456', // Placeholder
                receiptFooter: 'Obrigado por preferir a Angi-Arte! Volte sempre.'
            }
        });

        if (!created) {
            // Update details if already exists
            await salon.update({
                name: 'Angi-Arte Cabeleireiros',
                phone: '+258 21 414 922',
                address: 'Rua da Resistência, numero 757, Malhangalene, Maputo Cidade'
            });
            console.log('Salão Angi-Arte atualizado.');
        } else {
            console.log('Salão Angi-Arte criado com sucesso.');
        }

        // 2. Create License (Pilot License - 6 Months)
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + 6);

        await License.create({
            key: 'ANGI-PILOT-001',
            type: 'yearly',
            status: 'active',
            validUntil: validUntil,
            SalonId: salon.id
        }).catch(e => console.log("Licença já existe ou erro:", e.message));

        // 3. Create Admin User
        const [user, userCreated] = await User.findOrCreate({
            where: { email: 'admin@angiarte.com' },
            defaults: {
                name: 'Administração Angi',
                password: '123', // Hash in prod
                role: 'admin',
                SalonId: salon.id
            }
        });

        if (userCreated) {
            console.log('Usuário admin@angiarte.com criado (Senha: 123).');
        } else {
            console.log('Usuário admin@angiarte.com já existe.');
        }

    } catch (e) {
        console.error("Erro no setup:", e);
    }
}

setupPilot();
