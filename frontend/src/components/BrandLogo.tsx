import React from "react";

interface BrandLogoProps {
    size?: "sm" | "md" | "lg" | "xl";
    showTagline?: boolean;
    className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = "md", showTagline = false, className = "" }) => {
    const sizeMap = {
        sm: "h-8",
        md: "h-10",
        lg: "h-14",
        xl: "h-20",
    };

    return (
        <div className={`flex flex-col items-center leading-none ${className}`}>
            <img
                src="/stlogo.png"
                alt="St. Joseph's College of Engineering"
                className={`${sizeMap[size]} w-auto object-contain`}
            />
            {showTagline && (
                <span className={`text-[#005EB8] font-semibold tracking-wider ${size === 'xl' ? 'text-sm mt-1' : 'text-[0.55rem] mt-0.5'}`}>
                    St. Joseph's College of Engineering
                </span>
            )}
        </div>
    );
};

export default BrandLogo;
