# Guia de Deploy Profissional - Xonguile App

Este guia passo a passo vai te ajudar a colocar o Xonguile App no ar usando **Render (Backend + Banco)** e **Vercel (Frontend)**.

---

## Passo 1: Preparar e Subir o Código (GitHub)

1.  Crie um novo repositório no **GitHub** (ex: `xonguile-app`).
2.  Abra o terminal na pasta do projeto e rode:
    ```bash
    git init
    git add .
    git commit -m "Deploy inicial Xonguile App"
    git branch -M main
    git remote add origin https://github.com/afonsinhobrown/xonguile.git
    git push -u origin main
    ```

---

## Passo 2: Configurar o Banco de Dados (Render)

1.  Acesse [dashboard.render.com](https://dashboard.render.com).
2.  Clique em **New +** -> **PostgreSQL**.
3.  Preencha:
    *   **Name**: `xonguile-db`
    *   **Database**: `xonguile_db`
    *   **User**: `xonguile_user`
    *   **Region**: Frankfurt (ou a mais próxima).
    *   **Plan**: Free.
4.  Clique em **Create Database**.
5.  Quando criar, procure por **Internal Database URL** e copie (vamos usar no próximo passo).

---

## Passo 3: Deploy do Backend (Render)

1.  No Render, clique em **New +** -> **Web Service**.
2.  Conecte seu repositório do GitHub.
3.  Configure:
    *   **Name**: `xonguile-api`
    *   **Root Directory**: `backend` (IMPORTANTE!)
    *   **Environment**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  Vá em **Environment Variables** e adicione:
    *   `DATABASE_URL`: (Cole a Internal Database URL do passo anterior)
    *   `PORT`: `10000` (O Render define isso automaticamente, mas bom garantir)
5.  Clique em **Create Web Service**.
6.  Espere o deploy terminar. Copie a URL do serviço (ex: `https://xonguile-api.onrender.com`).

---

## Passo 4: Deploy do Frontend (Vercel)

1.  Acesse [vercel.com](https://vercel.com).
2.  Clique em **Add New...** -> **Project**.
3.  Importe seu repositório `xonguile-app`.
4.  Configure:
    *   **Framework Preset**: Vite (Deve detectar automático).
    *   **Root Directory**: Clique em Edit e selecione `salao-app`.
5.  Vá em **Environment Variables** e adicione:
    *   `VITE_API_URL`: (Cole a URL do Backend do passo 3, ex: `https://xonguile-api.onrender.com`)
        *   **Atenção**: Não coloque a barra `/` no final.
6.  Clique em **Deploy**.

---

## Passo 5: Teste

1.  Acesse a URL que a Vercel gerou (ex: `https://xonguile-app.vercel.app`).
2.  Você deve ver a Landing Page.
3.  Tente cadastrar um salão novo para testar a conexão com o banco na nuvem.

🎉 **Parabéns! Seu SaaS está online.**
