-- SCRIPT DE DADOS MOCK PARA XONGUILE APP (FIXED FOR SUPABASE)
-- Executar no SQL Editor do Supabase

-- 0. GARANTIR QUE AS COLUNAS NOVAS EXISTAM (MIGRAÇÃO MANUAL)
DO $$ 
BEGIN 
    -- Adicionar xonguileId na tabela Clients se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Clients' AND column_name='xonguileId') THEN
        ALTER TABLE "Clients" ADD COLUMN "xonguileId" VARCHAR(255);
    END IF;

    -- Adicionar parentId na tabela Users se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name='parentId') THEN
        ALTER TABLE "Users" ADD COLUMN "parentId" INTEGER;
    END IF;

    -- Adicionar colunas de licença se não existirem
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
BEGIN
    FOREACH s_id IN ARRAY salon_ids LOOP
        -- Verificar se o salão existe antes de inserir
        IF EXISTS (SELECT 1 FROM "Salons" WHERE id = s_id) THEN
            
            -- 1. Inserir 5 Profissionais por Salão
            FOR i IN 1..5 LOOP
                INSERT INTO "Professionals" (name, role, color, active, "createdAt", "updatedAt", "SalonId")
                VALUES ('TESTE Profissional ' || i, 'Cabelereiro', '#9333ea', true, NOW(), NOW(), s_id);
            END LOOP;

            -- 2. Inserir 5 Clientes por Salão
            FOR i IN 1..5 LOOP
                INSERT INTO "Clients" (name, phone, email, "xonguileId", "createdAt", "updatedAt", "SalonId")
                VALUES ('TESTE Cliente ' || i, '84123456' || i, 'teste' || i || '@cliente.com', 'XON-T' || s_id || i, NOW(), NOW(), s_id);
            END LOOP;

            -- 3. Inserir 5 Serviços por Salão
            FOR i IN 1..5 LOOP
                INSERT INTO "Services" (name, price, duration, active, "createdAt", "updatedAt", "SalonId")
                VALUES ('TESTE Serviço ' || i, 500 + (i * 100), 30 + (i * 15), true, NOW(), NOW(), s_id);
            END LOOP;

            -- 4. Inserir 5 Produtos por Salão
            FOR i IN 1..5 LOOP
                INSERT INTO "Products" (name, price, cost, quantity, "minQuantity", category, "createdAt", "updatedAt", "SalonId")
                VALUES ('TESTE Produto ' || i, 1200 + (i * 100), 800, 20, 5, 'resale', NOW(), NOW(), s_id);
            END LOOP;

            -- 5. Inserir 5 Transações por Salão
            FOR i IN 1..5 LOOP
                INSERT INTO "Transactions" (description, amount, type, category, "paymentMethod", date, "createdAt", "updatedAt", "SalonId")
                VALUES ('TESTE Venda de Produto ' || i, 1500, 'income', 'Produtos', 'cash', NOW(), NOW(), NOW(), s_id);
            END LOOP;

            -- 6. Inserir 5 Agendamentos por Salão
            SELECT id INTO prof_id FROM "Professionals" WHERE "SalonId" = s_id LIMIT 1;
            SELECT id INTO client_id FROM "Clients" WHERE "SalonId" = s_id LIMIT 1;
            SELECT id INTO serv_id FROM "Services" WHERE "SalonId" = s_id LIMIT 1;

            FOR i IN 1..5 LOOP
                INSERT INTO "Appointments" (date, "startTime", "endTime", status, price, "createdAt", "updatedAt", "SalonId", "ProfessionalId", "ClientId", "ServiceId")
                VALUES (TO_CHAR(NOW() + (i || ' days')::interval, 'YYYY-MM-DD'), '08:00', '09:00', 'scheduled', 500, NOW(), NOW(), s_id, prof_id, client_id, serv_id);
            END LOOP;
        END IF;

    END LOOP;
END $$;

-- Criar Usuário Super Nível 1 se não existir
INSERT INTO "Users" (name, email, password, role, "createdAt", "updatedAt", "SalonId")
SELECT 'Super Admin', 'vampire@xonguile.com', 'dentad@nopescoco', 'super_level_1', NOW(), NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "Users" WHERE email = 'vampire@xonguile.com');
