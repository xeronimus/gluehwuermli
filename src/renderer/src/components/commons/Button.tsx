import {ReactNode} from 'react';

import {ButtonVariant, buttonVariants} from './Button.css';

interface ButtonProps {
  onClick: () => void;
  children?: ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
  title?: string;
}

const Button = ({onClick, children, disabled, variant = 'default', title}: ButtonProps) => (
  <button className={buttonVariants[variant]} disabled={disabled} onClick={onClick} title={title}>
    {children}
  </button>
);

export default Button;
