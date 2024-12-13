import React from 'react';
import { Button } from "@/components/ui/button";

interface ButtonConfirmProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const ButtonConfirm: React.FC<ButtonConfirmProps> = ({ onClick, disabled, children, className }) => {
  return (
    <Button
      variant="default"
      className={`w-1/2 font-bold shadow appearance-non text-black ${disabled
        ? "bg-gray-300 cursor-not-allowed"
        : "bg-[#ffeeac] hover:bg-yellow-300"
        } ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default ButtonConfirm;