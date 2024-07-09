import { defineConfig } from 'orval';

export default defineConfig({
  petstore: {
    output: {
      mode: 'tags-split',
      target: 'src/orval/api',
      schemas: 'src/orval/models',
      client: 'react-query',
      mock: true,
      prettier: true,
      indexFiles: true,
    },
    input: {
      target: './orval/modules/store.openapi.json',
    },
  },
});