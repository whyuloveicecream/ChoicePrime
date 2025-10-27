import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedNumberStorage = await deploy("NumberStorage", {
    from: deployer,
    log: true,
  });

  console.log(`NumberStorage contract: `, deployedNumberStorage.address);
};

export default func;
func.id = "deploy_numberStorage";
func.tags = ["NumberStorage"];