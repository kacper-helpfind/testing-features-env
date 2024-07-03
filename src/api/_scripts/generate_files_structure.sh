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

  # Utworzenie plików index.ts, queries.ts, mutations.ts
  if $hasGet; then
    touch "$dir_path/index.ts"
    touch "$dir_path/queries.ts"
    echo "Created files: $dir_path/index.ts, $dir_path/queries.ts"
  fi
  if $hasMutation; then
    touch "$dir_path/mutations.ts"
    echo "Created file: $dir_path/mutations.ts"
  fi
done