@echo off
REM Database Reset Script - Run this manually
REM This will DELETE ALL DATA in the database

echo ========================================
echo WARNING: Database Reset
echo ========================================
echo This will DELETE ALL DATA in:
echo Database: pumpbnb
echo Host: dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com
echo.
echo Press Ctrl+C to cancel, or
pause

set PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=yes, delete all data and reset the database
npx prisma migrate reset --skip-seed --force

echo.
echo ========================================
echo Database reset complete!
echo ========================================
pause
