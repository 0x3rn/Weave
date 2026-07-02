import { Users, UserCheck, Star, Clock } from "lucide-react";

export default function Trust() {
  const cards = [
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Invite-Only Community",
      description: "Members enter through invitations or approval to maintain quality."
    },
    {
      icon: <UserCheck className="w-6 h-6 text-primary" />,
      title: "Verified Professionals",
      description: "Identity and professional verification help ensure you're working with real freelancers."
    },
    {
      icon: <Star className="w-6 h-6 text-primary" />,
      title: "Reputation Scores",
      description: "Every completed exchange builds trust and improves visibility."
    },
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "Transparent History",
      description: "See completed exchanges, reviews, and reliability before accepting work."
    }
  ];

  return (
    <section id="trust-safety" className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-heading">Built around trust, not transactions</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <div key={index} className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                {card.icon}
              </div>
              <h3 className="text-lg font-bold text-heading mb-3">{card.title}</h3>
              <p className="text-sm text-body leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
