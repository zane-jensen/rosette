import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from "vite-plugin-dts"

// https://vite.dev/config/
export default defineConfig({
  publicDir: false,
  
  plugins: [
    react(),
    tailwindcss(),
    dts({
      tsconfigPath: "./tsconfig.lib.json",
      insertTypesEntry: true,
      afterBuild: () => {
        console.log("Types bundled!")
      }
    })
  ],

  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        "rich-editor": resolve(__dirname, 'src/index.ts'),
        "server": resolve(__dirname, 'src/server/index.ts'),
      },
      name: "Rosette",
      formats: ["es"]
    },

    rolldownOptions: {
      external: [
        'react',
        'react-dom',
        'react-dom/server',
        'react/jsx-runtime'
      ],
      output: {
        format: "es",
        entryFileNames: "[name].js"
      }
    }
  }
})
