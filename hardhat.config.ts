import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

import "@nomiclabs/hardhat-solhint";
import "@openzeppelin/hardhat-upgrades";
import "@zero-dao/eno-hardhat-plugin-deploy";
import "hardhat-abi-exporter";

import { HardhatUserConfig, task } from "hardhat/config";

const { POLYGON_TESTNET_URL, POLYGON_TESTNET_DEPLOYER_PRIVATE_KEY } =
  process.env;

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: "0.8.21",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: POLYGON_TESTNET_URL,
      chainId: 80001,
      gasPrice: 20000000000,
      accounts: [`0x${POLYGON_TESTNET_DEPLOYER_PRIVATE_KEY}`],
    },
  },
  mocha: {
    timeout: 10 * 60 * 1000,
  },
  abiExporter: {
    except: ["/contracts/libs"],
  },
};
export default config;
