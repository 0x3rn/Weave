import { getPrivateExchangeNote } from "@/app/actions/exchange-workspace";
import PrivateNotes from "@/components/exchanges/private-notes";
import { notFound } from "next/navigation";

export default async function NotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const result = await getPrivateExchangeNote(id); if (!result.success) notFound();
  return <PrivateNotes exchangeId={id} initialContent={result.content} updatedAt={result.updatedAt} />;
}
