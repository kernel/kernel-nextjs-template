/** @type {import('next').NextConfig} */
const nextConfig = {
  // the dev server is reachable as localhost and as 127.0.0.1, and the dev
  // overlay refuses to load its own resources from the second one
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
