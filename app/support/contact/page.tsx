import MemberCaseInbox from "@/components/member-case-inbox";
import { getMemberCaseInbox } from "@/app/actions/member-operations";
export const dynamic = "force-dynamic";
export const metadata = { title: "Support Inbox" };
export default async function Page() {
  return (
    <MemberCaseInbox
      kind="support"
      initial={await getMemberCaseInbox("support")}
    />
  );
}
