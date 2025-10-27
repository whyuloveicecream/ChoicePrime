import { ethers } from "hardhat";

async function main() {
  console.log("🔍 检查账户余额...");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📍 账户地址:", deployer.address);
  console.log("💰 余额:", ethers.formatEther(balance), "ETH");

  const network = await ethers.provider.getNetwork();
  console.log("🌐 网络:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️ 警告: 余额不足，建议至少有0.01 ETH进行部署");
    console.log("💧 获取测试币:");
    console.log("   - Sepolia Faucet: https://sepoliafaucet.com/");
    console.log("   - Alchemy Faucet: https://sepoliafaucet.com/");
  } else {
    console.log("✅ 余额充足，可以进行部署");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });