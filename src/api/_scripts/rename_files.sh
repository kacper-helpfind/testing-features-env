#!/bin/bash

# Ścieżka do wygenerowanych plików API
API_DIR="./src/api/_generated/api"
API_TS_FILE="./src/api/_generated/api.ts"

# Zmienna, która będzie przechowywać nowe eksporty
new_exports=""

# Iteracja po wszystkich plikach w katalogu
for file in "$API_DIR"/*-api.ts; do
  # Nowa nazwa pliku bez "-api" w nazwie
  new_file=$(echo "$file" | sed 's/-api//')

  # Zmiana nazwy pliku
  mv "$file" "$new_file"

  # Dodanie nowego eksportu
  base_filename=$(basename "$new_file" .ts)
  new_exports+="export * from './api/$base_filename';"$'\n'
done

# Odczytanie istniejącej zawartości pliku api.ts
existing_exports=$(cat "$API_TS_FILE")

# Usunięcie starych eksportów z końcówką "-api"
cleaned_exports=$(echo "$existing_exports" | grep -v '\-api')

# Dodanie nowych eksportów do istniejącej zawartości, usuwając duplikaty
combined_exports=$(echo -e "$cleaned_exports\n$new_exports" | awk '!seen[$0]++')

# Zapisanie zaktualizowanych eksportów do pliku api.ts
echo -e "$combined_exports" > "$API_TS_FILE"