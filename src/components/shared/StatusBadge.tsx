import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

type PaymentStatus = "paye" | "partiellement_paye" | "non_paye";

interface StatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    paye: {
      label: "Payé",
      variant: "default" as const,
      className: "bg-status-paid text-white hover:bg-status-paid/90",
      icon: CheckCircle2,
    },
    partiellement_paye: {
      label: "Partiel",
      variant: "default" as const,
      className: "bg-status-partial text-white hover:bg-status-partial/90",
      icon: AlertCircle,
    },
    non_paye: {
      label: "Non payé",
      variant: "default" as const,
      className: "bg-status-unpaid text-white hover:bg-status-unpaid/90",
      icon: XCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className} gap-1`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
