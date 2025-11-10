import { cn } from "@/lib/utils";

interface CBMIndicatorProps {
  current: number;
  max: number;
  showLabel?: boolean;
  className?: string;
}

const CBMIndicator = ({ current, max, showLabel = true, className }: CBMIndicatorProps) => {
  const percentage = (current / max) * 100;
  
  const getColor = () => {
    if (percentage >= 100) return "bg-cbm-full";
    if (percentage > 92) return "bg-cbm-high";
    if (percentage > 71) return "bg-cbm-medium";
    return "bg-cbm-low";
  };

  const getTextColor = () => {
    if (percentage >= 100) return "text-cbm-full";
    if (percentage > 92) return "text-cbm-high";
    if (percentage > 71) return "text-cbm-medium";
    return "text-cbm-low";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Volume CBM</span>
          <span className={cn("text-sm font-mono font-bold", getTextColor())}>
            {current}/{max} CBM
          </span>
        </div>
      )}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", getColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(percentage)}% rempli
        </p>
      )}
    </div>
  );
};

export default CBMIndicator;
