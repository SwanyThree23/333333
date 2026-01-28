/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['localhost', 'api.heygen.com', 'api.elevenlabs.io'],
    },
}

module.exports = nextConfig
