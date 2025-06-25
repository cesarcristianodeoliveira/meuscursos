import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { codeInput } from '@sanity/code-input' // Importar o plugin de código se estiver usando

export default defineConfig({
  name: 'default',
  title: 'meuscursos', // Seu título para o Sanity Studio

  projectId: '6frgs9wx', // Seu Project ID do Sanity
  dataset: 'production', // Seu dataset

  plugins: [
    structureTool(),
    visionTool(),
    codeInput(), // Inclua o plugin de código aqui se estiver usando
  ],

  schema: {
    types: schemaTypes,
  },

  // --- CONFIGURAÇÃO VITE PARA RESOLVER DEPENDÊNCIAS ---
  vite: {
    optimizeDeps: {
      include: ['react-is'], // Garante que 'react-is' seja pré-bundleado pelo Vite
    },
    build: {
      rollupOptions: {
        external: ['react-is'], // Adicionalmente, o Rollup pode tratar 'react-is' como externo
      },
    },
  },
  // --------------------------------------------------
})