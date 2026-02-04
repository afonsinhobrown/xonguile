-- SCRIPT DE DADOS MOCK PARA XONGUILE APP (PRODUÇÃO / REALISTA)
-- Executar no SQL Editor do Supabase

-- 0. GARANTIR QUE AS COLUNAS NOVAS EXISTAM (MIGRAÇÃO MANUAL)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Clients' AND column_name='xonguileId') THEN
        ALTER TABLE "Clients" ADD COLUMN "xonguileId" VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name='parentId') THEN
        ALTER TABLE "Users" ADD COLUMN "parentId" INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Licenses' AND column_name='bookingLimit') THEN
        ALTER TABLE "Licenses" ADD COLUMN "bookingLimit" INTEGER DEFAULT 50;
        ALTER TABLE "Licenses" ADD COLUMN "hasWaitingList" BOOLEAN DEFAULT FALSE;
        ALTER TABLE "Licenses" ADD COLUMN "reportLevel" INTEGER DEFAULT 1;
    END IF;
END $$;

-- IDs dos Salões: 1, 2, 13, 14
DO $$
DECLARE
    salon_ids INT[] := ARRAY[1, 2, 13, 14];
    s_id INT;
    i INT;
    prof_id INT;
    client_id INT;
    serv_id INT;
    
    -- Serviços de Cabelo
    hair_services TEXT[] := ARRAY['Corte Feminino Moderno', 'Corte Masculino Fade', 'Coloração Global', 'Mechas Criativas', 'Hidratação Intensiva Caviar', 'Escova Progressiva Orgânica', 'Spa Capilar Anti-Stress', 'Penteado Noiva/Gala'];
    hair_prices INT[] := ARRAY[800, 500, 2500, 4500, 1200, 3500, 1500, 2500];
    
    -- Unhas
    nail_services TEXT[] := ARRAY['Manicure & Pedicure Simples', 'Alongamento Gel Moldado', 'Unha de Fibra de Vidro', 'Spa do Pé Profundo'];
    nail_prices INT[] := ARRAY[600, 2500, 3000, 1200];
    
    -- Estética
    beauty_services TEXT[] := ARRAY['Design de Sobrancelhas', 'Extensão de Cílios Fio a Fio', 'Limpeza de Pele Profunda', 'Massagem Relaxante (1h)', 'Drenagem Linfática Corporal', 'Maquiagem Social Premium'];
    beauty_prices INT[] := ARRAY[500, 2000, 2500, 1800, 2200, 2000];

    all_services TEXT[];
    all_prices INT[];
BEGIN
    all_services := hair_services || nail_services || beauty_services;
    all_prices := hair_prices || nail_prices || beauty_prices;

    FOREACH s_id IN ARRAY salon_ids LOOP
        IF EXISTS (SELECT 1 FROM "Salons" WHERE id = s_id) THEN
            
            -- 1. Inserir Profissionais com Nomes Reais
            INSERT INTO "Professionals" (name, role, color, active, "createdAt", "updatedAt", "SalonId") VALUES 
            ('Neuza Santos', 'Cabelereira Senior', '#9333ea', true, NOW(), NOW(), s_id),
            ('Dário Mendes', 'Barbeiro Master', '#2563eb', true, NOW(), NOW(), s_id),
            ('Sheila Tembe', 'Manicure & Nail Art', '#db2777', true, NOW(), NOW(), s_id),
            ('Carla Muianga', 'Esteticista', '#059669', true, NOW(), NOW(), s_id);

            -- 2. Inserir Clientes Reais
            INSERT INTO "Clients" (name, phone, email, "xonguileId", "createdAt", "updatedAt", "SalonId") VALUES 
            ('Maria Chirindza', '840000001', 'maria@email.com', 'XON-M1', NOW(), NOW(), s_id),
            ('José Macuácua', '840000002', 'jose@email.com', 'XON-J2', NOW(), NOW(), s_id),
            ('Anabela Langa', '840000003', 'anabela@email.com', 'XON-A3', NOW(), NOW(), s_id);

            -- 3. Inserir Serviços Reais da Lista
            FOR i IN 1..cardinality(all_services) LOOP
                INSERT INTO "Services" (name, price, duration, active, "createdAt", "updatedAt", "SalonId")
                VALUES (all_services[i], all_prices[i], 45, true, NOW(), NOW(), s_id);
            END LOOP;

            -- 4. Inserir Produtos de Elite
            INSERT INTO "Products" (name, price, cost, quantity, "minQuantity", category, "createdAt", "updatedAt", "SalonId") VALUES 
            ('Shampoo Reparador 500ml', 1200, 700, 15, 3, 'resale', NOW(), NOW(), s_id),
            ('Óleo de Argan Premium', 1800, 1100, 10, 2, 'resale', NOW(), NOW(), s_id),
            ('Kit Manutenção Pós-Química', 3500, 2200, 5, 1, 'resale', NOW(), NOW(), s_id);

            -- 5. Inserir Transações Recentes
            INSERT INTO "Transactions" (description, amount, type, category, "paymentMethod", date, "createdAt", "updatedAt", "SalonId")
            VALUES ('Subscrição Mensal Ouro', 2500, 'expense', 'Licenciamento', 'paypal', NOW(), NOW(), NOW(), s_id);

            -- 6. Inserir Agendamentos de Demonstração
            SELECT id INTO prof_id FROM "Professionals" WHERE "SalonId" = s_id LIMIT 1;
            SELECT id INTO client_id FROM "Clients" WHERE "SalonId" = s_id LIMIT 1;
            SELECT id INTO serv_id FROM "Services" WHERE "SalonId" = s_id LIMIT 1;

            FOR i IN 1..3 LOOP
                INSERT INTO "Appointments" (date, "startTime", "endTime", status, price, "createdAt", "updatedAt", "SalonId", "ProfessionalId", "ClientId", "ServiceId")
                VALUES (TO_CHAR(NOW() + (i || ' days')::interval, 'YYYY-MM-DD'), '09:00', '10:00', 'scheduled', 1500, NOW(), NOW(), s_id, prof_id, client_id, serv_id);
            END LOOP;
        END IF;

    END LOOP;
END $$;

-- Criar Usuário Super Nível 1 se não existir
INSERT INTO "Users" (name, email, password, role, "createdAt", "updatedAt", "SalonId")
SELECT 'Super Admin', 'vampire@xonguile.com', 'dentad@nopescoco', 'super_level_1', NOW(), NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "Users" WHERE email = 'vampire@xonguile.com');
