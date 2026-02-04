-- SCRIPT DE DADOS MOCK PARA XONGUILE APP
-- Executar no SQL Editor do Supabase

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

        -- 6. Inserir 5 Agendamentos por Salão (Ligando aos primeiros IDs inseridos)
        -- Pegamos o primeiro profissional e cliente deste salão para os testes
        SELECT id INTO prof_id FROM "Professionals" WHERE "SalonId" = s_id LIMIT 1;
        SELECT id INTO client_id FROM "Clients" WHERE "SalonId" = s_id LIMIT 1;
        SELECT id INTO serv_id FROM "Services" WHERE "SalonId" = s_id LIMIT 1;

        FOR i IN 1..5 LOOP
            INSERT INTO "Appointments" (date, "startTime", "endTime", status, price, "createdAt", "updatedAt", "SalonId", "ProfessionalId", "ClientId", "ServiceId")
            VALUES (TO_CHAR(NOW() + (i || ' days')::interval, 'YYYY-MM-DD'), '08:00', '09:00', 'scheduled', 500, NOW(), NOW(), s_id, prof_id, client_id, serv_id);
        END LOOP;

    END LOOP;
END $$;

-- Criar Usuário Super Nível 1 se não existir
INSERT INTO "Users" (name, email, password, role, "createdAt", "updatedAt", "SalonId")
SELECT 'Super Admin', 'vampire@xonguile.com', 'dentad@nopescoco', 'super_level_1', NOW(), NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "Users" WHERE email = 'vampire@xonguile.com');
