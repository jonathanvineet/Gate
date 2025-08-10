import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  let token = process.env.STAKING_TOKEN_ADDRESS;
  const net = hre.network.name;

  const [signer] = await ethers.getSigners();
  console.log(`Network: ${net}`);
  console.log(`Deployer: ${await signer.getAddress()}`);

  // If on Amoy and no token provided, deploy a TestToken and use it
  if (!token && (net === 'amoy' || net === 'hardhat')) {
    console.log(`No STAKING_TOKEN_ADDRESS set. Deploying TestToken on ${net}...`);
    const TestToken = await ethers.getContractFactory("TestToken");
    // 1,000,000 units with 18 decimals
    const initial = ethers.parseUnits("1000000", 18);
    const test = await TestToken.deploy("Test POL", "tPOL", 18, initial);
    await test.waitForDeployment();
    token = await test.getAddress();
    console.log("TestToken deployed at:", token);
  }

  if (!token) {
    throw new Error("Missing STAKING_TOKEN_ADDRESS and no fallback available");
  }

  console.log("Deploying StakingPool with token:", token);
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const staking = await StakingPool.deploy(token);
  await staking.waitForDeployment();
  const addr = await staking.getAddress();
  console.log("StakingPool deployed at:", addr);

  // Optional verify hint
  try {
    console.log("\nVerify (PolygonScan/Etherscan):");
    console.log(`npx hardhat verify --network ${hre.network.name} ${addr} ${token}`);
  } catch {
    console.log(`npx hardhat verify --network <network> ${addr} ${token}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
