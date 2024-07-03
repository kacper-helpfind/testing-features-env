#!/bin/bash

# # Sprawdź, czy podano argumenty
# if [ -z "$1" ]; then
#   echo "Error: Username is required"
#   exit 1
# fi

# if [ -z "$2" ]; then
#   echo "Error: Password is required"
#   exit 1
# fi

# # Przypisanie argumentów do zmiennych
# USERNAME=$1
# PASSWORD=$2

# Komenda do generowania API - dodac na koncu "--auth $USERNAME:$PASSWORD" w przypadku api z hasłem
openapi-generator-cli generate -i https://petstore3.swagger.io/api/v3/openapi.json -g typescript-axios -o ./src/api/_generated -c ./src/api/_scripts/generator-config.json

# Sprawdź, czy komenda zakończyła się sukcesem
if [ $? -ne 0 ]; then
  echo "Error: API generation failed"
  exit 1
fi

# Usuwanie niepotrzebnych plików

./src/api/_scripts/delete_additional_files.sh

# Zmiana nazw plików api
./src/api/_scripts/rename_files.sh

# Generowanie struktury folderów
./src/api/_scripts/generate_structure.sh

# Generowanie plików dla React Query
./src/api/_scripts/generate_files_structure.sh

# Uruchamianie Prettier
yarn prettier:write