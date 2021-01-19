import { arrayify } from '@ethersproject/bytes';
import { MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { fill, join } from 'lodash';
import { loadWallet } from '../model/wallet';
import { toHex, web3Provider } from '@rainbow-me/handlers/web3';
import {
  erc20ABI,
  ethUnits,
  smartContractMethods,
  WETH_ADDRESS,
  ZAP_IN_ABI,
  ZapInAddress,
  ZERO_ADDRESS,
} from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';

import logger from 'logger';

const depositEthToZap = async (
  pairAddress,
  minPoolTokens,
  ethValue,
  fromAmount = 0
) => {
  const swapTarget = WETH_ADDRESS;
  const allowanceTarget = WETH_ADDRESS;

  // 224 bytes = 7 (6 args and offset indicator itself) * 32 bytes
  const offsetBytes = 224;
  const dataBytes = 4;

  const offset = ethereumUtils.padLeft(offsetBytes.toString(16), 64);
  const dataLength = ethereumUtils.padLeft(dataBytes.toString(16), 64);
  const depositFunction = ethereumUtils.removeHexPrefix(
    smartContractMethods.deposit.hash
  );

  const rawSwapData = `${offset}${dataLength}${depositFunction}`;
  const remainingPaddingLength = 64 - (rawSwapData.length % 64);
  const remainingPadding = join(fill(Array(remainingPaddingLength), '0'), '');
  const swapData = `${rawSwapData}${remainingPadding}`;
  const swapDataBytes = arrayify('0x' + swapData);

  const zapInContract = new Contract(ZapInAddress, ZAP_IN_ABI, web3Provider);
  try {
    const lpTokensBought = await zapInContract.callStatic.ZapIn(
      ZERO_ADDRESS,
      pairAddress,
      fromAmount,
      minPoolTokens,
      allowanceTarget,
      swapTarget,
      swapDataBytes,
      { value: ethValue }
    );
    return lpTokensBought.toString();
  } catch (error) {
    logger.log('Error depositing ETH to zap', error);
  }
};

const estimateApproveWithExchange = async (owner, spender, exchange) => {
  try {
    const gasLimit = await exchange.estimateGas.approve(spender, MaxUint256, {
      from: owner,
    });
    return gasLimit ? gasLimit.toString() : ethUnits.basic_approval;
  } catch (error) {
    logger.sentry('error estimateApproveWithExchange');
    captureException(error);
    return ethUnits.basic_approval;
  }
};

const estimateApprove = (owner, tokenAddress, spender) => {
  logger.sentry('exchange estimate approve', { owner, spender, tokenAddress });
  const exchange = new Contract(tokenAddress, erc20ABI, web3Provider);
  return estimateApproveWithExchange(owner, spender, exchange);
};

const approve = async (
  tokenAddress,
  spender,
  gasLimit,
  gasPrice,
  wallet = null
) => {
  const walletToUse = wallet || (await loadWallet());
  if (!walletToUse) return null;
  const exchange = new Contract(tokenAddress, erc20ABI, walletToUse);
  const approval = await exchange.approve(spender, MaxUint256, {
    gasLimit: toHex(gasLimit) || undefined,
    gasPrice: toHex(gasPrice) || undefined,
  });
  return {
    approval,
    creationTimestamp: Date.now(),
  };
};

const getRawAllowance = async (owner, token, spender) => {
  try {
    const { address: tokenAddress } = token;
    const tokenContract = new Contract(tokenAddress, erc20ABI, web3Provider);
    const allowance = await tokenContract.allowance(owner, spender);
    return allowance.toString();
  } catch (error) {
    logger.sentry('error getRawAllowance');
    captureException(error);
    return null;
  }
};

export default {
  approve,
  depositEthToZap,
  estimateApprove,
  getRawAllowance,
};
