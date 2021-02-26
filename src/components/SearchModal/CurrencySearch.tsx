import React, {KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {FixedSizeList} from 'react-window'
import {Text} from 'rebass'
import {CloseIcon} from '../../theme'
import {validation} from '@zilliqa-js/util'
import Column from '../Column'
import QuestionHelper from '../QuestionHelper'
import {RowBetween} from '../Row'
import CurrencyList from './CurrencyList'
import SortButton from './SortButton'
import {PaddedColumn, SearchInput, Separator} from './styleds'
import AutoSizer from 'react-virtualized-auto-sizer'
import {ZCurrency, ZIL} from '../../zilliqa/ztoken'
import {useSelectedTokenList} from '../../state/lists/hooks'
import {CurrentChainId} from "../../zilliqa/constant";

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: ZCurrency | null
  onCurrencySelect: (currency: ZCurrency) => void
  otherSelectedCurrency?: ZCurrency | null
  showCommonBases?: boolean
  onChangeList: () => void
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  onDismiss,
  isOpen,
  onChangeList
}: CurrencySearchProps) {
  const { t } = useTranslation()
  const fixedList = useRef<FixedSizeList>()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [invertSearchOrder, setInvertSearchOrder] = useState<boolean>(false)
  const allTokens = Object.values(useSelectedTokenList()[CurrentChainId]).filter(
    token => !(token.address !== undefined && token.symbol === 'ZIL')
  )

  const showZIL: boolean = useMemo(() => {
    const s = searchQuery.toLowerCase().trim()
    return s === '' || s === 'z' || s === 'zi' || s === 'zil'
  }, [searchQuery])

  const handleCurrencySelect = useCallback(
    (currency: ZCurrency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback(event => {
    const input = event.target.value
    const checksummedInput = validation.isAddress(input)
    setSearchQuery(checksummedInput ? input : '')
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = searchQuery.toLowerCase().trim()
        if (s === 'zil') {
          handleCurrencySelect(ZIL)
        } else if (allTokens.length > 0) {
          if (allTokens[0].symbol?.toLowerCase() === searchQuery.trim().toLowerCase() || allTokens.length === 1) {
            handleCurrencySelect(allTokens[0])
          }
        }
      }
    },
    [allTokens, handleCurrencySelect, searchQuery]
  )

  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text fontWeight={500} fontSize={16}>
            Select a token
            <QuestionHelper text="Find a token by searching for its name or symbol or by pasting its address below." />
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t('tokenSearchPlaceholder')}
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={handleInput}
          onKeyDown={handleEnter}
        />
        <RowBetween>
          <Text fontSize={14} fontWeight={500}>
            Token Name
          </Text>
          <SortButton ascending={invertSearchOrder} toggleSortOrder={() => setInvertSearchOrder(iso => !iso)} />
        </RowBetween>
      </PaddedColumn>

      <Separator />

      <div style={{ flex: '1' }}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <CurrencyList
              height={height}
              showZIL={showZIL}
              currencies={allTokens}
              onCurrencySelect={handleCurrencySelect}
              otherCurrency={otherSelectedCurrency}
              selectedCurrency={selectedCurrency}
              fixedListRef={fixedList}
            />
          )}
        </AutoSizer>
      </div>
    </Column>
  )
}
