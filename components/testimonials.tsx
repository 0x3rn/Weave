import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      quote: "Weave completely changed how I build my products. I was able to trade my backend development skills for incredible UI design. We both got exactly what we needed without spending a dime.",
      author: "Sarah Jenkins",
      role: "Senior Backend Engineer",
      initials: "SJ"
    },
    {
      quote: "The quality of professionals on this platform is unmatched. Because it's invite-only, you don't have to sift through hundreds of low-effort proposals. Every connection is valuable.",
      author: "David Chen",
      role: "Product Designer",
      initials: "DC"
    },
    {
      quote: "I traded SEO optimization for video editing. The escrow system kept everything accountable, and the final deliverable was better than what I would have gotten on traditional freelance sites.",
      author: "Elena Rodriguez",
      role: "Marketing Director",
      initials: "ER"
    }
  ];

  return (
    <section className="py-24 bg-background border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-heading mb-4">Built by professionals, for professionals</h2>
          <p className="text-lg text-body max-w-2xl mx-auto">
            See how independent creators and experts are using Weave to build their ideas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-surface border border-border p-8 rounded-[var(--radius-card)] flex flex-col justify-between shadow-subtle hover:border-primary/50 transition-colors">
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-body font-medium leading-relaxed mb-8">
                  "{testimonial.quote}"
                </p>
              </div>
              <div className="flex items-center gap-4 mt-auto border-t border-border pt-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 flex-shrink-0">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-bold text-heading text-sm">{testimonial.author}</div>
                  <div className="text-xs text-muted font-medium">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
