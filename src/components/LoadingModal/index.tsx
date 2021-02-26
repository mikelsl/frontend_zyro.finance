import React from 'react'
import Modal from '../Modal'
import LoadingView from './LoadingView'
// import {Zilliqa} from "@zilliqa-js/zilliqa";
// import {CurrentChainId, NetworkProvider} from "../../zilliqa/constant";

// const zilliqa = new Zilliqa(NetworkProvider[CurrentChainId])

interface LoadingModalProps {
  isOpen: boolean
  onDismiss: () => void
  txId?: string | undefined
}

export default function LoadingModal({ isOpen, onDismiss }: LoadingModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={80} minHeight={40}>
      <LoadingView error={false} errorMsg={''} />
    </Modal>
  )
}
