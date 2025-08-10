import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_KEY || "";
const POLYGON_RPC = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const AMOY_RPC = process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";

const networks: Record<string, any> = {
  hardhat: {},
};

if (PRIVATE_KEY) {
  networks["polygon"] = {
    url: POLYGON_RPC,
    accounts: [PRIVATE_KEY],
  };
  networks["amoy"] = {
    url: AMOY_RPC,
    accounts: [PRIVATE_KEY],
  };
  networks["sepolia"] = {
    url: SEPOLIA_RPC,
    accounts: [PRIVATE_KEY],
  };
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks
};

export default config;
