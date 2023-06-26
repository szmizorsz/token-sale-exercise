import { ethers } from "hardhat";
import { TokenSale } from "../typechain-types";

// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.

// Since fixtures can not except arguments, we have to define a new fixture for each different curve

export async function deployFixtureWithCurveSlope1AndConstant0() {
  // Contracts are deployed using the first signer/account by default
  const [owner, firstAccount, secondAccount] = await ethers.getSigners();

  // slope = 1.0;
  const curveSlope = 1000000000000000000n;
  // constant = 0.0
  const curveConstant = 0;

  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = (await TokenSale.deploy(
    curveSlope,
    curveConstant
  )) as TokenSale;

  return {
    tokenSale,
    owner,
    firstAccount,
    secondAccount,
    curveSlope,
    curveConstant,
  };
}

export async function deployFixtureWithCurveSlope2AndConstant1() {
  // Contracts are deployed using the first signer/account by default
  const [owner, firstAccount, secondAccount] = await ethers.getSigners();

  // slope = 2.0
  const curveSlope = 2000000000000000000n;
  // constant = 1.0
  const curveConstant = 1000000000000000000n;

  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = (await TokenSale.deploy(
    curveSlope,
    curveConstant
  )) as TokenSale;

  return {
    tokenSale,
    owner,
    firstAccount,
    secondAccount,
    curveSlope,
    curveConstant,
  };
}

export async function deployFixtureWithCurveSlope05AndConstant1() {
  // Contracts are deployed using the first signer/account by default
  const [owner, firstAccount, secondAccount] = await ethers.getSigners();

  // slope = 0.5
  const curveSlope = 500000000000000000n;
  // constant = 1.0
  const curveConstant = 1000000000000000000n;

  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = (await TokenSale.deploy(
    curveSlope,
    curveConstant
  )) as TokenSale;

  return {
    tokenSale,
    owner,
    firstAccount,
    secondAccount,
    curveSlope,
    curveConstant,
  };
}

export async function deployFixtureWithCurveSlope0AndConstant1() {
  // Contracts are deployed using the first signer/account by default
  const [owner, firstAccount, secondAccount] = await ethers.getSigners();

  // slope = 0.0
  const curveSlope = 0;
  // constant = 1.0
  const curveConstant = 1000000000000000000n;

  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = (await TokenSale.deploy(
    curveSlope,
    curveConstant
  )) as TokenSale;

  return {
    tokenSale,
    owner,
    firstAccount,
    secondAccount,
    curveSlope,
    curveConstant,
  };
}
