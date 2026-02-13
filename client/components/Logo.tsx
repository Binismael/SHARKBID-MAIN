import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showText?: boolean;
}

export function Logo({ className, variant = 'light', showText = true }: LogoProps) {
  // Use the provided logo image URL
  // Variant 'light' (white text) is c18fe842...
  // Variant 'dark' (blue text) is 1e443557...
  const logoUrl = variant === 'light' 
    ? "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2Fc18fe842220b49a281d4e25d59dee47a?format=webp"
    : "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2F1e443557515645229e0489a01923ed56?format=webp";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={logoUrl} 
        alt="Sharkbid Logo" 
        className={cn(
          "h-10 w-auto object-contain",
          // If we want to hide the text part and only show the shield, we'd need a cropped version.
          // For now, the provided images include the text "SHARK BID".
        )} 
      />
    </div>
  );
}
