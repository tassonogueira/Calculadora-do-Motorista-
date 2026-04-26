// src/theme/Button.tsx
// Botão reutilizável do Design System
// Criado: 2022-11-10

import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ButtonProps) => {
  const base = "rounded-md font-medium transition-colors focus:outline-none";

  const variants: Record<Variant, string> = {
    primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90",
    secondary: "bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary)]/90",
    outline: "border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10",
  };

  const sizes: Record<Size, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-5 py-3 text-lg",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
