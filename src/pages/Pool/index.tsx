import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Link } from 'react-router-dom'

import { ExternalLink, TYPE, HideSmall } from '../../theme'
import { Text } from 'rebass'
import Card from '../../components/Card'
import { RowBetween, RowFixed } from '../../components/Row'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'

import { useActiveWeb3React } from '../../hooks'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
import {
  useAllLiquidityTokens,
  useTokenReserves,
  useZilReserves,
  useZLPTBalance,
  ZCurrencyAmount,
  ZTokenAmount
} from '../../zilliqa/ztoken'
import FullPositionCard from '../../components/PositionCard'
import { ZERO_AMOUNT } from '../../zilliqa'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`
interface TokenParam {
  userPoolBalance: ZTokenAmount
  totalPoolTokens: ZTokenAmount
  token0Deposited: ZCurrencyAmount
  token1Deposited: ZTokenAmount
  tokenAddress: string
}
export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  // fetch the user's balances of all tracked V2 LP tokens
  // const liquidityTokens = ZLPT[CurrentChainId]
  const tokens = useAllLiquidityTokens()
  const numTokens = tokens.length

  const userPoolBalance = useZLPTBalance(account ?? '')
  // const userPoolBalance = useTokenBalance(ZLPT[CurrentChainId], account ?? '')

  const tokenParams = []
  // {
  //   const token0Deposited = useZilReserves(tokens[1])
  //   const token1Deposited = useTokenReserves(tokens[1])
  //   const param: TokenParam = {
  //     userPoolBalance: userPoolBalance,
  //     totalPoolTokens: ZERO_AMOUNT,
  //     token0Deposited: token0Deposited,
  //     token1Deposited: token1Deposited,
  //     tokenAddress: tokens[1],
  //     token: useCurrency(tokens[1])
  //   }
  //   tokenParams.push(param)
  // }
  {
    const token0Deposited = useZilReserves(tokens[0])
    const token1Deposited = useTokenReserves(tokens[0])
    const param: TokenParam = {
      userPoolBalance: userPoolBalance,
      totalPoolTokens: ZERO_AMOUNT,
      token0Deposited: token0Deposited,
      token1Deposited: token1Deposited,
      tokenAddress: tokens[0]
    }
    tokenParams.push(param)
  }

  return (
    <>
      <PageWrapper>
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Liquidity provider rewards</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  {`Liquidity providers earn a 0.3% fee on all trades proportional to their share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.`}
                </TYPE.white>
              </RowBetween>
              <TYPE.white fontSize={14}>
                Zyro liquidity mining started at 14:00 UTC+8 11/26, 20547 zyro will be mined each day, liquidity
                providers will be able to mine zyro proportional to their share of the pool. mined zyro will be unlocked
                in a daily basis at 00:00 UTC+8 each day to ZLPT holding wallet addresses
              </TYPE.white>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>

        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <TYPE.mediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                  Your liquidity
                </TYPE.mediumHeader>
              </HideSmall>
              <ButtonRow>
                <ResponsiveButtonSecondary as={Link} padding="6px 8px" to="/create/ZIL">
                  Create a pair
                </ResponsiveButtonSecondary>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} padding="6px 8px" to="/add/ZIL">
                  <Text fontWeight={500} fontSize={16}>
                    Add Liquidity
                  </Text>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

            {!account ? (
              <Card padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  Connect to a wallet to view your liquidity.
                </TYPE.body>
              </Card>
            ) : numTokens > 0 ? (
              <>
                <ButtonSecondary>
                  <RowBetween>
                    <ExternalLink href={'https://info.zyro.finance'}>Account analytics and accrued fees</ExternalLink>
                    <span> ↗</span>
                  </RowBetween>
                </ButtonSecondary>

                {tokenParams.map((param: TokenParam) => (
                  <FullPositionCard key={param.tokenAddress} param={param} />
                ))}
              </>
            ) : (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  No liquidity found.
                </TYPE.body>
              </EmptyProposals>
            )}
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
