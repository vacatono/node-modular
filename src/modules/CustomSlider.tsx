import React from 'react';
import { Box, Typography, Slider, SliderProps } from '@mui/material';

interface CustomSliderProps extends SliderProps {
  label?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (event: Event, value: number | number[]) => void;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  label,

  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  ...rest
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {label && <Typography variant="body2">{label}</Typography>}
      <Slider
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        onChange={onChange}
        {...rest}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
      />
    </Box>
  );
};

export default CustomSlider;
