import { InputHTMLAttributes, forwardRef } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showValue?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, showValue = true, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-text">{label}</label>
            {showValue && props.value !== undefined && (
              <span className="text-sm text-muted">{props.value}</span>
            )}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          className={`w-full h-2 bg-glass2 rounded-lg appearance-none cursor-pointer accent-text ${className}`}
          {...props}
        />
        {props.min !== undefined && props.max !== undefined && (
          <div className="flex justify-between text-xs text-muted">
            <span>{props.min}</span>
            <span>{props.max}</span>
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';