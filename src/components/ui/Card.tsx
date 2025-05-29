import React from "react";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  padded = true,
  ...rest
}) => {
  return (
    <div
      className={clsx(
        "bg-white rounded-lg shadow-card",
        padded && "p-6",
        hoverable && "transition-shadow hover:shadow-lg",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={clsx("mb-4", className)}>{children}</div>;
};

export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <h3 className={clsx("text-xl font-bold", className)}>{children}</h3>;
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={clsx("mt-4 pt-4 border-t border-neutral-200", className)}>
      {children}
    </div>
  );
};
