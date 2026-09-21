import { getMessageReports } from "@/app/actions/admin/message-reports";
import MessageReportsClient from "@/components/admin/message-reports-client";

export const metadata = { title: "Reports & Flagging" };

export default async function AdminPage() {
  const reports = await getMessageReports();
  return <MessageReportsClient reports={reports} />;
}