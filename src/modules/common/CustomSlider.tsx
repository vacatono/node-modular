import { Box, Slider, Typography } from '@mui/material';

interface CustomSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onChange: (value: number | number[]) => void;
}

const CustomSlider = ({ label, min, max, step, defaultValue, onChange }: CustomSliderProps) => {
  return (
    <Box>
      <Typography variant="body2">{label}</Typography>
      <Slider
        size="small"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        onChange={(_, value) => onChange(value)}
        valueLabelDisplay="auto"
      />
    </Box>
  );
};

export default CustomSlider;
