import React from 'react';
import { IDurationProps } from '../types/Duration.types';
import { format } from '../constants/Duration.constants';

export default function Duration({ className, seconds }: IDurationProps) {
  return (
    <time dateTime={`P${Math.round(seconds)}S`} className={className}>
      {format(seconds)}
    </time>
  );
}
