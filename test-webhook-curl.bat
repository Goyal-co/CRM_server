@echo off
echo 🧪 Testing Facebook Webhook with Curl...
echo.

echo 📤 Testing Facebook Leadgen Webhook Format:
curl -X POST https://pratham-server.onrender.com/webhook/facebook ^
  -H "Content-Type: application/json" ^
  -H "User-Agent: Webhooks/1.0 (https://fb.me/webhooks)" ^
  -H "X-Hub-Signature: sha1=test-signature" ^
  -H "X-Hub-Signature-256: sha256=test-signature-256" ^
  -d "{\"entry\":[{\"id\":\"724302907610309\",\"time\":1751736582,\"changes\":[{\"value\":{\"adgroup_id\":\"6798698439993\",\"ad_id\":\"6798698439993\",\"created_time\":1751736579,\"leadgen_id\":\"1958340478236214\",\"page_id\":\"724302907610309\",\"form_id\":\"793235552669212\"},\"field\":\"leadgen\"}]}],\"object\":\"page\"}"

echo.
echo.
echo 📤 Testing Direct Lead Data Format:
curl -X POST https://pratham-server.onrender.com/webhook/facebook ^
  -H "Content-Type: application/json" ^
  -d "{\"leadId\":\"1958340478236214\",\"project\":\"793235552669212\",\"source\":\"Facebook\",\"formId\":\"793235552669212\",\"pageId\":\"724302907610309\",\"email\":\"shanoorpendari721@gmail.com\",\"full_name\":\"shanoor\",\"phone_number\":\"+918884550785\",\"created_time\":\"2025-07-05T17:29:39+0000\"}"

echo.
echo ✅ Webhook tests completed!
pause 