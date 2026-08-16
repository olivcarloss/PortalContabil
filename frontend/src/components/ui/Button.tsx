import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  icon: "icon-btn",
};

export default function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${VARIANT_CLASS[variant]} ${className}`.trim()} {...props} />;
}
