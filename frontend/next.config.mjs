/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdfjs-dist', 'pdf-parse', 'mammoth', 'pdfreader'],
};

export default nextConfig;
