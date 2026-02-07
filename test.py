from google import genai

# Picks up GEMINI_API_KEY automatically from your environment.
client = genai.Client(api_key="AIzaSyA4uhW-kJi-lsOSk3mLhS0mnmo9cIsh10c")

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Explain how AI works in a few words",
)

print(response.text)