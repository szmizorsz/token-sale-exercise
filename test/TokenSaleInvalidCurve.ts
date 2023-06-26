import { expect } from "chai";
import { ethers } from "hardhat";

describe("TokenSale tests for invalid curve with constant = 0, slope = 0", function () {
  describe("Calculate price", function () {
    it("Should fail to deploy with invalid curve", async function () {
      const curveSlope = 0;
      const curveConstant = 0;

      const TokenSale = await ethers.getContractFactory("TokenSale");

      await expect(
        TokenSale.deploy(curveSlope, curveConstant)
      ).to.be.revertedWith("Invalid curve: slope and constant are both zero");
    });
  });
});
