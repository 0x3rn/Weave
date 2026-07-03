import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
        <Construction className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-heading mb-3">{title}</h2>
      <p className="text-body max-w-md">
        This section is currently under construction. Content and functionality will be added here soon.
      </p>
    </div>
  );
}
