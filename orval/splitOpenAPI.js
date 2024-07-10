import fs from 'fs-extra';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';
import path from 'path';

// Uzyskanie aktualnej ścieżki katalogu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wczytanie pliku JSON
async function readOpenAPISpec(filePath) {
  return await fs.readJson(filePath);
}

function createTagModule(openapi, tag) {
  const tagModule = JSON.parse(JSON.stringify(openapi));

  // Filtrowanie ścieżek według tagu
  tagModule.paths = Object.fromEntries(
    Object.entries(openapi.paths).filter(([, methods]) =>
      Object.values(methods).some(
        method => method.tags && method.tags.includes(tag)
      )
    )
  );

  if (openapi.tags) {
    tagModule.tags = openapi.tags.filter(t => t.name === tag);
  }

  // Znalezienie wszystkich wymaganych komponentów (schemas, requestBodies, responses, parameters, securitySchemes)
  const requiredComponents = new Set();
  for (const methods of Object.values(tagModule.paths)) {
    for (const method of Object.values(methods)) {
      if (method.requestBody) {
        for (const mediaType of Object.values(method.requestBody.content)) {
          getRefsFromSchema(mediaType.schema, requiredComponents, openapi);
        }
      }
      if (method.responses) {
        for (const response of Object.values(method.responses)) {
          if (response.content) {
            for (const mediaType of Object.values(response.content)) {
              getRefsFromSchema(mediaType.schema, requiredComponents, openapi);
            }
          }
          if (response.$ref) {
            const ref = response.$ref.split('/').pop();
            requiredComponents.add(ref);
          }
        }
      }
      if (method.parameters) {
        for (const parameter of method.parameters) {
          if (parameter.schema) {
            getRefsFromSchema(parameter.schema, requiredComponents, openapi);
          }
        }
      }
    }
  }

  // Filtrowanie komponentów
  if (openapi.components) {
    tagModule.components = filterComponents(
      openapi.components,
      requiredComponents
    );
  }

  return tagModule;
}

function getRefsFromSchema(schema, requiredComponents, openapi) {
  if (!schema) return;

  if (schema.$ref) {
    const ref = schema.$ref.split('/').pop();
    requiredComponents.add(ref);
    if (schema.$ref.startsWith('#/components/schemas/')) {
      const schemaName = schema.$ref.replace('#/components/schemas/', '');
      if (openapi.components.schemas[schemaName]) {
        getRefsFromSchema(
          openapi.components.schemas[schemaName],
          requiredComponents,
          openapi
        );
      }
    } else if (schema.$ref.startsWith('#/components/responses/')) {
      const responseName = schema.$ref.replace('#/components/responses/', '');
      if (openapi.components.responses[responseName]) {
        getRefsFromResponse(
          openapi.components.responses[responseName],
          requiredComponents,
          openapi
        );
      }
    }
  }

  if (schema.items) {
    getRefsFromSchema(schema.items, requiredComponents, openapi);
  }

  if (schema.properties) {
    for (const propSchema of Object.values(schema.properties)) {
      getRefsFromSchema(propSchema, requiredComponents, openapi);
    }
  }

  if (schema.anyOf) {
    for (const itemSchema of schema.anyOf) {
      getRefsFromSchema(itemSchema, requiredComponents, openapi);
    }
  }

  if (schema.allOf) {
    for (const itemSchema of schema.allOf) {
      getRefsFromSchema(itemSchema, requiredComponents, openapi);
    }
  }

  if (schema.oneOf) {
    for (const itemSchema of schema.oneOf) {
      getRefsFromSchema(itemSchema, requiredComponents, openapi);
    }
  }
}

function getRefsFromResponse(response, requiredComponents, openapi) {
  if (!response) return;

  if (response.content) {
    for (const mediaType of Object.values(response.content)) {
      getRefsFromSchema(mediaType.schema, requiredComponents, openapi);
    }
  }

  if (response.$ref) {
    const ref = response.$ref.split('/').pop();
    requiredComponents.add(ref);
    if (response.$ref.startsWith('#/components/schemas/')) {
      const schemaName = response.$ref.replace('#/components/schemas/', '');
      if (openapi.components.schemas[schemaName]) {
        getRefsFromSchema(
          openapi.components.schemas[schemaName],
          requiredComponents,
          openapi
        );
      }
    } else if (response.$ref.startsWith('#/components/responses/')) {
      const responseName = response.$ref.replace('#/components/responses/', '');
      if (openapi.components.responses[responseName]) {
        getRefsFromResponse(
          openapi.components.responses[responseName],
          requiredComponents,
          openapi
        );
      }
    }
  }
}

function filterComponents(components, requiredComponents) {
  const filteredComponents = {};
  for (const [compType, compDict] of Object.entries(components)) {
    filteredComponents[compType] = Object.fromEntries(
      Object.entries(compDict).filter(([name]) => requiredComponents.has(name))
    );
  }
  return filteredComponents;
}

async function main() {
  const openapiPath = path.join(__dirname, 'openapi.json');
  const openapi = await readOpenAPISpec(openapiPath);

  // Znalezienie wszystkich unikalnych tagów w API
  const tags = new Set();
  for (const methods of Object.values(openapi.paths)) {
    for (const method of Object.values(methods)) {
      if (method.tags) {
        method.tags.forEach(tag => tags.add(tag));
      }
    }
  }

  // Konwersja tagów na listę i wyświetlenie ich użytkownikowi
  const tagList = Array.from(tags);

  // Interaktywne menu dla użytkownika
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedTag',
      message: 'Wybierz moduł do wygenerowania:',
      choices: tagList,
    },
  ]);

  const selectedTag = answers.selectedTag;

  // Utworzenie folderu 'modules', jeśli nie istnieje
  fs.ensureDirSync(path.join(__dirname, 'modules'));

  // Podział API na moduł według wybranego tagu i zapisanie do pliku JSON w folderze 'modules'
  const moduleFilePath = path.join(
    __dirname,
    `modules/${selectedTag}.openapi.json`
  );
  const tagModule = createTagModule(openapi, selectedTag);
  await fs.writeJson(moduleFilePath, tagModule, {
    spaces: 2,
  });

  // Tworzenie pliku konfiguracyjnego dla Orval
  const orvalConfigContent = `
import { defineConfig } from 'orval';

export const config: Parameters<typeof defineConfig>[number] = {
  ${selectedTag}: {
    output: {
      mode: 'tags-split',
      target: 'src/orval/api',
      schemas: 'src/orval/models',
      client: 'react-query',
      mock: true,
      prettier: true,
    },
    input: {
      target: 'orval/modules/${selectedTag}.openapi.json',
    },
  },
};
  `;

  const orvalConfigFilePath = path.join(
    __dirname,
    `modules/${selectedTag}.orval.config.ts`
  );

  if (!fs.pathExistsSync(orvalConfigFilePath)) {
    await fs.writeFile(orvalConfigFilePath, orvalConfigContent.trim());
    console.log(
      `Plik konfiguracyjny Orval został utworzony jako '${orvalConfigFilePath}'.`
    );
  } else {
    console.log(
      `Plik konfiguracyjny Orval już istnieje: '${orvalConfigFilePath}'.`
    );
  }

  console.log(
    `Moduł '${selectedTag}' został wygenerowany i zapisany w folderze 'modules'.`
  );

  console.log(
    `Plik konfiguracyjny Orval został utworzony jako '${orvalConfigFilePath}'.`
  );

  // Zmiana pliku ../orval.config.ts
  const mainOrvalConfigContent = `
import { defineConfig } from 'orval';

import { config } from './orval/modules/${selectedTag}.orval.config';

export default defineConfig(config);
  `;

  const mainOrvalConfigFilePath = path.join(__dirname, '../orval.config.ts');
  await fs.writeFile(mainOrvalConfigFilePath, mainOrvalConfigContent.trim());

  console.log(
    `Plik konfiguracyjny '../orval.config.ts' został zaktualizowany.`
  );
}

main().catch(error => {
  console.error('Wystąpił błąd:', error);
});
