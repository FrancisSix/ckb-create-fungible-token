# CKB Create a Fungible Token

A working xUDT (Extensible User Defined Token) dApp running on the CKB devnet using [OffCKB](https://github.com/nervosnetwork/docs.nervos.org).

## What This Demonstrates

- **Issue** a custom fungible token (42 tokens) on CKB
- **Query** token cells by Lock Script Hash
- **Transfer** tokens to another address

## Screenshots

| Step | Screenshot |
|------|------------|
| 1. Clone repo | [01-git-clone.png](screenshots/01-git-clone.png) |
| 2. Install deps | [02-npm-install.png](screenshots/02-npm-install.png) |
| 3. Devnet accounts | [03-offckb-accounts.png](screenshots/03-offckb-accounts.png) |
| 4. Start dev server | [04-dev-server-start.png](screenshots/04-dev-server-start.png) |
| 5. Issue token result | [05-issue-token-result.png](screenshots/05-issue-token-result.png) |
| 6. Issue token success | [06-issue-token-success.png](screenshots/06-issue-token-success.png) |
| 7. Query token cells | [07-query-token-cells.png](screenshots/07-query-token-cells.png) |
| 8. Transfer token result | [08-transfer-token-result.png](screenshots/08-transfer-token-result.png) |

## Reflection

[reflection.md](reflection.md)

## Run It Locally

```bash
# Start devnet
offckb node

# Install and run
cd examples/dApp/xudt
npm install
$env:NETWORK = "devnet"; npm start
```

Open http://localhost:1234
