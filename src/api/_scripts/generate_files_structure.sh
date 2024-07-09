#!/bin/bash

capitalize() {
  echo "$1" | awk '{print toupper(substr($0, 1, 1)) tolower(substr($0, 2))}'
}

# Funkcja do wyszukiwania metod HTTP i odpowiadających im funkcji
find_function_name() {
  local file=$1
  local method=$2
  local tempfile=$(mktemp)

  # Znajdź linie zawierające metodę HTTP
  grep -n "method: '$method'," "$file" | cut -d: -f1 | while read -r line; do
    # Przechodzimy wstecz od linii z metodą HTTP do znalezienia nazwy funkcji
    awk "NR<=$line" "$file" | awk '{lines[NR]=$0} END {for (i=NR; i>0; i--) print lines[i]}' | grep -m 1 -E "^\s+\w+: async \(" | sed 's/^\s+\(\w\+\): async.*/\1/' >> $tempfile
  done

  # Trimowanie i zamiana tekstu w wyniku
  while read -r function_name; do
    trimmed_function_name=$(echo "$function_name" | xargs)
    replaced_function_name="${trimmed_function_name//: async (/}"
    echo "$replaced_function_name"
  done < $tempfile

  rm -f $tempfile
}

# Znajdź funkcje używające różnych metod HTTP
find_get_functions() {
  local file=$1
  local tempfile=$(mktemp)
  find_function_name "$file" 'GET' > "$tempfile"
  while IFS= read -r function_name; do
    queries+=("$function_name")
  done < "$tempfile"
  rm -f "$tempfile"
}

find_other_functions() {
  local file=$1
  local tempfile=$(mktemp)
  for method in 'POST' 'PUT' 'PATCH' 'DELETE'; do
    find_function_name "$file" "$method" >> "$tempfile"
  done
  while IFS= read -r function_name; do
    mutations+=("$function_name")
  done < "$tempfile"
  rm -f "$tempfile"
}

# Ścieżka do wygenerowanych plików API
API_DIR="./src/api/_generated/api"
BASE_DIR="./src/api"

# Upewnij się, że katalog docelowy istnieje
mkdir -p $BASE_DIR

# Iteracja po wszystkich plikach w katalogu
for file in "$API_DIR"/*.ts; do
  # Wyciągnięcie nazwy pliku bez rozszerzenia i sufiksu '.ts'
  filename=$(basename "$file" .ts)

  # Utworzenie struktury folderów na podstawie nazwy pliku
  IFS='-' read -ra ADDR <<< "$filename"
  dir_path="$BASE_DIR"
  for i in "${ADDR[@]}"; do
    dir_path="$dir_path/$i"
    if [ ! -d "$dir_path" ]; then
      mkdir "$dir_path"
      echo "Created directory: $dir_path"
    fi
  done

  # Sprawdzenie zawartości pliku dla operacji API
  hasGet=false
  hasMutation=false
  if grep -q "GET" "$file"; then
    hasGet=true
  fi
  if grep -qE "POST|PUT|PATCH|DELETE" "$file"; then
    hasMutation=true
  fi

  # Utworzenie plików queries.ts i mutations.ts z odpowiednimi importami, jeśli nie istnieją
  if $hasGet; then
    if [ ! -f "$dir_path/queries.ts" ]; then
      echo -e "import { useQuery } from '@tanstack/react-query';\nimport { ONE_MINUTE_MS } from '@/consts';" > "$dir_path/queries.ts"
      echo "Created file: $dir_path/queries.ts"
    fi
  fi
  if $hasMutation; then
    if [ ! -f "$dir_path/mutations.ts" ]; then
      echo -e "import { useMutation } from '@tanstack/react-query';\nimport { queryClient } from '@/lib/query';\nimport { showNotification } from '@mantine/notifications';" > "$dir_path/mutations.ts"
      echo "Created file: $dir_path/mutations.ts"
    fi
  fi

  # Utworzenie pliku index.ts, jeśli nie istnieje
  if [ ! -f "$dir_path/index.ts" ]; then
    if $hasMutation; then
      echo "export * from './mutations';" > "$dir_path/index.ts"
    fi
    if $hasGet; then
      echo "export * from './queries';" >> "$dir_path/index.ts"
    fi
    echo "Created file: $dir_path/index.ts"
  fi

  # Utworzenie plików helpers.ts i keyFactory.ts, jeśli nie istnieją
  if [ ! -f "$dir_path/helpers.ts" ]; then
    touch "$dir_path/helpers.ts"
    echo "Created file: $dir_path/helpers.ts"
  fi
  if [ ! -f "$dir_path/keyFactory.ts" ]; then
    queries=()
    mutations=()

    find_get_functions "$API_DIR"/"$filename".ts
    find_other_functions "$API_DIR"/"$filename".ts

    queries_js=$(printf ", '%s'" "${queries[@]}")
    queries_js="[${queries_js:2}]"
    mutations_js=$(printf ", '%s'" "${mutations[@]}")
    mutations_js="[${mutations_js:2}]"

    moduleName=$(capitalize "$filename")

    if $hasGet; then
      queryImport="import { generateQueryKeys } from '../_helpers/generateQueryKeys';\n"
      queryExport="export const ${filename}QueriesFactory = generateQueryKeys('${filename}', ${filename}Api, ${mutations_js});\n\n"
    else
      queryImport=""
      queryExport=""
    fi

    if $hasMutation; then
      mutationImport="import { generateMutationKeys } from '../_helpers/generateMutationKeys';\n"
      mutationExport="export const ${filename}MutationsFactory = generateMutationKeys(${filename}Api, ${queries_js});\n\n"
    else
      mutationImport=""
      mutationExport=""
    fi

    echo -e "import { ${moduleName}Api } from '../_generated';\n${mutationImport}${queryImport}\nconst ${filename}Api = new ${moduleName}Api();\n\n${queryExport}${mutationExport}" > "$dir_path/keyFactory.ts"
    echo "Created file: $dir_path/keyFactory.ts"
  fi
done
