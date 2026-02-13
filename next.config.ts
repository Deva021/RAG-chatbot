import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Support WASM files for Transformers.js (client-side embeddings)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle onnxruntime-node on the client
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
        'sharp': false,
      };
    }

    // Allow importing .wasm files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },

  // Allow loading model files from Hugging Face CDN
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
