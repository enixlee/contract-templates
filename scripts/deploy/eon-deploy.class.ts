import { DeployProxyOptions } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { Contract, ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { EonDeployData } from "./eon-deploy-data.class";

export class EonDeploy {
  private getHre() {
    return require("hardhat");
  }
  private async _deployDataWith(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    contractNameAlias: string,
    deployFunc: (
      hre: HardhatRuntimeEnvironment,
      deployedAddress: string | undefined
    ) => Promise<Contract>,
    forceNew?: boolean
  ): Promise<Contract> {
    const eonDeployerData = new EonDeployData();
    const deployData = await eonDeployerData.getContractDeployDataWithHre(
      hre,
      contractNameAlias
    );
    let deployedContractAddress = deployData.address;
    if (forceNew) {
      deployedContractAddress = undefined;
    }
    let contract = await deployFunc(hre, deployedContractAddress);

    //save deploy data
    await eonDeployerData.saveContractDeployDataWithHre(
      hre,
      contractName,
      contract.address,
      contractNameAlias
    );
    return contract;
  }
  public async deployUpgradeWithData(
    contractName: string,
    initialArgs?: unknown[],
    initialOpts?: DeployProxyOptions,
    forceNew?: boolean,
    forceImport?: boolean,
    contractNameAlias?: string
  ) {
    return this._deployDataWith(
      this.getHre(),
      contractName,
      contractNameAlias ?? contractName,
      async (
        hre: HardhatRuntimeEnvironment,
        deployedAddress: string | undefined
      ) => {
        //check if address is exist
        if (!deployedAddress) {
          return this.deployUpgradeProxy(
            contractName,
            initialArgs,
            initialOpts
          );
        } else {
          return this.deployUpgradeUpdate(
            contractName,
            deployedAddress,
            forceImport
          );
        }
      },
      forceNew
    );
  }

  public async deployNormalWithData(
    contractName: string,
    initialArgs: any[] = [],
    forceNew?: boolean,
    contractNameAlias?: string
  ) {
    const hre = this.getHre();
    return this._deployDataWith(
      hre,
      contractName,
      contractNameAlias ?? contractName,
      async (
        hre: HardhatRuntimeEnvironment,
        deployedAddress: string | undefined
      ) => {
        //check if address is exist
        if (deployedAddress) {
          throw new Error(
            `contract [${contractName}] has been deployed at [${deployedAddress}]`
          );
        }
        return this.deployNormal(contractName, ...initialArgs);
      },
      forceNew
    );
  }

  /**
   *
   * @param DeployContractName
   * @param deployContract
   * @returns Contract
   */
  async _deploy(
    DeployContractName: string,
    deployContract: Contract,
    hre: HardhatRuntimeEnvironment
  ): Promise<Contract> {
    // We get the contract to deploy
    console.log("[deploy contract]:deploy [%s] start", DeployContractName);
    const deployer = deployContract.runner as any;
    const deployerAddress = await deployer.getAddress();
    console.log("[deploy contract]:deployer address", deployerAddress);
    const provider = deployer.provider;

    // const deployerBalance = await provider.getBalance();
    // console.log(
    //   "[deploy contract]:deployer balance before",
    //   ethers.formatEther(deployerBalance)
    // );
    const tx = await deployContract.waitForDeployment();
    console.log("tx", tx);

    // const deployerBalanceAfter = await deployer.getBalance();
    // console.log(
    //   "[deploy contract]:deployer balance after",
    //   ethers.formatEther(deployerBalanceAfter)
    // );
    // console.log(
    //   "[deploy contract]:deploy gas fee",
    //   ethers.formatEther(deployerBalance.sub(deployerBalanceAfter))
    // );
    console.log("after:", deployContract);
    console.log(
      "[deploy contract]:deploy complete! contract: [%s] deployed to: %s",
      DeployContractName,
      deployContract.address
    );
    return deployContract;
  }
  /**
   * deploy contract(not upgradeable)
   * @param DeployContractName  contract name
   * @param args  contract args
   * @returns  Contract
   */
  public async deployNormal(
    DeployContractName: string,
    ...args: any[]
  ): Promise<Contract> {
    const hre = this.getHre();
    const DeployContract = await hre.ethers.getContractFactory(
      DeployContractName
    );
    const deployContract = await DeployContract.deploy(...args);
    return this._deploy(DeployContractName, deployContract, hre);
  }

  /**
   * deploy upgradeable contract
   * @param contractName contract name
   * @returns contract address
   */
  public async deployUpgradeProxy(
    contractName: string,
    args?: unknown[],
    opts?: DeployProxyOptions
  ): Promise<Contract> {
    const hre = this.getHre();
    const DeployContractName = contractName;
    const DeployContract = await hre.ethers.getContractFactory(
      DeployContractName
    );
    const deployContract = await hre.upgrades.deployProxy(
      DeployContract,
      args,
      opts
    );
    return this._deploy(DeployContractName, deployContract, hre);
  }
  /**
   * update upgradeable contract
   * @param contractName contract name
   * @param contractAddress  contract address
   * @returns
   */
  public async deployUpgradeUpdate(
    contractName: string,
    contractAddress: string,
    forceImport?: boolean
  ): Promise<Contract> {
    const hre = this.getHre();
    console.log("[deploy contract]:deploy [%s] upgrade ...", contractName);
    const DeployContractName = contractName;
    const DeployContract = await hre.ethers.getContractFactory(contractName);
    let deployContract;
    if (forceImport) {
      deployContract = await hre.upgrades.forceImport(
        contractAddress,
        DeployContract
      );
    } else {
      deployContract = await hre.upgrades.upgradeProxy(
        contractAddress,
        DeployContract
      );
    }
    return this._deploy(DeployContractName, deployContract, hre);
  }

  /**
   * update upgradeable contract (through defender proposal)
   * @param contractName contract name
   * @param contractAddress  contract address
   * @returns
   */
  public async deployUpgradeUpdateWithProposal(
    contractName: string,
    contractAddress: string,
    upgradeDefenderMultiSigAddress: string
  ): Promise<void> {
    const hre = this.getHre();
    console.log("[deploy contract]:deploy [%s] upgrade ...", contractName);
    const Contract = await hre.ethers.getContractFactory(contractName);
    console.log("Preparing proposal...");
    console.log(
      "Upgrade proposal with multisig at:",
      upgradeDefenderMultiSigAddress
    );
    const proposal = await hre.defender.proposeUpgrade(
      contractAddress,
      Contract,
      {
        multisig: upgradeDefenderMultiSigAddress,
      }
    );
    console.log("Upgrade proposal created at:", proposal.url);
  }
}
