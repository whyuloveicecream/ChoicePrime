import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedAddressStorage = await deploy("AddressStorage", {
    from: deployer,
    log: true,
  });

  console.log(`AddressStorage contract: `, deployedAddressStorage.address);
};

export default func;
func.id = "deploy_addressStorage";
func.tags = ["AddressStorage"];