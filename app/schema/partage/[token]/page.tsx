import { SharedSchemaViewer } from "@/components/schema-editor/SharedSchemaViewer";

export const dynamic = "force-dynamic";

export default async function SharedSchemaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedSchemaViewer token={token} />;
}
