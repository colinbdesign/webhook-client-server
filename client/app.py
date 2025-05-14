import json, requests
import streamlit as st

st.subheader("Webhook Client")

# Default URL points to local server
url = st.text_input("Webhook URL", "http://localhost:3000/webhook-1")
payload = st.text_area("JSON Payload", "{}", height=200)

headers = {"Content-Type": "application/json"}

if st.button("Submit"):
    if not url.strip():
        st.error("Please provide the Webhook URL.")
    else:
        try:
            # Validate JSON
            parsed_payload = json.loads(payload)
            response = requests.post(url, json=parsed_payload, headers=headers)

            st.success(f"Status Code: {response.status_code}")
            st.json(response.json() if response.headers.get("Content-Type") == "application/json" else response.text)
        except json.JSONDecodeError:
            st.error("Invalid JSON payload.")
        except Exception as e:
            st.error(f"Error: {str(e)}")
