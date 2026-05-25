import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import JavaScriptObfuscator from 'javascript-obfuscator';

export default defineConfig({
  plugins: [
    react(),

    {
      name: 'obfuscator',

      apply: 'build',

      enforce: 'post',

      generateBundle(_, bundle) {
        for (const file of Object.values(bundle)) {
          if (file.type === 'chunk' && file.code) {
            const obfuscated =
              JavaScriptObfuscator.obfuscate(file.code, {
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                debugProtection: false,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                rotateStringArray: true,
                selfDefending: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.75,
              });

            file.code = obfuscated.getObfuscatedCode();
          }
        }
      },
    },
  ],

  build: {
    sourcemap: false,
    minify: 'esbuild',
  },
});
