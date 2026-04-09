@echo off
echo ========================================
echo  ORION - Sincronizar Claude Code → Vercel
echo ========================================
echo.

cd /d "C:\Users\Forme Seguro\Documents\ORION"

echo Verificando remote maxxxi...
git remote | findstr maxxxi >nul 2>&1
if errorlevel 1 (
    echo Adicionando remote maxxxi...
    git remote add maxxxi https://github.com/maxwellmachadoadm-ui/MAXXXI.git
)

echo Buscando branch do Claude Code...
git fetch maxxxi claude/autonomous-mode-setup-WMj8y

echo Copiando index.html atualizado...
git checkout maxxxi/claude/autonomous-mode-setup-WMj8y -- index.html
git checkout maxxxi/claude/autonomous-mode-setup-WMj8y -- CLAUDE.md
git checkout maxxxi/claude/autonomous-mode-setup-WMj8y -- public/
git checkout maxxxi/claude/autonomous-mode-setup-WMj8y -- supabase/
git checkout maxxxi/claude/autonomous-mode-setup-WMj8y -- vercel.json

echo Commitando...
git add .
git commit -m "sync: Claude Code → Vercel [%date% %time%]"

echo Fazendo deploy para Vercel...
git push origin main

echo.
echo ========================================
echo  Deploy concluído!
echo  https://orion-platform-wine.vercel.app
echo ========================================
pause
