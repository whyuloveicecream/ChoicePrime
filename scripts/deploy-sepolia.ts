import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 开始部署ZamaSchool合约到Sepolia测试网...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📍 部署者地址:", deployer.address);

  // 检查账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️ 警告: 账户余额可能不足以完成部署");
  }

  const deploymentResults: any = {};

  try {
    // 部署 NumberStorage 合约
    console.log("\n📦 部署 NumberStorage 合约...");
    const NumberStorageFactory = await ethers.getContractFactory("NumberStorage");
    const numberStorage = await NumberStorageFactory.deploy();
    await numberStorage.waitForDeployment();
    const numberStorageAddress = await numberStorage.getAddress();
    deploymentResults.NumberStorage = numberStorageAddress;
    console.log("✅ NumberStorage 部署成功:", numberStorageAddress);

    // 部署 AddressStorage 合约
    console.log("\n📦 部署 AddressStorage 合约...");
    const AddressStorageFactory = await ethers.getContractFactory("AddressStorage");
    const addressStorage = await AddressStorageFactory.deploy();
    await addressStorage.waitForDeployment();
    const addressStorageAddress = await addressStorage.getAddress();
    deploymentResults.AddressStorage = addressStorageAddress;
    console.log("✅ AddressStorage 部署成功:", addressStorageAddress);

    // 保存部署地址到前端配置文件
    const contractsConfig = {
      sepolia: {
        NumberStorage: numberStorageAddress,
        AddressStorage: addressStorageAddress,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        chainId: 11155111,
        explorerUrl: "https://sepolia.etherscan.io",
      }
    };

    // 确保前端配置目录存在
    const frontendConfigDir = path.join(__dirname, "../frontend/src/config");
    if (!fs.existsSync(frontendConfigDir)) {
      fs.mkdirSync(frontendConfigDir, { recursive: true });
    }

    // 写入部署地址到新的配置文件
    const deployedContractsPath = path.join(frontendConfigDir, "deployedContracts.json");

    // 如果文件已存在，则合并配置
    let existingConfig = {};
    if (fs.existsSync(deployedContractsPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(deployedContractsPath, 'utf8'));
      } catch (error) {
        console.log("⚠️ 无法读取现有配置文件，将创建新的配置文件");
      }
    }

    const finalConfig = {
      ...existingConfig,
      ...contractsConfig
    };

    fs.writeFileSync(deployedContractsPath, JSON.stringify(finalConfig, null, 2));
    console.log("📝 合约地址已保存到:", deployedContractsPath);

    // 更新现有的 contracts.js 文件
    const contractsJsPath = path.join(frontendConfigDir, "contracts.js");
    const contractsJsContent = `// 合约配置
export const CONTRACTS = {
  // 本地开发环境
  hardhat: {
    chainId: 31337,
    NumberStorage: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    AddressStorage: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  },

  // Sepolia测试网
  sepolia: {
    chainId: 11155111,
    NumberStorage: '${numberStorageAddress}',
    AddressStorage: '${addressStorageAddress}'
  }
}

// 获取当前网络的合约地址
export const getContractAddress = (contractName, chainId = 31337) => {
  const network = chainId === 11155111 ? 'sepolia' : 'hardhat'
  return CONTRACTS[network][contractName]
}

// 获取当前网络配置
export const getNetworkConfig = (chainId = 31337) => {
  return chainId === 11155111 ? CONTRACTS.sepolia : CONTRACTS.hardhat
}`;

    fs.writeFileSync(contractsJsPath, contractsJsContent);
    console.log("📝 contracts.js 文件已更新");

    // 显示部署总结
    console.log("\n" + "=".repeat(60));
    console.log("🎉 部署完成! Sepolia 测试网合约地址:");
    console.log("=".repeat(60));
    console.log(`📊 NumberStorage: ${numberStorageAddress}`);
    console.log(`📧 AddressStorage: ${addressStorageAddress}`);
    console.log("\n🔍 在Etherscan上查看合约:");
    console.log(`🌐 NumberStorage: https://sepolia.etherscan.io/address/${numberStorageAddress}`);
    console.log(`🌐 AddressStorage: https://sepolia.etherscan.io/address/${addressStorageAddress}`);

    console.log("\n📋 验证合约命令 (可选):");
    console.log(`npx hardhat verify --network sepolia ${numberStorageAddress}`);
    console.log(`npx hardhat verify --network sepolia ${addressStorageAddress}`);

    console.log("\n✨ 前端配置文件已更新，现在可以:");
    console.log("   1. 在前端切换到Sepolia网络");
    console.log("   2. 开始测试DApp功能");
    console.log("   3. 体验真实的区块链交互");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  }
}

// 运行部署脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });