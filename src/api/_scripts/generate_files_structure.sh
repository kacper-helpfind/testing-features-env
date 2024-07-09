#!/bin/bash

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
    echo "import { createQueryKeys } from '@lukemorales/query-key-factory';" > "$dir_path/keyFactory.ts"
    echo "Created file: $dir_path/keyFactory.ts"
  fi
done
