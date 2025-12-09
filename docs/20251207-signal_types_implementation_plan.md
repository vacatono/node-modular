# Refactoring: Signal Type Separation & Connection Rules

## Goal
To strictily classify signals into 4 types: **Audio**, **CV**, **Gate**, and **Note**, and enforce connection rules so that only compatible types can be connected.
This involves updating the UI (handle colors, validation) and the logic (`AudioNodeManager`).

## Signal Types & Colors
| Type | Color | Description | Usage Examples |
| :--- | :--- | :--- | :--- |
| **Audio** | **Blue** (`#2196f3`) | Audio signals | VCO Out, VCF In/Out, Delay In/Out, Output In |
| **CV** | **Green** (`#4caf50`) | Control Voltages (Modulation) | LFO Out, VCF Cutoff CV, VCO FM CV |
| **Gate** | **Red** (`#e91e63`) | Trigger/Gate signals | Sequencer Gate Out, Envelope Trigger In |
| **Note** | **Orange** (`#ff9800`) | Pitch information (Frequency) | Sequencer Note Out, VCO Frequency In |

## Proposed Changes

### 1. UI Validation (`NodeEditor.tsx`)
*   Implement `isValidConnection` callback in `ReactFlow`.
*   Check the `sourceHandle` and `targetHandle` IDs or data types to ensure they match.
*   **Rule**: `sourceType === targetType` must be true.

### 2. Module Updates (Handle Definitions)
Update `NodeBox` and individual modules to explicitly classify handles.
Assign specific ID suffixes or data attributes to handles to identify their type.

*   **Suffix Convention**:
    *   Audio: `-audio`
    *   CV: `-cv`
    *   Gate: `-gate`
    *   Note: `-note`

#### Affected Modules:
*   **NodeSequencer**:
    *   Note Out -> ID: `seq-note-note` (Type: Note)
    *   Gate Out -> ID: `seq-gate-gate` (Type: Gate)
*   **NodeVCO**:
    *   Audio Out -> ID: `vco-out-audio` (Type: Audio)
    *   **[CHANGE]** Split Frequency input?
        *   Input 1: **Note In** (for Sequencer) -> `vco-note-note`
        *   Input 2: **CV In** (for LFO/Envelope) -> `vco-cv-cv`
*   **NodeAmplitudeEnvelope / FrequencyEnvelope**:
    *   Audio In/Out (AmpEnv only) -> Type: Audio
    *   CV Out (FreqEnv only) -> Type: CV
    *   Trigger In -> ID: `env-trigger-gate` (Type: Gate)
    *   Modulation Inputs (Attack, Decay etc.) -> Type: CV
*   **NodeLFO**:
    *   CV Out -> Type: CV
*   **NodeFilter / Delay / Reverb**:
    *   Audio In/Out -> Type: Audio
    *   Parameter Inputs -> Type: CV

### 3. Logic Updates (`AudioNodeManager.ts`)
*   Refactor `registerAudioNode` (or connection logic) to handle these 4 types specifically.
*   **Current status**: It distinguishes `control`, `trigger` (Gate), and implicitly Audio.
*   **New status**:
    *   **Audio**: `connect()`
    *   **CV**: `connect()` (often to a `Scale` node then to `AudioParam`)
    *   **Note**: `connect()` (direct to Frequency `Signal` or `AudioParam` without scaling usually, or 1V/Oct scaling if needed. Currently our sequencer outputs Hz directly, so simple connection is enough).
    *   **Gate**: `connectTrigger()` (Method call).

## Step-by-Step Implementation

1.  **Define Constants**: Define signal types and colors in a shared constant file.
2.  **Update NodeBox**: Accept `handleType` props to style handles automatically.
3.  **Update Modules**: Apply correct handle types to all modules.
    *   *Critical*: Decide if VCO and Filter need separate inputs for Note vs CV, or if they are just "Control". **Decision**: User asked for 4 types. We will separate them. VCO will have a specific "Note" input.
4.  **Update NodeEditor**: Add `isValidConnection` prop to `ReactFlow`.
5.  **Refactor AudioNodeManager**: Clean up connection logic to respect these types explicitly.

## User Review Required
*   **VCO Inputs**: Are you okay with adding a dedicated "Note" input header/handle to the VCO, separate from generic CV modulation inputs? (Standard modular synths usually have "V/Oct" and "FM").
    *   *Assumption*: Yes, to strictly serve the "4 types" requirement.
