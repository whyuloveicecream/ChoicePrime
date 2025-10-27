import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying all ZamaSchool contracts...");
  console.log("Deployer address:", deployer);

  // 部署 NumberStorage 合约
  const deployedNumberStorage = await deploy("NumberStorage", {
    from: deployer,
    log: true,
  });

  // 部署 AddressStorage 合约
  const deployedAddressStorage = await deploy("AddressStorage", {
    from: deployer,
    log: true,
  });

  // 部署 OnchainDecryption 合约
  const deployedOnchainDecryption = await deploy("OnchainDecryption", {
    from: deployer,
    log: true,
  });

  console.log("\n=== Deployment Summary ===");
  console.log(`NumberStorage contract: ${deployedNumberStorage.address}`);
  console.log(`AddressStorage contract: ${deployedAddressStorage.address}`);
  console.log(`OnchainDecryption contract: ${deployedOnchainDecryption.address}`);
  console.log("===========================\n");
};

export default func;
func.id = "deploy_all_zamaschool";
func.tags = ["ZamaSchool", "All"];