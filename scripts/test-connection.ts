import { ethers } from "hardhat";

async function main() {
  console.log("🔗 测试网络连接...");

  try {
    // 测试基本连接
    const network = await ethers.provider.getNetwork();
    console.log("✅ 网络连接成功");
    console.log("🌐 网络名称:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());

    // 获取最新区块号
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("📦 最新区块:", blockNumber);

    // 测试账户连接
    const [deployer] = await ethers.getSigners();
    console.log("📍 部署者地址:", deployer.address);

    // 获取账户余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 账户余额:", ethers.formatEther(balance), "ETH");

    // 检查gas价格
    const gasPrice = await ethers.provider.getFeeData();
    console.log("⛽ Gas价格:", ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"), "Gwei");

    console.log("\n✅ 所有连接测试通过，可以开始部署!");

  } catch (error) {
    console.error("❌ 连接测试失败:", error);
    console.log("\n🔧 故障排除:");
    console.log("1. 检查 .env 文件中的 INFURA_API_KEY 是否正确");
    console.log("2. 检查 PRIVATE_KEY 是否正确（不要包含0x前缀）");
    console.log("3. 确认网络配置是否正确");
    console.log("4. 检查网络连接是否正常");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });