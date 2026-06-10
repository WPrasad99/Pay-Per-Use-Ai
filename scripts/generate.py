import base64
import urllib.request
import json

mermaid_code = """graph TD
    User[User / Client App]
    Frontend[React Frontend]
    PeraWallet[Pera Wallet / Defly]
    Backend[FastAPI Backend]
    PostgreSQL[(PostgreSQL DB)]
    AIProviders((AI Providers))
    Blockchain[Algorand Blockchain]
    SmartContract[PayPerAI Smart Contract]
    Indexer[Algorand Indexer]

    User -->|Interacts| Frontend
    Frontend <-->|Requests signature| PeraWallet
    Frontend -->|REST / SSE Streams| Backend
    Frontend -->|Submits Txs| Blockchain
    PeraWallet -->|Signs Txs| Blockchain
    Backend <-->|Reads/Writes| PostgreSQL
    Backend <-->|Proxies Prompts| AIProviders
    Backend -->|Reads State| Blockchain
    Blockchain --- SmartContract
    SmartContract -->|Emits Events| Indexer
    Indexer -->|Polled by Oracle| Backend
"""

state = {
  'code': mermaid_code,
  'mermaid': {'theme': 'default'}
}
json_state = json.dumps(state)
encoded_state = base64.urlsafe_b64encode(json_state.encode('utf-8')).decode('utf-8')
url = f'https://mermaid.ink/img/{encoded_state}?type=png'

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open('architecture.png', 'wb') as out_file:
        data = response.read()
        out_file.write(data)
    print('Downloaded architecture.png successfully!')
except Exception as e:
    print(f'Failed: {e}')
