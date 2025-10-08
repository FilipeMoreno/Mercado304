'use client';

import React from 'react';
import { BarcodeScanner } from '@/components/barcode-scanner'; // Importando seu scanner

interface NfceBarcodeScannerProps {
  isOpen: boolean;
  onScan: (url: string) => void;
  onClose: () => void;
}

/**
 * Este é um componente "wrapper" ou "adaptador".
 * Ele simplesmente renderiza o BarcodeScanner já existente no projeto,
 * passando as propriedades necessárias para o contexto de escanear uma NF-e.
 * Isso mantém o BarcodeScanner genérico e reutilizável.
 */
export const NfceBarcodeScanner: React.FC<NfceBarcodeScannerProps> = ({ isOpen, onScan, onClose }) => {
  return (
    <BarcodeScanner
      isOpen={isOpen}
      onScan={onScan}
      onClose={onClose}
    />
  );
};