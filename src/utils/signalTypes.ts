/**
 * Signal type definitions for modular synthesizer
 */

export enum SignalType {
  AUDIO = 'audio',
  CV = 'cv',
  GATE = 'gate',
  NOTE = 'note',
}

/**
 * Color mapping for each signal type
 */
export const SIGNAL_COLORS: Record<SignalType, string> = {
  [SignalType.AUDIO]: '#2196f3', // Blue
  [SignalType.CV]: '#4caf50',    // Green
  [SignalType.GATE]: '#e91e63',  // Red/Pink
  [SignalType.NOTE]: '#ff9800',  // Orange
};

/**
 * Extract signal type from handle ID
 * Handle IDs should follow the pattern: nodeId-handleName-signalType
 * e.g., "vco-1-output-audio", "seq-1-gate-gate"
 */
export function getSignalTypeFromHandleId(handleId: string | null | undefined): SignalType | null {
  if (!handleId) return null;
  
  const parts = handleId.split('-');
  const lastPart = parts[parts.length - 1];
  
  if (Object.values(SignalType).includes(lastPart as SignalType)) {
    return lastPart as SignalType;
  }
  
  return null;
}

/**
 * Check if two signal types are compatible for connection
 */
export function areSignalTypesCompatible(
  sourceType: SignalType | null,
  targetType: SignalType | null
): boolean {
  if (!sourceType || !targetType) return false;
  return sourceType === targetType;
}
