import type { Metadata } from 'next';
import ArchiveReader from '../../../../archive-reader';
import { getArchiveUnit } from '../../../../archive-data';
import { metadataFor, staticParamsFor } from '../../../../archive-route';

type PageProps = { params: Promise<{ work: string; unit: string }> };

export function generateStaticParams() {
  return staticParamsFor('literature');
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { work, unit } = await params;
  return metadataFor(getArchiveUnit('literature', work, unit), 'en');
}

export default async function EnglishLiteratureUnitPage({ params }: PageProps) {
  const { work, unit } = await params;
  const record = getArchiveUnit('literature', work, unit);
  if (!record) return null;
  return <ArchiveReader unit={record} language="en" />;
}
