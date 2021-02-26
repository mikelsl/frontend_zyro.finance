import React, { useContext } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field } from '../../state/swap/actions'
import { TYPE } from '../../theme'
import { isAddress, shortenAddress } from '../../utils'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import { RowBetween, RowFixed } from '../Row'
import { TruncatedText } from './styleds'
import { ZCurrencyAmount } from '../../zilliqa/ztoken'

export default function SwapModalHeader({
  slippageAdjustedAmounts,
  isExactIn,
  recipient
}: {
  slippageAdjustedAmounts: { [field in Field]?: ZCurrencyAmount }
  recipient: string | null
  isExactIn: boolean
}) {
  const theme = useContext(ThemeContext)

  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
      <RowBetween align="flex-end">
        <RowFixed gap={'0px'}>
          <CurrencyLogo
            currency={slippageAdjustedAmounts[Field.INPUT]?.currency}
            size={'24px'}
            style={{ marginRight: '12px' }}
          />
          <TruncatedText fontSize={24} fontWeight={500} color={theme.primary1}>
            {slippageAdjustedAmounts[Field.INPUT]?.toSignificant(6) ?? '-'}
          </TruncatedText>
        </RowFixed>
        <RowFixed gap={'0px'}>
          <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
            {slippageAdjustedAmounts[Field.INPUT]?.currency.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      <RowFixed>
        <ArrowDown size="16" color={theme.text2} style={{ marginLeft: '4px', minWidth: '16px' }} />
      </RowFixed>
      <RowBetween align="flex-end">
        <RowFixed gap={'0px'}>
          <CurrencyLogo
            currency={slippageAdjustedAmounts[Field.OUTPUT]?.currency}
            size={'24px'}
            style={{ marginRight: '12px' }}
          />
          <TruncatedText fontSize={24} fontWeight={500} color={theme.primary1}>
            {slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(6) ?? '-'}
          </TruncatedText>
        </RowFixed>
        <RowFixed gap={'0px'}>
          <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
            {slippageAdjustedAmounts[Field.OUTPUT]?.currency.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
        {isExactIn ? (
          <TYPE.italic textAlign="left" style={{ width: '100%' }}>
            {`Output is estimated. You will receive at least `}
            <b>
              {slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(6)}{' '}
              {slippageAdjustedAmounts[Field.OUTPUT]?.currency.symbol}
            </b>
            {' or the transaction will revert.'}
          </TYPE.italic>
        ) : (
          <TYPE.italic textAlign="left" style={{ width: '100%' }}>
            {`Input is estimated. You will sell at most `}
            <b>
              {slippageAdjustedAmounts[Field.INPUT]?.toSignificant(6)}{' '}
              {slippageAdjustedAmounts[Field.INPUT]?.currency.symbol}
            </b>
            {' or the transaction will revert.'}
          </TYPE.italic>
        )}
      </AutoColumn>
      {recipient !== null ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
          <TYPE.main>
            Output will be sent to{' '}
            <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
          </TYPE.main>
        </AutoColumn>
      ) : null}
    </AutoColumn>
  )
}
