@echo off
title Fontopsy - Font Inspector & Layer Extractor
echo ==================================================
echo   FONTOPSY - LOCAL TEST RUNNER
echo ==================================================
echo.
cd /d "%~dp0"

echo [1/2] Checking dependencies...
if not exist "node_modules" (
    echo Installing node_modules with pnpm...
    call pnpm install
)

echo [2/2] Launching Vite local development server...
echo Server running at http://localhost:5173/
echo.
call pnpm dev --open

pause
