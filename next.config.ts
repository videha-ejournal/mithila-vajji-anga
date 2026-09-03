import type { NextConfig } from 'next';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const projectPath = repository && !repository.endsWith('.github.io') ? `/${repository}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.GITHUB_ACTIONS ? projectPath : '',
  assetPrefix: process.env.GITHUB_ACTIONS ? projectPath : '',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
