#!/bin/bash
FUNCTION_NAME=$1
CONTAINER_ID=$2

if [ -z "$FUNCTION_NAME" ] || [ -z "$CONTAINER_ID" ]; then
    echo "Usage: ./update-function.sh <function-name> <container-id>"
    echo "Example: ./update-function.sh analyze-email nameOfYourDockerContainerHere"
    exit 1
fi

echo "Copiando $FUNCTION_NAME al contenedor..."
docker cp /tmp/$FUNCTION_NAME supabase-edge-functions-$CONTAINER_ID:/home/deno/functions/

if [ $? -eq 0 ]; then
    echo "✅ Se copió correctamente $FUNCTION_NAME al contenedor"
    
    # FIX: Ensure permissions AND ownership are correct (Use numeric IDs and 777)
    echo "Ajustando permisos y dueño (fuerza bruta)..."
    docker exec --user root supabase-edge-functions-$CONTAINER_ID chown -R 1000:1000 /home/deno/functions/$FUNCTION_NAME
    docker exec --user root supabase-edge-functions-$CONTAINER_ID chmod -R 777 /home/deno/functions/$FUNCTION_NAME
    
    echo "Reiniciando el contenedor..."
    docker restart supabase-edge-functions-$CONTAINER_ID
    
    if [ $? -eq 0 ]; then
        echo "✅ Contenedor reiniciado con éxito"
        echo "🎉 ¡Despliegue completo!"
    else
        echo "❌ Falló al reiniciar el contenedor"
        exit 1
    fi
else
    echo "❌ Falló al copiar los archivos al contenedor"
    exit 1
fi
