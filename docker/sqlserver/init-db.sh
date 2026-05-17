#!/bin/sh
set -e

if [ -x /opt/mssql-tools18/bin/sqlcmd ]; then
    SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
else
    SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

echo "Aguardando o SQL Server aceitar conexoes..."

until "$SQLCMD" -S sqlserver,1433 -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; do
    sleep 2
done

echo "Criando banco e tabelas, se necessario..."

"$SQLCMD" -S sqlserver,1433 -U sa -P "$SA_PASSWORD" -C -i /scripts/init.sql

echo "Inicializacao do SQL Server concluida."
