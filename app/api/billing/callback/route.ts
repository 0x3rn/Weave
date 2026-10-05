import { getCurrentUserId } from "@/app/actions/user";
import { verifyCheckout } from "@/lib/billing";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
export async function GET(request: Request) {
  const destination = new URL(
    "/settings/billing",
    process.env.NEXT_PUBLIC_APP_URL || request.url,
  );
  try {
    const uid = await getCurrentUserId();
    if (!uid) throw new Error("Sign in to verify this payment");
    const reference = new URL(request.url).searchParams.get("reference");
    if (!reference || reference.length > 100)
      throw new Error("Missing payment reference");
    await verifyCheckout(reference, uid);
    revalidatePath("/settings/billing");
    destination.searchParams.set(
      "success",
      "Payment verified. Your subscription is active.",
    );
  } catch (error) {
    destination.searchParams.set(
      "error",
      error instanceof Error
        ? error.message
        : "Payment is awaiting confirmation",
    );
  }
  return NextResponse.redirect(destination);
}
