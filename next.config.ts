import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: '50mb',
		},
	},
	typescript: {
		ignoreBuildErrors: true
	},
	eslint: {
		// !! WARN !!
		// This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	/* config options here */
};

export default nextConfig;
