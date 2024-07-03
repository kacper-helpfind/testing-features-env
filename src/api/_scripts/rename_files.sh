#!/bin/bash

# Ścieżka do wygenerowanych plików API
API_DIR="./src/api/_generated/api"

# Iteracja po wszystkich plikach w katalogu
for file in "$API_DIR"/*-api.ts; do
  # Nowa nazwa pliku bez "-api" w nazwie
  new_file=$(echo "$file" | sed 's/-api//')
  # Zmiana nazwy pliku
  mv "$file" "$new_file"
done