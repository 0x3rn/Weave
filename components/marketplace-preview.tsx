export default function MarketplacePreview() {
  const categories = [
    "Software Development", "UI Design", "Graphic Design", "Product Design",
    "Brand Identity", "Copywriting", "Technical Writing", "Marketing",
    "SEO", "Video Editing", "Motion Design", "Illustration",
    "Photography", "Accounting", "Legal", "Business Strategy",
    "Product Management", "No-Code", "AI Automation", "Virtual Assistance",
    "Translation", "Data Analysis", "Customer Support", "Community Management"
  ];

  return (
    <section id="marketplace" className="py-24 bg-surface-secondary border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-heading mb-12">Find professionals across every discipline</h2>
        
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category, index) => (
            <span 
              key={index} 
              className="px-4 py-2 bg-surface border border-border text-body text-sm font-medium rounded-[var(--radius-badge)] hover:border-primary/50 hover:text-primary transition-colors cursor-default"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
