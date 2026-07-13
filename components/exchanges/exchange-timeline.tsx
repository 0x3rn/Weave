import { Exchange } from "@/types";
import { Check, Circle, AlertCircle } from "lucide-react";

interface ExchangeTimelineProps {
  exchange: Exchange;
}

export function ExchangeTimeline({ exchange }: ExchangeTimelineProps) {
  // Define steps
  const steps = [
    { id: "accepted", label: "Accepted", isCompleted: true }, // If exchange exists, it's accepted
    { 
      id: "in_progress", 
      label: "In Progress", 
      isCompleted: ["in_review", "revision_requested", "completed", "cancelled"].includes(exchange.status),
      isActive: exchange.status === "in_progress" 
    },
    { 
      id: "in_review", 
      label: "Review Stage", 
      isCompleted: exchange.status === "completed" || exchange.status === "cancelled",
      isActive: exchange.status === "in_review" || exchange.status === "revision_requested",
      isWarning: exchange.status === "revision_requested"
    },
    { 
      id: "completed", 
      label: "Completed", 
      isCompleted: exchange.status === "completed",
      isActive: exchange.status === "completed",
      isError: exchange.status === "cancelled"
    }
  ];

  if (exchange.status === "cancelled") {
    steps[3].label = "Cancelled";
  }

  return (
    <div className="py-4">
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ 
              width: exchange.status === 'completed' ? '100%' : 
                     (exchange.status === 'in_review' || exchange.status === 'revision_requested') ? '66%' : 
                     '33%' 
            }}
          />
        </div>
        
        <div className="relative flex justify-between">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 relative z-10 
                ${step.isCompleted ? 'bg-primary text-primary-foreground border-2 border-primary' : 
                  step.isActive ? (step.isWarning ? 'bg-amber-500 text-white border-2 border-amber-500' : step.isError ? 'bg-error text-white border-2 border-error' : 'bg-background border-2 border-primary text-primary') : 
                  'bg-background border-2 border-border text-muted group-hover:border-primary/50'}`}
              >
                {step.isCompleted ? (
                  <Check className="w-4 h-4 font-bold" />
                ) : step.isWarning ? (
                  <AlertCircle className="w-4 h-4 font-bold" />
                ) : step.isError ? (
                  <AlertCircle className="w-4 h-4 font-bold" />
                ) : (
                  <Circle className="w-2.5 h-2.5 fill-current" />
                )}
              </div>
              <span className={`mt-2 text-xs font-bold whitespace-nowrap 
                ${step.isCompleted ? 'text-heading' : 
                  step.isActive ? (step.isWarning ? 'text-amber-500' : step.isError ? 'text-error' : 'text-primary') : 
                  'text-muted'}`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
