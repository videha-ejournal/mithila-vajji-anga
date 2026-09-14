import type { Metadata } from 'next';
import HistoryChapterView, {
  historyChapterMetadata,
  historyStaticParams,
} from '../../history-chapter-view';

type PageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return historyStaticParams();
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return historyChapterMetadata(id, 'mai');
}

export default async function ChapterPage({ params }: PageProps) {
  const { id } = await params;
  return <HistoryChapterView id={id} language="mai" />;
}
