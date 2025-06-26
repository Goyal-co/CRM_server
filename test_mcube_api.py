import requests
import urllib.parse
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from .env file (optional for API key)
load_dotenv()

# Configuration
MCUBE_API_KEY = os.getenv('MCUBE_API_KEY', '34b4391e00592dc6aa2a117da495e0f5')
BASE_URL = 'https://mcube.vmc.in/api/outboundcall'
AGENT_NUMBER = '9014600977'  # From logs
CUSTOMER_NUMBER = '9620660817'  # With +91 prefix
# CUSTOMER_NUMBER = '9620660817'  # Uncomment to test without +91 prefix
REF_ID = 'LEAD-1750857204544'  # From logs
USE_CALLBACK_URL = False  # Set to True to include a placeholder callback URL
PLACEHOLDER_CALLBACK_URL = 'http://example.com/api/mcube-callback'  # Used if USE_CALLBACK_URL is True

def test_mcube_api():
    """Test the MCUBE Outbound API without a callback URL."""
    # Build the API parameters
    params = {
        'apikey': MCUBE_API_KEY,
        'exenumber': AGENT_NUMBER,
        'custnumber': CUSTOMER_NUMBER
    }
    if USE_CALLBACK_URL:
        params['url'] = PLACEHOLDER_CALLBACK_URL

    encoded_params = urllib.parse.urlencode(params)
    api_url = f"{BASE_URL}?{encoded_params}"

    # Log the request details (mask API key for security)
    print(f"[{datetime.now().isoformat()}] Testing MCUBE API")
    print(f"Request URL: {api_url.replace(MCUBE_API_KEY, '****')}")
    print(f"Parameters: agent={AGENT_NUMBER}, customer={CUSTOMER_NUMBER}")
    if USE_CALLBACK_URL:
        print(f"Callback URL: {PLACEHOLDER_CALLBACK_URL}")
    else:
        print("Callback URL: Not included")

    try:
        # Send GET request with timeout
        response = requests.get(api_url, timeout=10)
        
        # Log response details
        print(f"\n[{datetime.now().isoformat()}] MCUBE API Response:")
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {response.headers}")
        print(f"Body: {response.text if response.text else 'Empty response'}")

        # Check response
        if response.status_code == 200:
            try:
                response_data = response.json()
                if response_data and isinstance(response_data, dict) and len(response_data) > 0:
                    print("\nSuccess: Call triggered successfully!")
                    print(f"Response Data: {response_data}")
                else:
                    print("\nWarning: MCUBE API returned empty or invalid JSON response.")
                    print("Possible issues: Invalid API key, unregistered phone numbers, or MCUBE service error.")
            except ValueError:
                print("\nError: MCUBE API response is not valid JSON.")
                print("Response Text:", response.text)
        else:
            print(f"\nError: MCUBE API request failed with status {response.status_code}.")
            print("Response Text:", response.text)
            print("Possible issues: Invalid API key, incorrect parameters, or MCUBE service downtime.")

    except requests.exceptions.Timeout:
        print("\nError: Request timed out after 10 seconds.")
        print("Possible issues: Network connectivity or MCUBE API server is unresponsive.")
    except requests.exceptions.RequestException as e:
        print(f"\nError: Failed to connect to MCUBE API: {str(e)}")
        print("Possible issues: Network error, incorrect API URL, or MCUBE service downtime.")

    print("\nNext Steps:")
    print("- Contact MCUBE support (support@vmc.in or https://mcube.vmc.in) with:")
    print(f"  - API Key: {MCUBE_API_KEY}")
    print(f"  - Request URL: {api_url.replace(MCUBE_API_KEY, '****')}")
    print(f"  - Response: Status {response.status_code}, Body: {response.text if response.text else 'Empty'}")
    print("- Ensure phone numbers (+919014600977, +919620660817) are registered with MCUBE.")
    print("- Try alternative customer number (e.g., 9620660817 without +91) by editing CUSTOMER_NUMBER.")
    print("- If callback URL is required, set USE_CALLBACK_URL=True and use a valid ngrok URL.")
    print("- Check MCUBE API documentation for required parameters or response format.")

if __name__ == "__main__":
    test_mcube_api()