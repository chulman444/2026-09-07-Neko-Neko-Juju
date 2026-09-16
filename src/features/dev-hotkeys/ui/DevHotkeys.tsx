import React from 'react';
import { useDevHotkeys, type UseDevHotkeysOptions } from '../model/useDevHotkeys';

export interface DevHotkeysProps extends UseDevHotkeysOptions {}

export const DevHotkeys: React.FC<DevHotkeysProps> = (props) => {
  useDevHotkeys(props);
  return null;
};
