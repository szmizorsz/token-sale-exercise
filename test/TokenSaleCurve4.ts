import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployFixtureWithCurveSlope0AndConstant1 } from "./Fixtures";
import {
  sendETHtoTokenSaleContract,
  burnTokenInTokenSaleContract,
} from "./Steps";
import { approximateEquality, allowedError } from "./Util";

describe("TokenSale tests for curve with constant = 1.0, slope = 0.0", function () {
  describe("Calculate price", function () {
    it("Should calculate price for the first buy", async function () {
      // Preparation
      const { tokenSale } = await loadFixture(
        deployFixtureWithCurveSlope0AndConstant1
      );

      // Action
      const tokensToBuy = ethers.parseEther("3");
      const price = await tokenSale.calculatePrice(tokensToBuy);

      // Assertions
      expect(price).to.equal(ethers.parseEther("3"));
    });

    it("Should calculate price for the second buy", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope0AndConstant1
      );

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: ethers.parseEther("3"),
      });

      // Action
      const tokensToBuy = ethers.parseEther("3");
      const price = await tokenSale.calculatePrice(tokensToBuy);

      // Assertions
      expect(price).to.equal(ethers.parseEther("3"));
    });
  });

  describe("Calculate number of tokens from price", function () {
    it("Should calculate tokens from price before the first buy", async function () {
      // Preparation
      const { tokenSale } = await loadFixture(
        deployFixtureWithCurveSlope0AndConstant1
      );

      // Action
      const price = ethers.parseEther("6");
      const tokensToBuy = await tokenSale.calculateTokensFromPrice(price);

      // Assertions
      expect(tokensToBuy).to.equal(ethers.parseEther("6"));
    });

    it("Should calculate tokens from price before the second buy", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope0AndConstant1
      );

      await firstAccount.sendTransaction({
        to: tokenSale.getAddress(),
        value: ethers.parseEther("3"),
      });

      // Action
      const price = ethers.parseEther("12");
      const tokensToBuy = await tokenSale.calculateTokensFromPrice(price);

      // Assertions
      const expectedTokens = ethers.parseEther("12");
      expect(approximateEquality(tokensToBuy, expectedTokens, allowedError)).to
        .be.true;
    });
  });

  describe("Receive ether and mint tokens", function () {
    it("Should recieve ether from ONE user and mint tokens", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope0AndConstant1
      );

      // Assertions before
      const contractBalanceBefore = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractBalanceBefore).to.equal(0);

      // Action
      const weiToSend = ethers.parseEther("3");
      await sendETHtoTokenSaleContract(firstAccount, tokenSale, weiToSend);

      // Assertions after
      const expectedContractBalanceAfter = weiToSend;
      const expectedTokenBalance = ethers.parseEther("3");
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
        deployFixtureWithCurveSlope0AndConstant1
      );

      const weiSentByFirstAccount = ethers.parseEther("3");
      await sendETHtoTokenSaleContract(
        firstAccount,
        tokenSale,
        weiSentByFirstAccount
      );

      // Action
      const weiSentBySecondAccount = ethers.parseEther("7");
      await sendETHtoTokenSaleContract(
        secondAccount,
        tokenSale,
        weiSentBySecondAccount
      );

      // Assertions after
      const expectedContractBalanceAfter =
        weiSentByFirstAccount + weiSentBySecondAccount;
      const expectedTokenBalaneFirstAccount = ethers.parseEther("3");
      const expectedTokenBalaneSecondAccount = ethers.parseEther("7");

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
      expect(
        approximateEquality(
          tokenBalaneSecondAccount,
          expectedTokenBalaneSecondAccount,
          allowedError
        )
      ).to.be.true;
    });
  });

  describe("Receive token, burn and send ether back", function () {
    it("Should recieve ether from ONE user, mint tokens, burn them completely and send ether back", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope0AndConstant1
      );

      const weiToSend = ethers.parseEther("3");
      const tokenToMint = ethers.parseEther("3");
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
        deployFixtureWithCurveSlope0AndConstant1
      );

      const weiToSend = ethers.parseEther("3");
      const tokenToMint = ethers.parseEther("3");
      await sendETHtoTokenSaleContract(firstAccount, tokenSale, weiToSend);

      const firstAccountETHBalanceBeforeBurn = await ethers.provider.getBalance(
        firstAccount.getAddress()
      );

      // Action
      const tokenToBurn = ethers.parseEther("1");
      const gasPrice = await burnTokenInTokenSaleContract(
        firstAccount,
        tokenSale,
        tokenToBurn
      );

      // Assertions after
      if (gasPrice) {
        const expectedWeiToReceived = ethers.parseEther("1");
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

      const expectedContractETHBalanceAfterBurn = ethers.parseEther("2");
      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(contractETHBalanceAfterBurn).to.equal(
        expectedContractETHBalanceAfterBurn
      );

      const expectedFirstAccountTokenBalaneAfterBurn = ethers.parseEther("2");
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
        deployFixtureWithCurveSlope0AndConstant1
      );

      const weiSentByFirstAccount = ethers.parseEther("3");
      await sendETHtoTokenSaleContract(
        firstAccount,
        tokenSale,
        weiSentByFirstAccount
      );

      const weiSentBySecondAccount = ethers.parseEther("7");
      await sendETHtoTokenSaleContract(
        secondAccount,
        tokenSale,
        weiSentBySecondAccount
      );
      const tokenToMintForSecondAccount = await tokenSale.balanceOf(
        secondAccount.getAddress()
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
        expect(
          approximateEquality(
            secondAccountETHBalanceAfterBurn,
            expectedSecondAccountETHBalanceAfterBurn,
            allowedError
          )
        ).to.be.true;
      }

      const expectedContractETHBalanceAfterBurn = weiSentByFirstAccount;
      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(
        approximateEquality(
          contractETHBalanceAfterBurn,
          expectedContractETHBalanceAfterBurn,
          allowedError
        )
      ).to.be.true;

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
        deployFixtureWithCurveSlope0AndConstant1
      );

      const weiSentByFirstAccount = ethers.parseEther("3");
      await sendETHtoTokenSaleContract(
        firstAccount,
        tokenSale,
        weiSentByFirstAccount
      );

      const weiSentBySecondAccount = ethers.parseEther("7");
      const tokenToMintForSecondAccount = ethers.parseEther("7");
      await sendETHtoTokenSaleContract(
        secondAccount,
        tokenSale,
        weiSentBySecondAccount
      );

      const secondAccountETHBalanceBeforeBurn =
        await ethers.provider.getBalance(secondAccount.getAddress());

      // Action
      const tokenToBurn = ethers.parseEther("1");
      const gasPriceForBurn = await burnTokenInTokenSaleContract(
        secondAccount,
        tokenSale,
        tokenToBurn
      );

      // Assertions after
      if (gasPriceForBurn) {
        const expectedWeiToReceived = ethers.parseEther("1");
        const expectedSecondAccountETHBalanceAfterBurn =
          secondAccountETHBalanceBeforeBurn +
          BigInt(expectedWeiToReceived) -
          gasPriceForBurn;
        const secondAccountETHBalanceAfterBurn =
          await ethers.provider.getBalance(secondAccount.getAddress());
        expect(
          approximateEquality(
            secondAccountETHBalanceAfterBurn,
            expectedSecondAccountETHBalanceAfterBurn,
            allowedError
          )
        ).to.be.true;
      }

      const expectedContractETHBalanceAfterBurn = ethers.parseEther("9");
      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );

      expect(
        approximateEquality(
          contractETHBalanceAfterBurn,
          expectedContractETHBalanceAfterBurn,
          allowedError
        )
      ).to.be.true;

      const expectedSecondAccountTokenBalaneAfterBurn = ethers.parseEther("6");
      const secondAccountTokenBalaneAfterBurn = await tokenSale.balanceOf(
        secondAccount.getAddress()
      );
      expect(
        approximateEquality(
          secondAccountTokenBalaneAfterBurn,
          expectedSecondAccountTokenBalaneAfterBurn,
          allowedError
        )
      ).to.be.true;
    });

    it("Should recieve ether from TWO users, mint tokens, burn BOTH users tokens completely and send ether back", async function () {
      // Preparation
      const { tokenSale, firstAccount, secondAccount } = await loadFixture(
        deployFixtureWithCurveSlope0AndConstant1
      );

      const weiSentByFirstAccount = ethers.parseEther("3");
      await sendETHtoTokenSaleContract(
        firstAccount,
        tokenSale,
        weiSentByFirstAccount
      );
      const tokenSMintedForFirstAccount = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );

      const weiSentBySecondAccount = ethers.parseEther("7");
      await sendETHtoTokenSaleContract(
        secondAccount,
        tokenSale,
        weiSentBySecondAccount
      );
      const tokenSMintedForSecondAccount = await tokenSale.balanceOf(
        secondAccount.getAddress()
      );

      await burnTokenInTokenSaleContract(
        firstAccount,
        tokenSale,
        tokenSMintedForFirstAccount
      );

      const secondAccountETHBalanceBeforeBurn =
        await ethers.provider.getBalance(secondAccount.getAddress());

      // Action
      const gasPriceForBurn = await burnTokenInTokenSaleContract(
        secondAccount,
        tokenSale,
        tokenSMintedForSecondAccount
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

      // we burnt all the tokens, so the contract should have 0 ether
      const expectedContractETHBalanceAfterBurn = BigInt(0);
      const contractETHBalanceAfterBurn = await ethers.provider.getBalance(
        tokenSale.getAddress()
      );
      expect(
        approximateEquality(
          contractETHBalanceAfterBurn,
          expectedContractETHBalanceAfterBurn,
          allowedError
        )
      ).to.be.true;

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
