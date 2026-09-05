import type { NextConfig } from 'next';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const projectPath = repository && !repository.endsWith('.github.io') ? `/${repository}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: process.env.GITHUB_ACTIONS ? projectPath : '',
  // Vinext's static exporter requests route paths without a trailing slash.
  // Enabling Next's redirect here turns those requests into 308 responses and
  // causes otherwise static secondary pages to be omitted from the export.
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;
