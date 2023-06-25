import { ethers } from "hardhat";

export function approximateEquality(
  value1: bigint,
  value2: bigint,
  allowedError: bigint
): boolean {
  const diff: bigint = BigInt(Math.abs(Number(value1 - value2)));
  return diff <= allowedError;
}

export const allowedError = ethers.parseUnits("300", "wei"); // Allowed rounding error of 300 wei
