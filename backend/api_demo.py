import requests

resp = requests.get("https://api.ipify.org?format=json")

print(resp.json())