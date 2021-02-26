import React, { useCallback } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../TransactionConfirmationModal'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'
import { Field } from '../../state/swap/actions'
import { ZCurrencyAmount } from '../../zilliqa/ztoken'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param tradeA trade A
 * @param tradeB trade B
 */

export default function ConfirmSwapModal({
  slippageAdjustedAmounts,
  isExactIn,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash
}: {
  isExactIn: boolean
  isOpen: boolean
  slippageAdjustedAmounts: { [field in Field]?: ZCurrencyAmount }
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
}) {
  const modalHeader = useCallback(() => {
    return slippageAdjustedAmounts ? (
      <SwapModalHeader slippageAdjustedAmounts={slippageAdjustedAmounts} recipient={recipient} isExactIn={isExactIn} />
    ) : null
  }, [recipient, slippageAdjustedAmounts])

  const modalBottom = useCallback(() => {
    return slippageAdjustedAmounts ? (
      <SwapModalFooter
        slippageAdjustedAmounts={slippageAdjustedAmounts}
        isExactIn={isExactIn}
        onConfirm={onConfirm}
        swapErrorMessage={swapErrorMessage}
      />
    ) : null
  }, [onConfirm, swapErrorMessage, slippageAdjustedAmounts])

  // text to show while loading
  const pendingText = `Swapping ${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(6)} ${
    slippageAdjustedAmounts[Field.INPUT]?.currency?.symbol
  } for ${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(6)} ${
    slippageAdjustedAmounts[Field.OUTPUT]?.currency?.symbol
  }`

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title="Confirm Swap"
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
    />
  )
}
