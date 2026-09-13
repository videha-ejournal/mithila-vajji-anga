import type { Metadata } from 'next';
import ArchiveReader from '../../../archive-reader';
import { getArchiveUnit } from '../../../archive-data';
import { metadataFor, staticParamsFor } from '../../../archive-route';

type PageProps = { params: Promise<{ work: string; unit: string }> };

export function generateStaticParams() {
  return staticParamsFor('philosophy');
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { work, unit } = await params;
  return metadataFor(getArchiveUnit('philosophy', work, unit), 'mai');
}

export default async function PhilosophyUnitPage({ params }: PageProps) {
  const { work, unit } = await params;
  const record = getArchiveUnit('philosophy', work, unit);
  if (!record) return null;
  return <ArchiveReader unit={record} language="mai" />;
}
