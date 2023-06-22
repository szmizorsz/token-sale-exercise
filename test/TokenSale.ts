import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenSale } from "../typechain-types";

describe("TokenSale", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, firstAccount, secondAccount] = await ethers.getSigners();

    const TokenSale = await ethers.getContractFactory("TokenSale");
    const tokenSale = (await TokenSale.deploy()) as TokenSale;

    return { tokenSale, owner, firstAccount, secondAccount };
  }

  describe("Receive ether", function () {
    it("Should recieve ether from one user and mint tokens", async function () {
      const { tokenSale, firstAccount } = await loadFixture(deployFixture);

      const etherToSend = ethers.parseEther("1.0");

      const contractBalanceBefore = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceBefore).to.equal(0);

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: etherToSend,
      });

      const contractBalanceAfter = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceAfter).to.equal(etherToSend);
      const tokenBalaneAfter = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(tokenBalaneAfter).to.equal(etherToSend);
    });

    it("Should recieve ether from two user and mint tokens", async function () {
      const { tokenSale, firstAccount, secondAccount } = await loadFixture(
        deployFixture
      );

      const etherSentByFirstAccount = ethers.parseEther("1.0");
      const etherSentBySecondAccount = ethers.parseEther("1.0");

      const contractBalanceBefore = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceBefore).to.equal(0);

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: etherSentByFirstAccount,
      });

      await secondAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: etherSentBySecondAccount,
      });

      const contractBalanceAfter = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceAfter).to.equal(
        etherSentByFirstAccount + etherSentBySecondAccount
      );
      const tokenBalaneFirstAccount = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(tokenBalaneFirstAccount).to.equal(etherSentByFirstAccount);
      const tokenBalaneSecondAccount = await tokenSale.balanceOf(
        secondAccount.getAddress()
      );
      expect(tokenBalaneSecondAccount).to.equal(etherSentBySecondAccount);
    });
  });
});
