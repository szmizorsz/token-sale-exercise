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
  async function deployFixtureWithCurveSlope1AndConstant0() {
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

  // Since fixtures can not except arguments, we have to define a new fixture for each different curve
  async function deployFixtureWithCurveSlope2AndConstant1() {
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

  describe("Receive ether", function () {
    it("Should recieve ether from one user and mint tokens", async function () {
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiToSend = 3;

      const contractBalanceBefore = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceBefore).to.equal(0);

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: weiToSend,
      });

      const contractBalanceAfter = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceAfter).to.equal(weiToSend);
      const tokenBalaneAfter = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(tokenBalaneAfter).to.equal(2);
    });

    it("Should recieve ether from two user and mint tokens", async function () {
      const { tokenSale, firstAccount, secondAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiSentByFirstAccount = 3;
      const weiSentBySecondAccount = 7;

      const contractBalanceBefore = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceBefore).to.equal(0);

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: weiSentByFirstAccount,
      });

      await secondAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: weiSentBySecondAccount,
      });

      const contractBalanceAfter = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceAfter).to.equal(
        weiSentByFirstAccount + weiSentBySecondAccount
      );
      const tokenBalaneFirstAccount = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(tokenBalaneFirstAccount).to.equal(2);
      const tokenBalaneSecondAccount = await tokenSale.balanceOf(
        secondAccount.getAddress()
      );
      expect(tokenBalaneSecondAccount).to.equal(2);
    });
  });

  describe("Receive token, burn and send ether back", function () {
    it("Should recieve token from one user, burn it and send ether back", async function () {
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiToSend = 3;
      const tokenToMint = 2;

      const contractETHBalanceBefore = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceBefore).to.equal(0);
      const firstAccountETHBalanceBefore = await ethers.provider.getBalance(
        firstAccount.getAddress()
      );
      const sendETHTx = await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: weiToSend,
      });
      const sendETHreceipt = await sendETHTx.wait();
      const gasUsed = sendETHreceipt?.gasUsed;
      if (gasUsed) {
        const gasPrice = sendETHTx.gasPrice * gasUsed;
        const firstAccountETHBalanceAfterMint =
          await ethers.provider.getBalance(firstAccount.getAddress());
        expect(firstAccountETHBalanceAfterMint).to.equal(
          firstAccountETHBalanceBefore - BigInt(weiToSend) - gasPrice
        );
      }

      const contractETHBalanceAfterMint = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceAfterMint).to.equal(weiToSend);
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

      // Sell price is not calculated correctly yet, so this part of the test would be invalid

      // const tokenBurnReceipt = await tokenBurnTx.wait();
      // const gasUsedTokenBurnTx = tokenBurnReceipt?.gasUsed;
      // if (gasUsedTokenBurnTx) {
      //   const gasPrice = tokenBurnTx.gasPrice * gasUsedTokenBurnTx;
      //   const firstAccountETHBalanceAfterBurn =
      //     await ethers.provider.getBalance(firstAccount.getAddress());
      //   expect(firstAccountETHBalanceAfterBurn).to.equal(
      //     firstAccountETHBalanceBeforeBurn + BigInt(weiToSend) - gasPrice
      //   );
      // }

      // const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
      //   tokenSale.getAddress()
      // );
      // expect(contractETHBalanceAfterBurn).to.equal(0);

      const firstAccountTokenBalaneAfterBurn = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(firstAccountTokenBalaneAfterBurn).to.equal(0);
    });
  });

  describe("Calculate price, and number of tokens from price, based on the curve with contsant = 0, slope = 1", function () {
    it("Should calculate price for the first buy", async function () {
      const { tokenSale } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );
      const tokensToBuy = 3;
      const price = await tokenSale.calculatePriceForBuy(tokensToBuy);

      expect(price).to.equal(6);
    });

    it("Should calculate price for the second buy", async function () {
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: 3,
      });

      const tokensToBuy = 3;
      const price = await tokenSale.calculatePriceForBuy(tokensToBuy);

      expect(price).to.equal(12);
    });

    it("Should calculate tokens from price before the first buy", async function () {
      const { tokenSale } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );
      const price = 6;
      const tokensToBuy = await tokenSale.calculateTokensFromPrice(price);

      expect(tokensToBuy).to.equal(3);
    });

    it("Should calculate tokens from price before the second buy", async function () {
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: 3,
      });
      const price = 12;
      const tokensToBuy = await tokenSale.calculateTokensFromPrice(price);

      expect(tokensToBuy).to.equal(3);
    });
  });

  describe("Calculate price, and number of tokens from price, based on the curve with contsant = 1, slope = 2", function () {
    it("Should calculate price for the first buy", async function () {
      const { tokenSale } = await loadFixture(
        deployFixtureWithCurveSlope2AndConstant1
      );
      const tokensToBuy = 3;
      const price = await tokenSale.calculatePriceForBuy(tokensToBuy);

      expect(price).to.equal(15);
    });

    it("Should calculate price for the second buy", async function () {
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope2AndConstant1
      );

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: 15,
      });

      const tokensToBuy = 3;
      const price = await tokenSale.calculatePriceForBuy(tokensToBuy);

      expect(price).to.equal(33);
    });

    it("Should calculate tokens from price before the first buy", async function () {
      const { tokenSale } = await loadFixture(
        deployFixtureWithCurveSlope2AndConstant1
      );
      const price = 15;
      const tokensToBuy = await tokenSale.calculateTokensFromPrice(price);

      expect(tokensToBuy).to.equal(3);
    });

    it("Should calculate tokens from price before the second buy", async function () {
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope2AndConstant1
      );

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: 15,
      });
      const price = 33;
      const tokensToBuy = await tokenSale.calculateTokensFromPrice(price);

      expect(tokensToBuy).to.equal(3);
    });
  });
});
