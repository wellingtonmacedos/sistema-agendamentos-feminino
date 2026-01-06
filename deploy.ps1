# Script de Deploy Automatizado
# Configurações
$ServerIP = "95.217.239.143"
$Port = "22"
$User = "root"
# ATENÇÃO: Ajuste o caminho remoto conforme sua configuração no servidor
$RemotePath = "/root/sistema-agendamentos" 

Write-Host "=== Iniciando Deploy para $ServerIP ===" -ForegroundColor Cyan

# 1. Build do Frontend
Write-Host "`n[1/3] Gerando Build do Frontend..." -ForegroundColor Yellow
Set-Location "frontend"
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha no build do frontend!"
    exit 1
}
Set-Location ".."

# 2. Upload
Write-Host "`n[2/3] Iniciando Upload via SCP..." -ForegroundColor Yellow
Write-Host "Destino: $RemotePath"
Write-Host "Se solicitado, digite a senha do servidor." -ForegroundColor Magenta

# Criar diretório remoto se não existir (tentativa)
Write-Host "Criando diretório remoto (se não existir)..."
ssh -p $Port ${User}@${ServerIP} "mkdir -p $RemotePath"

# Lista de arquivos/pastas para enviar
# Enviamos src, package.json e o build do frontend
$items = @("src", "package.json", "frontend/dist")

foreach ($item in $items) {
    Write-Host "Enviando: $item"
    # Usar scp com flag -r para recursivo e -P para porta
    scp -P $Port -r $item "${User}@${ServerIP}:${RemotePath}/${item}"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Falha ao enviar $item. Verifique a conexão e permissões."
    }
}

# 3. Pós-Deploy
Write-Host "`n[3/3] Tarefas Pós-Deploy..." -ForegroundColor Yellow
Write-Host "Tentando instalar dependências e reiniciar servidor..."

# Comando para instalar deps e reiniciar (assumindo PM2 ou node direto)
$RemoteCommands = "cd $RemotePath && npm install --production && (pm2 restart all || echo 'PM2 não encontrado, reinicie manualmente')"

ssh -p $Port ${User}@${ServerIP} $RemoteCommands

Write-Host "`nDeploy finalizado!" -ForegroundColor Green
