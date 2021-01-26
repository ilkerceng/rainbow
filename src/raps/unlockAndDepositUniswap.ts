import { ChainId } from '@uniswap/sdk';
import { concat, reduce } from 'lodash';
import { assetNeedsUnlocking, isValidSwapInput } from './actions';
import {
  createNewAction,
  createNewRap,
  DepositUniswapActionParameters,
  RapAction,
  RapActionTypes,
} from './common';
import { Asset, SelectedGasPrice } from '@rainbow-me/entities';
import { rapsAddOrUpdate } from '@rainbow-me/redux/raps';
import store from '@rainbow-me/redux/store';
import { ethUnits, ZapInAddress } from '@rainbow-me/references';
import { add } from '@rainbow-me/utilities';
import { contractUtils } from '@rainbow-me/utils';

export const estimateDepositUniswapLP = async ({
  inputAmount,
  inputCurrency,
  outputAmount,
  outputCurrency,
}: {
  inputAmount: string | null;
  inputCurrency: Asset;
  outputAmount: string | null;
  outputCurrency: Asset;
}) => {
  if (!inputAmount) inputAmount = '1';
  if (!outputAmount) outputAmount = '1';

  const isValid = isValidSwapInput({
    inputCurrency,
    outputCurrency,
  });

  if (!isValid) return ethUnits.basic_swap;

  const {
    accountAddress,
    chainId,
  }: {
    accountAddress: string;
    chainId: ChainId;
  } = store.getState().settings;

  let gasLimits: (string | number)[] = [];
  const depositAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    ZapInAddress
  );
  if (depositAssetNeedsUnlocking) {
    const unlockGasLimit = await contractUtils.estimateApprove(
      accountAddress,
      inputCurrency.address,
      ZapInAddress
    );
    gasLimits = concat(gasLimits, unlockGasLimit, ethUnits.basic_swap);
  } else {
    // TODO JIN - not this
    const { gasLimit: depositGasLimit } = await estimateDepositGasLimit({
      accountAddress,
      chainId,
      inputCurrency,
      outputCurrency,
    });
    gasLimits = concat(gasLimits, depositGasLimit);
  }

  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

const createDepositUniswapLPRap = async ({
  callback,
  depositToken,
  inputAmount,
  inputCurrency,
  outputCurrency,
  selectedGasPrice,
}: {
  callback: () => void;
  depositToken: string;
  inputAmount: string;
  inputCurrency: Asset;
  outputCurrency: Asset;
  selectedGasPrice: SelectedGasPrice;
}) => {
  // create unlock rap
  const {
    accountAddress,
    chainId,
    network,
  }: {
    accountAddress: string;
    chainId: ChainId;
    network: string;
  } = store.getState().settings;

  let actions: RapAction[] = [];

  const depositAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    ZapInAddress
  );

  if (depositAssetNeedsUnlocking) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      accountAddress,
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      contractAddress: ZapInAddress,
      selectedGasPrice,
    });
    actions = concat(actions, unlock);
  }

  // create a deposit Uniswap rap
  const depositUniswapParams: DepositUniswapActionParameters = {
    accountAddress,
    chainId,
    depositToken,
    inputAmount,
    inputCurrency,
    network,
    outputCurrency,
    selectedGasPrice,
  };

  const depositUniswap = createNewAction(
    RapActionTypes.depositUniswap,
    depositUniswapParams
  );
  actions = concat(actions, depositUniswap);

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  return newRap;
};

export default createDepositUniswapLPRap;
