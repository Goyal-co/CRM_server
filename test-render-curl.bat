@echo off
echo Testing Render deployment with payload...

REM Render deployment URL
set RENDER_URL=https://pratham-server.onrender.com

echo.
echo ========================================
echo Health Check
echo ========================================
curl -X GET %RENDER_URL%/

echo.
echo.
echo ========================================
echo Test 1: Simple webhook payload
echo ========================================
curl -X POST %RENDER_URL%/api/test-webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"leadId\":\"RENDER-TEST-123\",\"project\":\"Render Test Project\",\"source\":\"Render Test\",\"name\":\"John Doe\",\"email\":\"john@example.com\",\"phone\":\"1234567890\",\"city\":\"New York\",\"message\":\"This is a test payload from Render\"}"

echo.
echo.
echo ========================================
echo Test 2: Facebook webhook format
echo ========================================
curl -X POST %RENDER_URL%/api/fb-webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"object\":\"page\",\"entry\":[{\"id\":\"123456789\",\"time\":1703123456,\"changes\":[{\"field\":\"leadgen\",\"value\":{\"leadgen_id\":\"RENDER-LEAD-123\",\"form_id\":\"RENDER_FORM_123\",\"page_id\":\"RENDER_PAGE_456\"}}]}]}"

echo.
echo Tests completed!
pause 