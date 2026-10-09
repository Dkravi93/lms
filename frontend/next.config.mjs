/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_BASE_PATH ?? "";

const nextConfig = {
	reactStrictMode: true,
	output: "export",
	trailingSlash: true,
	basePath,
	env: { NEXT_PUBLIC_BASE_PATH: basePath },
	images: { unoptimized: true },
};
export default nextConfig;
