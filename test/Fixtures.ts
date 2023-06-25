import { ethers } from "hardhat";
import { TokenSale } from "../typechain-types";

// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.

// Since fixtures can not except arguments, we have to define a new fixture for each different curve

export async function deployFixtureWithCurveSlope1AndConstant0() {
  // Contracts are deployed using the first signer/account by default
  const [owner, firstAccount, secondAccount] = await ethers.getSigners();

  const curveSlope = 1;
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

  const curveSlope = 2;
  const curveConstant = 1;

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
