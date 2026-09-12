import { getMyReviewHistory } from "@/app/actions/reviews";
import { MessageSquareDashed, Star } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ReviewsPage() {
  const result = await getMyReviewHistory();
  if (!result.success) redirect("/login?next=/reviews");
  const render = (reviews: typeof result.received, received: boolean) => reviews.length ? <div className="space-y-4">{reviews.map(review => {
    const person = received ? review.reviewer : review.target;
    return <article key={review.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-heading">{received ? "From" : "For"} {person.username ? <Link href={`/u/${person.username}`} className="text-primary hover:underline">{person.name}</Link> : person.name}</p><Link href={`/exchanges/${review.exchangeId}/complete`} className="mt-1 block text-sm text-muted hover:text-primary">{review.exchangeTitle}</Link></div><time className="text-xs text-muted">{new Date(review.createdAt).toLocaleDateString()}</time></div><div className="mt-4 flex gap-0.5">{[1,2,3,4,5].map(star => <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-border"}`} />)}</div><p className="mt-3 text-sm leading-relaxed text-body">“{review.comment}”</p>{review.skillEndorsements.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{review.skillEndorsements.map(skill => <span key={skill} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{skill}</span>)}</div>}</article>;
  })}</div> : <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-10 text-center"><MessageSquareDashed className="mx-auto h-10 w-10 text-muted" /><p className="mt-3 font-bold text-heading">No {received ? "received" : "sent"} reviews yet</p></div>;
  return <div className="mx-auto max-w-5xl space-y-9 p-4 py-8 md:p-8"><div><h1 className="text-3xl font-bold text-heading">Reviews</h1><p className="mt-1 text-muted">Feedback from completed exchanges.</p></div><section><h2 className="mb-4 text-xl font-bold text-heading">Received</h2>{render(result.received, true)}</section><section><h2 className="mb-4 text-xl font-bold text-heading">Sent</h2>{render(result.sent, false)}</section></div>;
}
