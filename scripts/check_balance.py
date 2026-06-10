import requests
addr = "B5BMUKJFHX6TKTSCIBVFOHJ76J4VG4PJ6C4YXSOPBTWVOVD22O3DDVYUNY"
r = requests.get(f"https://testnet-api.algonode.cloud/v2/accounts/{addr}")
if r.status_code == 200:
    print("Balance:", r.json().get("amount", 0))
else:
    print("Not found", r.status_code)
