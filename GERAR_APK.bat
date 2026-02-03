@echo off
setlocal
echo ==========================================================
echo           🚀 XONGUILE APP: GERADOR DE APK
echo ==========================================================
echo.

cd /d %~dp0

echo [1/3] Construindo o site (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao construir o site. Verifique o codigo.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Sincronizando com o Android (Capacitor)...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao sincronizar com o Capacitor.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Compilando APK...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] A compilacao falhou. 
    echo ----------------------------------------------------------
    echo DICA: 
    echo 1. Certifique-se que o Java (JDK 17) esta instalado.
    echo 2. Certifique-se que o Android SDK esta configurado.
    echo 3. A forma mais facil e abrir a pasta 'android' no Android Studio
    echo    pela primeira vez para ele baixar tudo automaticamente.
    echo ----------------------------------------------------------
) else (
    echo.
    echo [SUCESSO!] APK gerado com sucesso! 🎉
    echo.
    echo O arquivo esta em:
    echo %~dp0android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Pode copiar este arquivo para o seu telemovel e instalar.
)

pause
