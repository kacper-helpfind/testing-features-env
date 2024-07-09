import fs from 'fs-extra';
import inquirer from 'inquirer';

// Wczytanie pliku JSON
async function readOpenAPISpec(path) {
  return await fs.readJson(path);
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
  tagModule.tags = openapi.tags.filter(t => t.name === tag);

  // Znalezienie wszystkich wymaganych komponentów (schemas, requestBodies, responses, parameters, securitySchemes)
  const requiredComponents = new Set();
  for (const methods of Object.values(tagModule.paths)) {
    for (const method of Object.values(methods)) {
      if (method.requestBody) {
        for (const mediaType of Object.values(method.requestBody.content)) {
          getRefsFromSchema(mediaType.schema).forEach(ref =>
            requiredComponents.add(ref)
          );
        }
      }
      if (method.responses) {
        for (const response of Object.values(method.responses)) {
          if (response.content) {
            for (const mediaType of Object.values(response.content)) {
              getRefsFromSchema(mediaType.schema).forEach(ref =>
                requiredComponents.add(ref)
              );
            }
          }
        }
      }
      if (method.parameters) {
        for (const parameter of method.parameters) {
          if (parameter.schema) {
            getRefsFromSchema(parameter.schema).forEach(ref =>
              requiredComponents.add(ref)
            );
          }
        }
      }
    }
  }

  // Filtrowanie komponentów
  tagModule.components = filterComponents(
    openapi.components,
    requiredComponents
  );

  return tagModule;
}

function getRefsFromSchema(schema) {
  const refs = new Set();
  if (schema.$ref) {
    refs.add(schema.$ref.split('/').pop());
  }
  if (schema.items) {
    getRefsFromSchema(schema.items).forEach(ref => refs.add(ref));
  }
  if (schema.properties) {
    for (const propSchema of Object.values(schema.properties)) {
      getRefsFromSchema(propSchema).forEach(ref => refs.add(ref));
    }
  }
  return refs;
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
  const openapi = await readOpenAPISpec('orval/openapi.json');

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
  fs.ensureDirSync('orval/modules');

  // Podział API na moduł według wybranego tagu i zapisanie do pliku JSON w folderze 'modules'
  const moduleFilePath = `orval/modules/${selectedTag}.openapi.json`;
  const tagModule = createTagModule(openapi, selectedTag);
  await fs.writeJson(moduleFilePath, tagModule, {
    spaces: 2,
  });

  // Tworzenie pliku konfiguracyjnego dla Orval
  const orvalConfigContent = `
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
      target: './${moduleFilePath}',
    },
  },
});
  `;

  const orvalConfigFilePath = `${selectedTag}.orval.config.ts`;
  await fs.writeFile(
    `orval/modules/${orvalConfigFilePath}`,
    orvalConfigContent.trim()
  );

  console.log(
    `Moduł '${selectedTag}' został wygenerowany i zapisany w folderze 'orval/modules'.`
  );
  console.log(
    `Plik konfiguracyjny Orval został utworzony jako 'orval/modules/${orvalConfigFilePath}'.`
  );
}

main().catch(error => {
  console.error('Wystąpił błąd:', error);
});
