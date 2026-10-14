import React from 'react';
import { Modal, ModalProps } from 'react-native';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/** A consistent native fade, with no movement when the OS requests it. */
export function NativeModal(props: ModalProps) {
  const reducedMotion = useReducedMotion();
  return <Modal {...props} animationType={reducedMotion ? 'none' : 'fade'} />;
}
