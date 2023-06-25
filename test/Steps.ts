import { TokenSale } from "../typechain-types";

export async function sendETHtoTokenSaleContract(
  account: any,
  contract: TokenSale,
  weiToSend: bigint
) {
  const sendTx = await account.sendTransaction({
    to: contract.getAddress(),
    value: weiToSend,
  });

  const receipt = await sendTx.wait();
  const gasUsed = receipt?.gasUsed;
  const gasPrice = sendTx.gasPrice * gasUsed;

  // return the gasprice of the transaction
  return gasPrice;
}

export async function burnTokenInTokenSaleContract(
  account: any,
  contract: TokenSale,
  tokenToMint: bigint
) {
  const burnTx = await contract
    .connect(account)
    ["transferAndCall(address,uint256)"](contract.getAddress(), tokenToMint);

  const receipt = await burnTx.wait();
  const gasUsed = receipt?.gasUsed;
  const gasPrice = gasUsed ? burnTx.gasPrice * gasUsed : undefined;

  // return the gasprice of the transaction
  return gasPrice;
}
