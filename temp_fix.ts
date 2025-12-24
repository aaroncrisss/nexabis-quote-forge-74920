const userPrompt = `Analiza el siguiente requerimiento y genera una estimación técnica USANDO LOS RANGOS DE TIEMPO BASE del sistema.

TIPO DE PROYECTO: ${tipoProyecto}

DESCRIPCIÓN DEL REQUERIMIENTO:
${descripcion}

FUNCIONALIDADES SOLICITADAS:
${funcionalidades && funcionalidades.length > 0 ? funcionalidades.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'No especificadas'}

NIVEL DE URGENCIA: ${urgencia}

${horasMaximas ? `LÍMITE DE HORAS (PRESUPUESTO): ${horasMaximas} horas. Ajusta el alcance si es necesario.` : 'Sin límite de presupuesto especificado.'}

IMPORTANTE: Usa los RANGOS DE TIEMPO BASE definidos en las instrucciones del sistema para estimar cada módulo.Por ejemplo, si es "Autenticación básica", estima entre 6 - 8 horas.

Genera la estimación en formato JSON según la estructura requerida.`;