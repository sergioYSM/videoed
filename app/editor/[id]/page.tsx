import { redirect } from 'next/navigation';
// Old links: /editor/<id> -> /edit?id=<id>
export default async function Old({ params }: { params: Promise<{ id: string }> }) { redirect(`/edit?id=${encodeURIComponent((await params).id)}`); }
