# SkillForge

> Privacy‑preserving competitive gaming powered by Zama FHEVM

SkillForge is a decentralized gaming platform that pairs fair competition with privacy. Using Fully Homomorphic Encryption (FHE) via Zama’s FHEVM, gameplay‑critical data stays encrypted during processing, preventing cheats and information leaks while keeping results verifiable on‑chain.

---

## Why SkillForge

- ❌ Traditional platforms expose player telemetry and logic → ✅ Encrypted game logic with FHEVM
- ❌ Opaque anti‑cheat → ✅ Verifiable on‑chain outcomes without revealing private inputs
- ❌ Centralized custody of progress → ✅ Self‑sovereign progression and assets

---

## Zama FHEVM for Fair Play

FHEVM enables smart contracts to compute over encrypted data. SkillForge runs sensitive game checks and scoring without ever decrypting private inputs.

```
Player Client
  └─ FHE Encrypt (moves, proofs, metrics)
         └─ Encrypted Payload → FHEVM Contracts
                                  └─ Encrypted Validation/Scoring
                                           └─ Verifiable Result → Rewards/NFTs
```

Properties
- No plaintext sensitive state on‑chain
- Encrypted validation of gameplay actions
- Publicly auditable match results and rewards

---

## Getting Started

Prerequisites: Node.js 18+, MetaMask, Sepolia ETH

Setup
```bash
git clone https://github.com/whyuloveicecream/SkillForge
cd SkillForge
npm install
cp .env.example .env.local
```

Deploy
```bash
npm run deploy:sepolia
```

Run
```bash
npm run dev
```

---

## Game Flow

1) Matchmake and join lobby
2) Client encrypts gameplay inputs and submits
3) FHEVM contracts validate moves and score privately
4) Results posted on‑chain; rewards minted

Privacy model
- Encrypted: inputs, telemetry, anti‑cheat signals
- Transparent: match result, rewards, contract logic

---

## Architecture

| Layer            | Tech                   | Role                                  |
|------------------|------------------------|---------------------------------------|
| Encryption       | Zama FHE               | Client‑side encryption of inputs       |
| Contracts        | Solidity + FHEVM       | Encrypted validation and scoring       |
| Chain            | Ethereum Sepolia       | Execution and persistence              |
| Frontend         | React + TypeScript     | Game UI + local crypto                 |
| Tooling          | Hardhat, Ethers        | Build/test/deploy                      |

Core contracts
- MatchFactory: lobbies and matches
- EncryptedRules: private rule checks
- Rewards: NFTs/tokens for victories and milestones

---

## Features

- 🔐 Encrypted gameplay checks
- 🏆 Skill‑based matchmaking and rankings
- 🧾 Verifiable results and reward distribution
- 🧩 Modular rule sets (plug‑in game modes)
- 🎟️ NFT achievements and player badges

---

## Security & Fair Play

- No plaintext anti‑cheat signals on‑chain
- Independent audits recommended for circuits and contracts
- Rate‑limit and replay protection through signed epochs (EIP‑712)
- Minimize metadata; rotate FHE keys per season or mode

---

## Roadmap

- v1: Core match flow, encrypted validation, rewards
- v1.1: Tournament brackets, spectator proofs
- v1.2: Mobile client, cross‑game profiles
- v2: Cross‑chain deployments, modular oracle sets

---

## Contributing

PRs welcome: gameplay circuits, audits, UIs, documentation.

---

## Resources

- Zama: https://www.zama.ai
- FHEVM Docs: https://docs.zama.ai/fhevm
- Sepolia Explorer: https://sepolia.etherscan.io

---

## License

MIT — see LICENSE.

Built with Zama FHEVM — fair results, private inputs, public trust.
