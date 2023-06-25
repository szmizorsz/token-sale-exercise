import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployFixtureWithCurveSlope1AndConstant0 } from "./Fixtures";
import {
  sendETHtoTokenSaleContract,
  burnTokenInTokenSaleContract,
} from "./Steps";

describe("TokenSale tests for curve with constant = 0, slope = 1", function () {
  describe("Calculate price", function () {
    it("Should calculate price for the first buy", async function () {
      // Preparation
      const { tokenSale } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      // Action
      const tokensToBuy = 3;
      const price = await tokenSale.calculatePrice(tokensToBuy);

      // Assertions
      expect(price).to.equal(6);
    });

    it("Should calculate price for the second buy", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: 3,
      });

      // Action
      const tokensToBuy = 3;
      const price = await tokenSale.calculatePrice(tokensToBuy);

      // Assertions
      expect(price).to.equal(12);
    });
  });

  describe("Calculate number of tokens from price", function () {
    it("Should calculate tokens from price before the first buy", async function () {
      // Preparation
      const { tokenSale } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      // Action
      const price = 6;
      const tokensToBuy = await tokenSale.calculateTokensFromPrice(price);

      // Assertions
      expect(tokensToBuy).to.equal(3);
    });

    it("Should calculate tokens from price before the second buy", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: 3,
      });

      // Action
      const price = 12;
      const tokensToBuy = await tokenSale.calculateTokensFromPrice(price);

      // Assertions
      expect(tokensToBuy).to.equal(3);
    });
  });
  describe("Receive ether and mint tokens", function () {
    it("Should recieve ether from ONE user and mint tokens", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      // Assertions before
      const contractBalanceBefore = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceBefore).to.equal(0);

      // Action
      const weiToSend = 3;
      await sendETHtoTokenSaleContract(firstAccount, tokenSale, weiToSend);

      // Assertions after
      const expectedContractBalanceAfter = weiToSend;
      const expectedTokenBalance = 2;
      const contractBalanceAfter = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceAfter).to.equal(expectedContractBalanceAfter);
      const tokenBalaneAfter = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(tokenBalaneAfter).to.equal(expectedTokenBalance);
    });

    it("Should recieve ether from TWO users and mint tokens", async function () {
      // Preparation
      const { tokenSale, firstAccount, secondAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiSentByFirstAccount = 3;
      await sendETHtoTokenSaleContract(
        firstAccount,
        tokenSale,
        weiSentByFirstAccount
      );

      // Action
      const weiSentBySecondAccount = 7;
      await sendETHtoTokenSaleContract(
        secondAccount,
        tokenSale,
        weiSentBySecondAccount
      );

      // Assertions after
      const expectedContractBalanceAfter =
        weiSentByFirstAccount + weiSentBySecondAccount;
      const expectedTokenBalaneFirstAccount = 2;
      const expectedTokenBalaneSecondAccount = 2;

      const contractBalanceAfter = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceAfter).to.equal(expectedContractBalanceAfter);
      const tokenBalaneFirstAccount = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );

      expect(tokenBalaneFirstAccount).to.equal(expectedTokenBalaneFirstAccount);
      const tokenBalaneSecondAccount = await tokenSale.balanceOf(
        secondAccount.getAddress()
      );
      expect(tokenBalaneSecondAccount).to.equal(
        expectedTokenBalaneSecondAccount
      );
    });
  });

  describe("Receive token, burn and send ether back", function () {
    it("Should recieve ether from ONE user, mint tokens, burn them completely and send ether back", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiToSend = 3;
      const tokenToMint = 2;
      await sendETHtoTokenSaleContract(firstAccount, tokenSale, weiToSend);

      const firstAccountETHBalanceBeforeBurn = await ethers.provider.getBalance(
        firstAccount.getAddress()
      );

      // Action
      const gasPrice = await burnTokenInTokenSaleContract(
        firstAccount,
        tokenSale,
        tokenToMint
      );

      // Assertions after
      if (gasPrice) {
        const expectedFirstAccountETHBalanceAfterBurn =
          firstAccountETHBalanceBeforeBurn + BigInt(weiToSend) - gasPrice;
        const firstAccountETHBalanceAfterBurn =
          await ethers.provider.getBalance(firstAccount.getAddress());
        expect(firstAccountETHBalanceAfterBurn).to.equal(
          expectedFirstAccountETHBalanceAfterBurn
        );
      }

      const expectedContractETHBalanceAfterBurn = 0;
      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceAfterBurn).to.equal(
        expectedContractETHBalanceAfterBurn
      );

      const expectedFirstAccountTokenBalaneAfterBurn = 0;
      const firstAccountTokenBalaneAfterBurn = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(firstAccountTokenBalaneAfterBurn).to.equal(
        expectedFirstAccountTokenBalaneAfterBurn
      );
    });

    it("Should recieve ether from ONE user, mint tokens, burn them partially and send ether back", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiToSend = 3;
      const tokenToMint = 2;
      await sendETHtoTokenSaleContract(firstAccount, tokenSale, weiToSend);

      const firstAccountETHBalanceBeforeBurn = await ethers.provider.getBalance(
        firstAccount.getAddress()
      );

      // Action
      const tokenToBurn = 1;
      const gasPrice = await burnTokenInTokenSaleContract(
        firstAccount,
        tokenSale,
        tokenToBurn
      );

      // Assertions after
      if (gasPrice) {
        const expectedWeiToReceived = 2;
        const expectedFirstAccountETHBalanceAfterBurn =
          firstAccountETHBalanceBeforeBurn +
          BigInt(expectedWeiToReceived) -
          gasPrice;
        const firstAccountETHBalanceAfterBurn =
          await ethers.provider.getBalance(firstAccount.getAddress());
        expect(firstAccountETHBalanceAfterBurn).to.equal(
          expectedFirstAccountETHBalanceAfterBurn
        );
      }

      const expectedContractETHBalanceAfterBurn = 1;
      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceAfterBurn).to.equal(
        expectedContractETHBalanceAfterBurn
      );

      const expectedFirstAccountTokenBalaneAfterBurn = 1;
      const firstAccountTokenBalaneAfterBurn = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );
      expect(firstAccountTokenBalaneAfterBurn).to.equal(
        expectedFirstAccountTokenBalaneAfterBurn
      );
    });

    it("Should recieve ether from TWO users, mint tokens, burn ONE users tokens completely and send ether back", async function () {
      // Preparation
      const { tokenSale, firstAccount, secondAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiSentByFirstAccount = 3;
      await sendETHtoTokenSaleContract(
        firstAccount,
        tokenSale,
        weiSentByFirstAccount
      );

      const weiSentBySecondAccount = 7;
      const tokenToMintForSecondAccount = 2;
      await sendETHtoTokenSaleContract(
        secondAccount,
        tokenSale,
        weiSentBySecondAccount
      );

      const secondAccountETHBalanceBeforeBurn =
        await ethers.provider.getBalance(secondAccount.getAddress());

      // Action
      const gasPriceForBurn = await burnTokenInTokenSaleContract(
        secondAccount,
        tokenSale,
        tokenToMintForSecondAccount
      );

      // Assertions after
      if (gasPriceForBurn) {
        const expectedSecondAccountETHBalanceAfterBurn =
          secondAccountETHBalanceBeforeBurn +
          BigInt(weiSentBySecondAccount) -
          gasPriceForBurn;
        const secondAccountETHBalanceAfterBurn =
          await ethers.provider.getBalance(secondAccount.getAddress());
        expect(secondAccountETHBalanceAfterBurn).to.equal(
          expectedSecondAccountETHBalanceAfterBurn
        );
      }

      const expectedContractETHBalanceAfterBurn = weiSentByFirstAccount;
      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceAfterBurn).to.equal(
        expectedContractETHBalanceAfterBurn
      );

      const expectedSecondAccountTokenBalaneAfterBurn = 0;
      const secondAccountTokenBalaneAfterBurn = await tokenSale.balanceOf(
        secondAccount.getAddress()
      );
      expect(secondAccountTokenBalaneAfterBurn).to.equal(
        expectedSecondAccountTokenBalaneAfterBurn
      );
    });

    it("Should recieve ether from TWO users, mint tokens, burn ONE users tokens partially and send ether back", async function () {
      // Preparation
      const { tokenSale, firstAccount, secondAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiSentByFirstAccount = 3;
      await sendETHtoTokenSaleContract(
        firstAccount,
        tokenSale,
        weiSentByFirstAccount
      );

      const weiSentBySecondAccount = 7;
      const tokenToMintForSecondAccount = 2;
      await sendETHtoTokenSaleContract(
        secondAccount,
        tokenSale,
        weiSentBySecondAccount
      );

      const secondAccountETHBalanceBeforeBurn =
        await ethers.provider.getBalance(secondAccount.getAddress());

      // Action
      const tokenToBurn = 1;
      const gasPriceForBurn = await burnTokenInTokenSaleContract(
        secondAccount,
        tokenSale,
        tokenToBurn
      );

      // Assertions after
      if (gasPriceForBurn) {
        const expectedWeiToReceived = 4;
        const expectedSecondAccountETHBalanceAfterBurn =
          secondAccountETHBalanceBeforeBurn +
          BigInt(expectedWeiToReceived) -
          gasPriceForBurn;
        const secondAccountETHBalanceAfterBurn =
          await ethers.provider.getBalance(secondAccount.getAddress());
        expect(secondAccountETHBalanceAfterBurn).to.equal(
          expectedSecondAccountETHBalanceAfterBurn
        );
      }

      const expectedContractETHBalanceAfterBurn = 6;
      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceAfterBurn).to.equal(
        expectedContractETHBalanceAfterBurn
      );

      const expectedSecondAccountTokenBalaneAfterBurn = 1;
      const secondAccountTokenBalaneAfterBurn = await tokenSale.balanceOf(
        secondAccount.getAddress()
      );
      expect(secondAccountTokenBalaneAfterBurn).to.equal(
        expectedSecondAccountTokenBalaneAfterBurn
      );
    });

    it("Should recieve ether from TWO users, mint tokens, burn BOTH users tokens completely and send ether back", async function () {
      // Preparation
      const { tokenSale, firstAccount, secondAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiSentByFirstAccount = 3;
      const tokenToMintForFirstAccount = 2;
      await sendETHtoTokenSaleContract(
        firstAccount,
        tokenSale,
        weiSentByFirstAccount
      );

      const weiSentBySecondAccount = 7;
      const tokenToMintForSecondAccount = 2;
      await sendETHtoTokenSaleContract(
        secondAccount,
        tokenSale,
        weiSentBySecondAccount
      );

      await burnTokenInTokenSaleContract(
        firstAccount,
        tokenSale,
        tokenToMintForFirstAccount
      );

      const secondAccountETHBalanceBeforeBurn =
        await ethers.provider.getBalance(secondAccount.getAddress());

      // Action
      const gasPriceForBurn = await burnTokenInTokenSaleContract(
        secondAccount,
        tokenSale,
        tokenToMintForSecondAccount
      );

      // Assertions after
      if (gasPriceForBurn) {
        const expectedSecondAccountETHBalanceAfterBurn =
          secondAccountETHBalanceBeforeBurn +
          // Since the first account already burned his 2 tokens, the second account will receive only the price of the first 2 tokens
          BigInt(weiSentByFirstAccount) -
          gasPriceForBurn;
        const secondAccountETHBalanceAfterBurn =
          await ethers.provider.getBalance(secondAccount.getAddress());
        expect(secondAccountETHBalanceAfterBurn).to.equal(
          expectedSecondAccountETHBalanceAfterBurn
        );
      }

      // we burnt all the tokens, so the contract should have 0 ether
      const expectedContractETHBalanceAfterBurn = 0;
      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceAfterBurn).to.equal(
        expectedContractETHBalanceAfterBurn
      );

      const expectedSecondAccountTokenBalaneAfterBurn = 0;
      const secondAccountTokenBalaneAfterBurn = await tokenSale.balanceOf(
        secondAccount.getAddress()
      );
      expect(secondAccountTokenBalaneAfterBurn).to.equal(
        expectedSecondAccountTokenBalaneAfterBurn
      );
    });
  });
});
