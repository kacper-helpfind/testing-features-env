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

# Komenda do generowania API - dodac "--auth $USERNAME:$PASSWORD" w przypadku api z hasłem
openapi-generator-cli generate -i https://petstore3.swagger.io/api/v3/openapi.json -g typescript-axios -o ./src/api/generated -c ./src/api/generator-config.json

# Sprawdź, czy komenda zakończyła się sukcesem
if [ $? -ne 0 ]; then
  echo "Error: API generation failed"
  exit 1
fi

# Usuwanie niepotrzebnych plików
rm -R ./src/api/generated/.openapi-generator
rm -f ./src/api/generated/.gitignore
rm -f ./src/api/generated/.npmignore
rm -f ./src/api/generated/git_push.sh
rm -f ./src/api/generated/.openapi-generator-ignore
rm -f ./src/api/generated/git_push.sh
rm -f .openapitools.json

# Uruchamianie Prettier
yarn prettier:write