import { createContactVcardResponse } from "@/lib/contact-vcard";

export async function GET() {
  return createContactVcardResponse();
}
