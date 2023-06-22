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

  describe("Receive token, burn and send ether back", function () {
    it("Should recieve token from one user, burn it and send ether back", async function () {
      const { tokenSale, firstAccount } = await loadFixture(deployFixture);

      const etherToSend = ethers.parseEther("1.0");
      const tokenToMint = etherToSend; // dummy price model

      const contractETHBalanceBefore = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceBefore).to.equal(0);
      const firstAccountETHBalanceBefore = await ethers.provider.getBalance(
        firstAccount.getAddress()
      );
      const sendETHTx = await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: etherToSend,
      });
      const sendETHreceipt = await sendETHTx.wait();
      const gasUsed = sendETHreceipt?.gasUsed;
      if (gasUsed) {
        const gasPrice = sendETHTx.gasPrice * gasUsed;
        const firstAccountETHBalanceAfterMint =
          await ethers.provider.getBalance(firstAccount.getAddress());
        expect(firstAccountETHBalanceAfterMint).to.equal(
          firstAccountETHBalanceBefore - etherToSend - gasPrice
        );
      }

      const contractETHBalanceAfterMint = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceAfterMint).to.equal(etherToSend);
      const firstAccountTokenBalaneAfterMint = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(firstAccountTokenBalaneAfterMint).to.equal(tokenToMint);

      const firstAccountETHBalanceBeforeBurn = await ethers.provider.getBalance(
        firstAccount.getAddress()
      );

      const tokenBurnTx = await tokenSale
        .connect(firstAccount)
        ["transferAndCall(address,uint256)"](
          tokenSale.getAddress(),
          tokenToMint
        );

      const tokenBurnReceipt = await tokenBurnTx.wait();
      const gasUsedTokenBurnTx = tokenBurnReceipt?.gasUsed;
      if (gasUsedTokenBurnTx) {
        const gasPrice = tokenBurnTx.gasPrice * gasUsedTokenBurnTx;
        const firstAccountETHBalanceAfterBurn =
          await ethers.provider.getBalance(firstAccount.getAddress());
        expect(firstAccountETHBalanceAfterBurn).to.equal(
          firstAccountETHBalanceBeforeBurn + etherToSend - gasPrice
        );
      }

      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceAfterBurn).to.equal(0);
      const firstAccountTokenBalaneAfterBurn = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(firstAccountTokenBalaneAfterBurn).to.equal(0);
    });
  });
});
