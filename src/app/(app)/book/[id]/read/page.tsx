import { ReadPageClient } from "@/components/reader/ReadPageClient";

type ReadPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReadPage({ params }: ReadPageProps) {
  const { id } = await params;
  return <ReadPageClient bookId={id} />;
}
