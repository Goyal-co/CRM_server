@echo off
echo Testing webhook with payload...

echo.
echo ========================================
echo Test 1: Simple webhook payload
echo ========================================
curl -X POST http://localhost:5000/api/test-webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"leadId\":\"TEST-123\",\"project\":\"Test Project\",\"source\":\"Test\",\"name\":\"John Doe\",\"email\":\"john@example.com\",\"phone\":\"1234567890\",\"city\":\"New York\",\"message\":\"This is a test payload\"}"

echo.
echo.
echo ========================================
echo Test 2: Facebook webhook format
echo ========================================
curl -X POST http://localhost:5000/api/fb-webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"object\":\"page\",\"entry\":[{\"id\":\"123456789\",\"time\":1703123456,\"changes\":[{\"field\":\"leadgen\",\"value\":{\"leadgen_id\":\"LEAD-123\",\"form_id\":\"TEST_FORM_123\",\"page_id\":\"TEST_PAGE_456\"}}]}]}"

echo.
echo Tests completed!
pause 