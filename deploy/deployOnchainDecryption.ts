import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 部署 OnchainDecryption 合约...");
  console.log("📍 部署者地址:", deployer);

  try {
    // 部署 OnchainDecryption 合约
    const deployedOnchainDecryption = await deploy("OnchainDecryption", {
      from: deployer,
      log: true,
      waitConfirmations: 2, // 等待2个确认
    });

    console.log("✅ OnchainDecryption 部署成功:", deployedOnchainDecryption.address);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 OnchainDecryption 合约部署完成!");
    console.log("=".repeat(60));
    console.log(`📊 OnchainDecryption: ${deployedOnchainDecryption.address}`);
    console.log("\n🔍 在Etherscan上查看合约:");
    console.log(`🌐 OnchainDecryption: https://sepolia.etherscan.io/address/${deployedOnchainDecryption.address}`);

    console.log("\n📋 验证合约命令 (可选):");
    console.log(`npx hardhat verify --network sepolia ${deployedOnchainDecryption.address}`);

    console.log("\n✨ 合约功能说明:");
    console.log("   - 存储各种类型的加密数据 (euint32, ebool, eaddress)");
    console.log("   - 演示requestDecryption异步解密机制");
    console.log("   - 支持单个和批量解密操作");
    console.log("   - 完整的解密回调函数实现");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ 部署失败:", error);
    throw error;
  }
};

export default func;
func.id = "deploy_onchain_decryption";
func.tags = ["OnchainDecryption", "Teaching"];