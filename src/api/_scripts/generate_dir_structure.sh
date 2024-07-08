#!/bin/bash

# Ścieżka do wygenerowanych plików API
API_DIR="./src/api/_generated/api"
BASE_DIR="./src/api"

# Upewnij się, że katalog docelowy istnieje
mkdir -p $BASE_DIR

# Iteracja po wszystkich plikach w katalogu
for file in "$API_DIR"/*.ts; do
  # Wyciągnięcie nazwy pliku bez rozszerzenia i sufiksu '-api.ts'
  filename=$(basename "$file" | sed 's/.ts//')

  # Utworzenie struktury folderów na podstawie nazwy pliku
  IFS='-' read -ra ADDR <<< "$filename"
  dir_path="$BASE_DIR"
  for i in "${ADDR[@]}"; do
    dir_path="$dir_path/$i"
    if [ ! -d "$dir_path" ]; then
      mkdir "$dir_path"
    #   echo "Created directory: $dir_path"
    fi
  done
done