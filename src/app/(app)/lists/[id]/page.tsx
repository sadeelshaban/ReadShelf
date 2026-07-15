import { ListDetailClient } from "@/components/lists/ListDetailClient";

type ListDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const { id } = await params;
  return <ListDetailClient listId={id} />;
}
