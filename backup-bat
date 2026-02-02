@echo off
echo ==========================================
echo      INICIANDO SISTEMA SALAO APP
echo ==========================================
echo.

echo 1. Iniciando BASE DE DADOS (Backend)...
cd backend
if not exist node_modules (
    echo Instalando dependencias backend...
    call npm install
)
start "SalaoApp - Servidor de Dados" cmd /k "node server.js"
cd ..

echo.
echo 2. Iniciando INTERFACE (Frontend)...
cd salao-app
if not exist node_modules (
    echo Instalando dependencias frontend...
    call npm install
)

start http://localhost:5173
npm run dev
pause
