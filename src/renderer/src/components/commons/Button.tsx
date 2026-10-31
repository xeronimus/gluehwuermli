import {ReactNode} from 'react';

import {ButtonVariant, buttonVariants} from './Button.css';

interface ButtonProps {
  /** none for a form's submit button, the form handles it */
  onClick?: () => void;
  children?: ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
  title?: string;
  /** a plain button by default, so one inside a form doesn't submit it */
  type?: 'button' | 'submit';
}

const Button = ({onClick, children, disabled, variant = 'default', title, type = 'button'}: ButtonProps) => (
  <button className={buttonVariants[variant]} type={type} disabled={disabled} onClick={onClick} title={title}>
    {children}
  </button>
);

export default Button;
