import { Box, Slider, Typography } from '@mui/material';

interface CustomSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  value?: number;
  onChange: (value: number | number[]) => void;
  disabled?: boolean;
}

const CustomSlider = ({ label, min, max, step, defaultValue, value, onChange, disabled }: CustomSliderProps) => {
  return (
    <Box>
      <Typography variant="body2" color={disabled ? 'text.disabled' : 'text.primary'}>{label}</Typography>
      <Slider
        size="small"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        value={value}
        onChange={(_, value) => onChange(value)}
        valueLabelDisplay="auto"
        disabled={disabled}
      />
    </Box>
  );
};


export default CustomSlider;
