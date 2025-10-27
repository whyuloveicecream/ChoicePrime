import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 验证网络
  if (hre.network.name !== "sepolia") {
    throw new Error("此脚本只能在Sepolia测试网上运行");
  }

  console.log("🚀 开始部署ZamaSchool合约到Sepolia测试网...");
  console.log("📍 部署者地址:", deployer);
  console.log("🌐 网络:", hre.network.name);
  console.log("🔗 Chain ID:", hre.network.config.chainId);

  const deploymentResults: any = {};

  try {
    // 部署 NumberStorage 合约
    console.log("\n📦 部署 NumberStorage 合约...");
    const numberStorage = await deploy("NumberStorage", {
      from: deployer,
      log: true,
      waitConfirmations: 2, // 等待2个确认
    });
    deploymentResults.NumberStorage = numberStorage.address;
    console.log("✅ NumberStorage 部署成功:", numberStorage.address);

    // 部署 AddressStorage 合约
    console.log("\n📦 部署 AddressStorage 合约...");
    const addressStorage = await deploy("AddressStorage", {
      from: deployer,
      log: true,
      waitConfirmations: 2, // 等待2个确认
    });
    deploymentResults.AddressStorage = addressStorage.address;
    console.log("✅ AddressStorage 部署成功:", addressStorage.address);

    // 保存部署地址到前端配置文件
    const contractsConfig = {
      sepolia: {
        NumberStorage: numberStorage.address,
        AddressStorage: addressStorage.address,
        deployedAt: new Date().toISOString(),
        deployer: deployer,
        chainId: 11155111,
        explorerUrl: "https://sepolia.etherscan.io",
      }
    };

    // 确保前端配置目录存在
    const frontendConfigDir = path.join(__dirname, "../frontend/src/config");
    if (!fs.existsSync(frontendConfigDir)) {
      fs.mkdirSync(frontendConfigDir, { recursive: true });
    }

    // 写入合约地址配置文件
    const configPath = path.join(frontendConfigDir, "deployedContracts.json");

    // 如果文件已存在，则合并配置
    let existingConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        console.log("⚠️ 无法读取现有配置文件，将创建新的配置文件");
      }
    }

    const finalConfig = {
      ...existingConfig,
      ...contractsConfig
    };

    fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
    console.log("📝 合约地址已保存到:", configPath);

    // 显示部署总结
    console.log("\n" + "=".repeat(50));
    console.log("🎉 部署完成! Sepolia 测试网合约地址:");
    console.log("=".repeat(50));
    console.log(`📊 NumberStorage: ${numberStorage.address}`);
    console.log(`📧 AddressStorage: ${addressStorage.address}`);
    console.log("\n🔍 验证合约:");
    console.log(`🌐 NumberStorage: https://sepolia.etherscan.io/address/${numberStorage.address}`);
    console.log(`🌐 AddressStorage: https://sepolia.etherscan.io/address/${addressStorage.address}`);

    console.log("\n📋 验证命令 (稍后运行):");
    console.log(`npx hardhat verify --network sepolia ${numberStorage.address}`);
    console.log(`npx hardhat verify --network sepolia ${addressStorage.address}`);

    console.log("\n✨ 前端配置文件已更新，可以开始测试DApp了!");
    console.log("=".repeat(50));

  } catch (error) {
    console.error("❌ 部署失败:", error);
    throw error;
  }
};

export default func;
func.id = "deploy_sepolia_zamaschool";
func.tags = ["Sepolia", "Production"];