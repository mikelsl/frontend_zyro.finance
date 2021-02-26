import React from 'react'
import styled from 'styled-components'

import ZilLogo from '../../assets/images/zilliqalogo.png'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import { ZCurrency, ZIL } from '../../zilliqa/ztoken'
import { ZYRO_LOG } from '../../zilliqa/constant'

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  style
}: {
  currency?: ZCurrency
  size?: string
  style?: React.CSSProperties
}) {
  if (currency === ZIL) {
    return <StyledEthereumLogo src={ZilLogo} size={size} style={style} />
  }
  if (currency?.symbol === 'ZYRO') {
    return <StyledEthereumLogo src={ZYRO_LOG} size={size} style={style} />
  }
  return <StyledEthereumLogo src={(currency as WrappedTokenInfo)?.logoURI} size={size} style={style} />
}
