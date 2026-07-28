import { StyleDetailEntry } from "@/components/matches/style-detail-entry";

export default async function InterceptedStylePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StyleDetailEntry productId={id} overlay />;
}
