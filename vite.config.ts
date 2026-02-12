import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import viteCompression from 'vite-plugin-compression';
import viteImagemin from 'vite-plugin-imagemin';

import { ASPECT_RATIOS, GEMINI_MODELS } from './src/constants/config';

export default defineConfig(({ mode }) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const csp = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://unpkg.com https://esm.sh;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      connect-src 'self' https://generativelanguage.googleapis.com;
      font-src 'self' data:;
      frame-src 'self' blob:;
      worker-src 'self' blob:;
    `
    .replace(/\s+/g, ' ')
    .trim();

  const httpsKeyPath = path.resolve(__dirname, 'cert/key.pem');
  const httpsCertPath = path.resolve(__dirname, 'cert/cert.pem');
  const httpsConfig =
    fs.existsSync(httpsKeyPath) && fs.existsSync(httpsCertPath)
      ? {
          key: fs.readFileSync(httpsKeyPath),
          cert: fs.readFileSync(httpsCertPath),
        }
      : undefined;

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      https: httpsConfig,
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'production' ? 'hidden' : true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          pure_funcs:
            mode === 'production' ? ['console.log', 'console.info'] : [],
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'gemini-vendor': ['@google/genai'],
          },
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            const info = name.split('.');
            const ext = info[info.length - 1] || '';

            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      reportCompressedSize: true,
      target: 'es2020',
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@google/genai'],
    },
    preview: {
      headers: {
        'Content-Security-Policy': csp,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
    },
    plugins: [
      react(),
      ...(mode === 'production'
        ? [
            viteImagemin({
              gifsicle: {
                optimizationLevel: 7,
                interlaced: false,
              },
              optipng: {
                optimizationLevel: 7,
              },
              mozjpeg: {
                quality: 80,
              },
              pngquant: {
                quality: [0.8, 0.9],
                speed: 4,
              },
              svgo: {
                plugins: [
                  {
                    name: 'removeViewBox',
                    active: false,
                  },
                  {
                    name: 'removeEmptyAttrs',
                    active: true,
                  },
                ],
              },
            }),
          ]
        : []),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240,
        deleteOriginFile: false,
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false,
      }),
      {
        name: 'local-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/generate-image', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            try {
              const chunks: Buffer[] = [];
              req.on('data', (c) => chunks.push(c));
              req.on('end', async () => {
                const bodyRaw = Buffer.concat(chunks).toString('utf-8') || '{}';
                const body = JSON.parse(bodyRaw);

                if (!geminiApiKey) {
                  res.statusCode = 500;
                  res.end('GEMINI_API_KEY is not configured');
                  return;
                }

                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });

                const response = await ai.models.generateContent({
                  model: GEMINI_MODELS.IMAGE,
                  contents: {
                    parts: [{ text: body.prompt }],
                  },
                  config: {
                    responseModalities: ['IMAGE'],
                    imageConfig: {
                      aspectRatio: ASPECT_RATIOS.includes(body.aspectRatio)
                        ? body.aspectRatio
                        : '1:1',
                    },
                  },
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                if (part && part.inlineData) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      data: part.inlineData.data,
                      mimeType: part.inlineData.mimeType || 'image/png',
                    })
                  );
                  return;
                }

                res.statusCode = 500;
                res.end('No image generated');
              });
            } catch (e) {
              res.statusCode = 500;
              res.end('Internal Server Error');
            }
          });

          server.middlewares.use('/api/generate-voxel', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            try {
              const chunks: Buffer[] = [];
              req.on('data', (c) => chunks.push(c));
              req.on('end', async () => {
                const bodyRaw = Buffer.concat(chunks).toString('utf-8') || '{}';
                const body = JSON.parse(bodyRaw);

                if (!geminiApiKey) {
                  res.statusCode = 500;
                  res.end('GEMINI_API_KEY is not configured');
                  return;
                }

                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });

                const response = await ai.models.generateContent({
                  model: GEMINI_MODELS.VOXEL,
                  contents: {
                    parts: [
                      {
                        inlineData: {
                          mimeType: body.mimeType || 'image/jpeg',
                          data: body.imageBase64,
                        },
                      },
                      { text: body.prompt },
                    ],
                  },
                });

                const parts = response.candidates?.[0]?.content?.parts || [];
                const text = parts
                  .map((p) =>
                    p && typeof p === 'object' && 'text' in p
                      ? (p as { text?: string }).text
                      : undefined
                  )
                  .filter((t): t is string => Boolean(t))
                  .join('');

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ html: text }));
              });
            } catch (e) {
              res.statusCode = 500;
              res.end('Internal Server Error');
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  };
});
