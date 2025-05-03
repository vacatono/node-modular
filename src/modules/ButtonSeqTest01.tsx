import React, { useEffect, useState } from 'react';
import * as Tone from 'tone';
import { Button } from '@mui/material';

const ButtonSeqTest01: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synths, setSynths] = useState<Tone.MonoSynth[]>([]);
  const [sequences, setSequences] = useState<Tone.Sequence[]>([]);

  useEffect(() => {
    // 基準音（A5）の周波数
    const baseFrequency = 440.0;

    // 純正律の周波数比
    const justRatios = {
      unison: 1, // 完全1度
      minorSecond: 16 / 15, // 短2度
      majorSecond: 9 / 8, // 長2度
      minorThird: 6 / 5, // 短3度
      majorThird: 5 / 4, // 長3度
      perfectFourth: 4 / 3, // 完全4度
      perfectFifth: 3 / 2, // 完全5度
      minorSixth: 8 / 5, // 短6度
      majorSixth: 5 / 3, // 長6度
      minorSeventh: 9 / 5, // 短7度
      majorSeventh: 15 / 8, // 長7度
      octave: 2, // 完全8度
    };

    // Aメジャーコード（A-C#-E）とその転回形
    const frequencies1 = [
      baseFrequency * justRatios.unison, // A5
      baseFrequency * justRatios.unison, // C#6
      baseFrequency * justRatios.perfectFifth, // E6
      baseFrequency * justRatios.unison, // F#6
    ];

    // Eメジャーコード（E-G#-B）とその転回形
    const frequencies2 = [
      baseFrequency * justRatios.octave, // E5
      baseFrequency * justRatios.perfectFifth, // G#5
      baseFrequency * justRatios.octave, // B5
      baseFrequency * justRatios.perfectFourth * justRatios.octave, // C#6
    ];

    // Dメジャーコード（D-F#-A）とその転回形
    const frequencies3 = [
      baseFrequency * justRatios.perfectFourth, // D5
      baseFrequency * justRatios.majorSixth, // F#5
      baseFrequency * justRatios.unison, // A5
      baseFrequency * justRatios.majorSecond, // B5
    ];

    // C#マイナーコード（C#-E-G#）とその転回形
    const frequencies4 = [
      baseFrequency * justRatios.majorThird, // C#5
      baseFrequency * justRatios.perfectFifth, // E5
      baseFrequency * justRatios.majorSeventh, // G#5
      baseFrequency * justRatios.unison, // A5
    ];

    const createSynth = () => {
      return new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.1,
          decay: 0.1,
          sustain: 0.9,
          release: 0.3,
        },
        portamento: 0,
      }).toDestination();
    };

    const createSequence = (synth: Tone.MonoSynth, frequencies: number[], startTime: number) => {
      return new Tone.Sequence(
        (time, frequency) => {
          synth.triggerAttack(frequency, time);
        },
        frequencies,
        '1n'
      ).start(startTime);
    };

    const newSynths = [createSynth(), createSynth(), createSynth(), createSynth()];

    const newSequences = [
      createSequence(newSynths[0], frequencies1, 0),
      createSequence(newSynths[1], frequencies2, 0),
      //createSequence(newSynths[2], frequencies3, 0),
      //createSequence(newSynths[3], frequencies4, 0),
    ];

    setSynths(newSynths);
    setSequences(newSequences);

    // クリーンアップ関数
    return () => {
      newSequences.forEach((seq) => seq.dispose());
      newSynths.forEach((synth) => synth.dispose());
    };
  }, []);

  const handleClick = async () => {
    if (!isPlaying) {
      // Tone.jsのコンテキストを開始
      await Tone.start();
      Tone.Transport.start();
      setIsPlaying(true);
    } else {
      Tone.Transport.stop();
      setIsPlaying(false);
    }
  };

  return (
    <Button variant="contained" color={isPlaying ? 'secondary' : 'primary'} onClick={handleClick} sx={{ margin: 1 }}>
      {isPlaying ? 'Stop Sequence' : 'Start Sequence'}
    </Button>
  );
};

export default ButtonSeqTest01;
