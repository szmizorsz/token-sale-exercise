import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployFixtureWithCurveSlope1AndConstant0 } from "./Fixtures";
import {
  sendETHtoTokenSaleContract,
  burnTokenWithTransferInTokenSaleContract,
  burnTokenWithTransferFromInTokenSaleContract,
  apporveTransferFromInTokenSaleContract,
} from "./Steps";
import { approximateEquality, allowedError } from "./Util";

describe("TokenSale miscellanous tests other then curve tests", function () {
  describe("ERC20 transfer and transferFrom override tests", function () {
    it("Should trigger transferAndCall in case of transfer to the contract address as well", async function () {
      // Preparation
      const { tokenSale, firstAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiToSend = ethers.parseEther("3");
      const tokenToMint = ethers.parseEther("2");
      await sendETHtoTokenSaleContract(firstAccount, tokenSale, weiToSend);

      const firstAccountETHBalanceBeforeBurn = await ethers.provider.getBalance(
        firstAccount.getAddress()
      );

      // Action
      const gasPrice = await burnTokenWithTransferInTokenSaleContract(
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

    it("Should trigger transferFromAndCall in case of transferFrom to the contract address as well", async function () {
      // Preparation
      const { tokenSale, firstAccount, secondAccount } = await loadFixture(
        deployFixtureWithCurveSlope1AndConstant0
      );

      const weiToSend = ethers.parseEther("3");
      await sendETHtoTokenSaleContract(firstAccount, tokenSale, weiToSend);
      const tokensMintedForFirstAccount = await tokenSale.balanceOf(
        firstAccount.getAddress()
      );

      const firstAccountETHBalanceBeforeBurn = await ethers.provider.getBalance(
        firstAccount.getAddress()
      );

      const secondAccountETHBalanceBeforeBurn =
        await ethers.provider.getBalance(secondAccount.getAddress());

      const gasPriceForApproval = await apporveTransferFromInTokenSaleContract(
        firstAccount,
        secondAccount,
        tokenSale,
        tokensMintedForFirstAccount
      );

      // Action
      const gasPriceForBurn =
        await burnTokenWithTransferFromInTokenSaleContract(
          secondAccount,
          firstAccount,
          tokenSale,
          tokensMintedForFirstAccount
        );

      // Assertions after
      if (gasPriceForApproval && gasPriceForBurn) {
        const expectedFirstAccountETHBalanceAfterBurn =
          firstAccountETHBalanceBeforeBurn +
          BigInt(weiToSend) -
          gasPriceForApproval;
        const firstAccountETHBalanceAfterBurn =
          await ethers.provider.getBalance(firstAccount.getAddress());
        expect(firstAccountETHBalanceAfterBurn).to.equal(
          expectedFirstAccountETHBalanceAfterBurn
        );

        const expectedSecondAccountETHBalanceAfterBurn =
          secondAccountETHBalanceBeforeBurn - gasPriceForBurn;
        const secondAccountETHBalanceAfterBurn =
          await ethers.provider.getBalance(secondAccount.getAddress());
        expect(secondAccountETHBalanceAfterBurn).to.equal(
          expectedSecondAccountETHBalanceAfterBurn
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
  });
});
