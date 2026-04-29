import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 uppercase tracking-widest text-xs",
      destructive: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 uppercase tracking-widest text-xs",
      outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200 uppercase tracking-widest text-xs",
      secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700",
      ghost: "hover:bg-slate-800 hover:text-slate-200",
      link: "text-blue-500 underline-offset-4 hover:underline",
    };
    
    const sizes = {
      default: "h-11 px-6 py-3",
      sm: "h-9 rounded-md px-4",
      lg: "h-12 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
