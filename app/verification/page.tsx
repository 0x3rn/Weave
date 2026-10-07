import MemberCaseInbox from "@/components/member-case-inbox";
import { getMemberCaseInbox } from "@/app/actions/member-operations";
export const dynamic = "force-dynamic";
export const metadata = { title: "Identity Verification" };
export default async function Page() {
  return (
    <MemberCaseInbox
      kind="verification"
      initial={await getMemberCaseInbox("verification")}
    />
  );
}
