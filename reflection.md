# Reflection

This took longer than expected. The main issue was a stale `system-scripts.json`  offckb generates new genesis hashes on each restart, but the file kept referencing the old ones. The browser would fail to resolve cell deps while Node.js somehow worked, which sent me down a rabbit hole of CORS, RPC proxy, and SDK version debugging. The fix was one command: `offckb system-scripts --export-style ccc -o system-scripts.json`.

On the xUDT model itself  I like how the token identity is derived from the issuer's lock hash rather than requiring a new contract deployment per token. Cleaner than ERC-20 in that sense. The cell-based query by type script args felt natural once I wrapped my head around CKB's data model.
