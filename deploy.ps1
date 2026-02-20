param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionName,
    
    [Parameter(Mandatory=$true)]
    [string]$ContainerId,

    [Parameter(Mandatory=$false)]
    [string]$VpsIp = $env:NEXABIS_VPS_IP
)

if (-not $VpsIp) {
    Write-Host "❌ VPS IP no configurada. Setea la variable de entorno NEXABIS_VPS_IP o pasa -VpsIp" -ForegroundColor Red
    exit 1
}

Write-Host "Paso 1: Subiendo $FunctionName y las dependencias compartidas al VPS..." -ForegroundColor Yellow
scp -r ./supabase/functions/$FunctionName root@${VpsIp}:/tmp/
# scp -r ./supabase/functions/_shared root@${VpsIp}:/tmp/ # Commented out as _shared might not exist yet, preventing error

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Subida exitosa" -ForegroundColor Green
    Write-Host "Paso 2: Actualizando el contenedor en el VPS..." -ForegroundColor Yellow
    ssh root@$VpsIp "chmod +x /root/update-function.sh && /root/update-function.sh $FunctionName $ContainerId"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 ¡Despliegue completo!" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Falló la subida" -ForegroundColor Red
}
