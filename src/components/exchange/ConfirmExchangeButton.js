import React from 'react';
import ExchangeModalTypes from '../../helpers/exchangeModalTypes';
import { HoldToAuthorizeButton } from '../buttons';
import { SlippageWarningThresholdInBips } from './SlippageWarning';
import { colors } from '@rainbow-me/styles';

const ConfirmExchangeButtonShadows = [
  [0, 3, 5, colors.black, 0.2],
  [0, 6, 10, colors.black, 0.14],
  [0, 1, 18, colors.black, 0.12],
];

const getLabel = type => {
  switch (type) {
    case ExchangeModalTypes.addLiquidity:
      return 'Add Liquidity';
    case ExchangeModalTypes.deposit:
      return 'Hold to Deposit';
    case ExchangeModalTypes.removeLiquidity:
      return 'Remove Liquidity';
    case ExchangeModalTypes.withdrawal:
      return 'Hold to Withdraw ';
    default:
      return 'Hold to Swap';
  }
};

const ConfirmExchangeButton = ({
  disabled,
  isAuthorizing,
  isSufficientBalance,
  isSufficientGas,
  isSufficientLiquidity,
  onSubmit,
  slippage,
  testID,
  type,
  ...props
}) => {
  let label = getLabel(type);

  if (!isSufficientBalance) {
    label = 'Insufficient Funds';
  } else if (!isSufficientLiquidity) {
    label = 'Insufficient Liquidity';
  } else if (!isSufficientGas) {
    label = 'Insufficient ETH';
  } else if (slippage > SlippageWarningThresholdInBips) {
    label = 'Swap Anyway';
  } else if (disabled) {
    label = 'Enter an Amount';
  }

  const isDisabled =
    disabled ||
    !isSufficientBalance ||
    !isSufficientGas ||
    !isSufficientLiquidity;

  return (
    <HoldToAuthorizeButton
      disabled={isDisabled}
      disabledBackgroundColor={colors.grey20}
      flex={1}
      hideInnerBorder
      isAuthorizing={isAuthorizing}
      label={label}
      onLongPress={onSubmit}
      shadows={ConfirmExchangeButtonShadows}
      testID={testID}
      theme="dark"
      {...props}
    />
  );
};

export default React.memo(ConfirmExchangeButton);
