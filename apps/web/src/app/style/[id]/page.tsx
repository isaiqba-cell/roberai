import { notFound } from "next/navigation";

import { StyleDetailEntry } from "@/components/matches/style-detail-entry";
import { getMatchingCatalogProduct } from "@/lib/catalog/matching-catalog";

export default async function StylePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { product } = await getMatchingCatalogProduct(id);
  if (!product) notFound();
  return <StyleDetailEntry productId={id} />;
}
