import {ReactNode} from 'react';

import {ButtonSize, ButtonVariant, buttonSizes, buttonVariants} from './Button.css';

interface ButtonProps {
  /** none for a form's submit button, the form handles it */
  onClick?: () => void;
  children?: ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  title?: string;
  /** a plain button by default, so one inside a form doesn't submit it */
  type?: 'button' | 'submit';
}

const Button = ({
  onClick,
  children,
  disabled,
  variant = 'default',
  size = 'default',
  title,
  type = 'button'
}: ButtonProps) => (
  <button
    className={`${buttonVariants[variant]} ${buttonSizes[size]}`}
    type={type}
    disabled={disabled}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);

export default Button;
