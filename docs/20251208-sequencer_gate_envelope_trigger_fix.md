# Sequencer Gate to Envelope Trigger Connection Fix - Walkthrough

**Date**: 2025-12-08

## Problem Statement

SequencerのGate出力をEnvelopeのTrigger入力に接続しても、Envelopeがトリガーされない問題がありました。

## Investigation and Changes Made

### 1. NodeFrequencyEnvelope削除

**問題**: `NodeFrequencyEnvelope`が`Tone.Scale`を登録していたため、Sequencerがトリガーできませんでした。

**対応**: NodeFrequencyEnvelopeを完全に削除しました:
- [NodeEditor.tsx](file:///e:/VSCodeソース/node-modular/src/components/NodeEditor.tsx) からimportと node type登録を削除
- [TemplateSelector.tsx](file:///e:/VSCodeソース/node-modular/src/modules/TemplateSelector.tsx) から FrequencyEnvelopeテンプレートを削除
- `NodeFrequencyEnvelope.tsx` ファイルを削除

### 2. NodeEditorのonConnect修正

**問題**: 新しい接続が作成されたときに、AudioNodeManagerに通知されていませんでした。

**対応**: [NodeEditor.tsx](file:///e:/VSCodeソース/node-modular/src/components/NodeEditor.tsx#L96-L185) の`onConnect`関数を修正し、新しいエッジが追加されたときに即座に接続処理を実行するようにしました:

```typescript
const onConnect = useCallback(
  (params: Connection) => {
    // ... エッジ作成 ...
    
    // 新しい接続を処理するためにAudioNodeManagerを呼び出す
    const sourceNode = audioNodeManager.getAudioNode(params.source!);
    const targetNode = audioNodeManager.getAudioNode(params.target!);
    
    if (sourceNode && targetNode) {
      // 信号タイプに基づいて接続処理を分岐
      if (targetType === 'gate') {
        // Gate信号: トリガー接続
        sourceNode.connectTrigger(targetNode);
      } else if (targetType === 'note' || targetType === 'cv') {
        // Note/CV信号: パラメータへの接続
        sourceNode.connect(targetParam);
      } else if (targetType === 'audio') {
        // Audio信号: 通常のオーディオ接続
        sourceNode.connect(targetNode);
      }
    }
  },
  [setEdges]
);
```

## Browser Testing

### Test 1: Manual Connection

手動で接続を作成したテスト。Sequencerを追加し、Gate→Envelope Trigger、VCO→Envelope、Envelope→Outputの接続を作成しました。

**結果**: コンソールログに「Processing new connection」と「Connected trigger (Gate)」のメッセージが表示され、接続処理が動作していることを確認しました。

Sequencerを開始した後の状態。Sequencerは動作していますが（ステップインジケーターが動いている）、音が出ていません。

### Test 2: Template Loading

「Sequencer Test」テンプレートを読み込んだ状態。

**重要な発見**: テンプレート適用時には`onConnect`が呼び出されないため、接続が処理されません。コンソールログに「Processing new connection」や「Connected trigger (Gate)」のメッセージが表示されませんでした。

## Remaining Issue

**テンプレート読み込み時の接続処理**: 

`handleApplyTemplate`関数は`setNodes`と`setEdges`を直接呼び出すため、`onConnect`がトリガーされません。その結果、テンプレートで定義された接続が処理されず、AudioNodeManagerが接続を確立しません。

### 解決策の選択肢

1. **テンプレート適用後にedgesを再処理**: `handleApplyTemplate`内で、全てのedgesに対して接続処理を実行する
2. **useEffect でedges変更を監視**: edgesが変更されたときに、新しいedgesを処理する
3. **AudioNodeManagerの登録タイミングを変更**: ノード登録時に現在のedgesを参照するのではなく、edges変更時に再接続する

## Final Implementation

### Flag-Based Template Connection Processing

**実装方法**: `handleApplyTemplate`でフラグを設定し、`registerAudioNode`内でテンプレートedgesを処理する方式を採用しました。

**変更内容**:

1. **フラグとRefの追加** ([NodeEditor.tsx](file:///e:/VSCodeソース/node-modular/src/components/NodeEditor.tsx#L57-L58)):
   ```typescript
   const isApplyingTemplate = useRef(false);
   const templateEdgesToProcess = useRef<Edge[]>([]);
   ```

2. **handleApplyTemplateの修正** ([NodeEditor.tsx](file:///e:/VSCodeソース/node-modular/src/components/NodeEditor.tsx#L342-L351)):
   ```typescript
   const handleApplyTemplate = useCallback(
     (template: FlowTemplate) => {
       // テンプレート適用時にフラグを設定
       isApplyingTemplate.current = true;
       templateEdgesToProcess.current = template.edges;
       
       setNodes(template.nodes);
       setEdges(template.edges);
     },
     [setNodes, setEdges]
   );
   ```

3. **registerAudioNodeでの接続処理** ([NodeEditor.tsx](file:///e:/VSCodeソース/node-modular/src/components/NodeEditor.tsx#L63-L78)):
   ```typescript
   const registerAudioNode = useCallback(
     (nodeId: string, audioNode: Tone.ToneAudioNode, params?) => {
       console.log('registerAudioNode', nodeId, params);
       audioNodeManager.registerAudioNode(nodeId, audioNode, edges, params);
       
       // テンプレート適用中で、まだ処理すべきedgesがある場合
       if (isApplyingTemplate.current && templateEdgesToProcess.current.length > 0) {
         setTimeout(() => {
           const edgesToProcess = templateEdgesToProcess.current;
           if (edgesToProcess.length > 0) {
             console.log('Processing template edges after node registration:', edgesToProcess.length);
             edgesToProcess.forEach((edge: Edge) => {
               processConnection(edge);
             });
             templateEdgesToProcess.current = [];
             isApplyingTemplate.current = false;
           }
         }, 200);
       }
     },
     [edges]
   );
   ```

4. **processConnection共通関数** ([NodeEditor.tsx](file:///e:/VSCodeソース/node-modular/src/components/NodeEditor.tsx#L258-L327)):
   - Gate、Note、CV、Audio信号タイプごとの接続処理ロジックを共通化
   - `onConnect`と`registerAudioNode`の両方から使用可能

### 動作原理

1. ユーザーがテンプレートを選択して「Apply Template」をクリック
2. `handleApplyTemplate`がフラグを設定し、処理すべきedgesを保存
3. `setNodes`と`setEdges`でテンプレートを適用
4. 各ノードが初期化され、`registerAudioNode`が呼び出される
5. 最後のノードが登録されたときに、`registerAudioNode`内のsetTimeoutが発火
6. 全てのテンプレートedgesが`processConnection`で処理される
7. Gate接続の場合、`sourceNode.connectTrigger(targetNode)`が呼び出される

### 検証が必要

ブラウザサブエージェントがテンプレート選択で問題に遭遇したため、手動での検証が必要です:

1. http://localhost:3000 を開く
2. TEMPLATESドロップダウンから「Sequencer Test」を選択
3. 「Apply Template」をクリック
4. コンソールで「Processing template edges after node registration」と「Connected trigger (Gate)」のメッセージを確認
5. Sequencerの「Start」ボタンをクリック
6. 音が出るか、Envelopeがトリガーされるかを確認

## Summary

- NodeFrequencyEnvelopeを削除
- NodeEditorの`onConnect`を修正して、手動接続時に即座に接続処理を実行
- テンプレート適用時の接続処理をフラグベースのアプローチで実装
- `processConnection`共通関数を作成して、コードの重複を削減

手動接続では「Connected trigger (Gate)」のログが確認できましたが、実際に音が出るかは手動検証が必要です。
