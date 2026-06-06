# Assicurati di essere nella directory radice del tuo progetto e di avere PowerShell come Amministratore.
Write-Host "Current location:"
Get-Location
Write-Host "`n--- Aggiornamento del file della Solution (.sln) ---"

# --- 1. Trova e Rinomina il file .sln ---
$oldSolutionName = "Forma.sln" # Assicurati che questo sia il nome corretto del tuo file solution
$newSolutionName = "Forma.Resource.sln"
$solutionFile = Get-ChildItem -Path "." -Filter $oldSolutionName

if ($solutionFile) {
    Write-Host "Rinomina '$oldSolutionName' in '$newSolutionName'..."
    Rename-Item -Path $solutionFile.FullName -NewName $newSolutionName -Force
    Write-Host "File solution rinominato con successo."
    $renamedSolutionPath = Join-Path $solutionFile.Directory.FullName $newSolutionName
} else {
    Write-Host "ATTENZIONE: Il file solution '$oldSolutionName' non è stato trovato nella directory corrente." -ForegroundColor Yellow
    Write-Host "Controlla il nome del file o la tua posizione attuale." -ForegroundColor Yellow
    # Se non trova il file originale, cerchiamo il nuovo nome nel caso fosse già stato rinominato manualmente
    $renamedSolutionPath = Get-ChildItem -Path "." -Filter "$newSolutionName" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
    if (-not $renamedSolutionPath) {
        Write-Host "ATTENZIONE: Anche '$newSolutionName' non è stato trovato. Impossibile procedere con l'aggiornamento dei riferimenti." -ForegroundColor Red
        return # Termina lo script
    }
}


# --- 2. Aggiorna i Riferimenti Interni nel file .sln rinominato ---
if ($renamedSolutionPath) {
    Write-Host "`nAggiornamento dei riferimenti interni in '$newSolutionName'..."

    $content = Get-Content -Path $renamedSolutionPath -Raw
    $newContent = $content

    # Sostituisci i nomi dei progetti e i percorsi nei riferimenti
    # Esempio di riga in .sln: Project("{...}") = "Forma.Application", "src\Forma.Application\Forma.Application.csproj", "{...}"
    # Dobbiamo sostituire sia il nome mostrato che il percorso
    
    # Questo ciclo si occupa di tutti i progetti che iniziano con "Forma."
    # Assicurati che i nomi qui corrispondano esattamente ai nomi originali dei progetti prima della rinomina
    $projectNames = @(
        "Forma.Application",
        "Forma.CoreInfrastructure",
        "Forma.Query",
        "Forma.PublicApi",
        "Forma.Infrastructure",
        "Forma.Domain",
        "Forma.CoreContext"
        # Aggiungi qui altri nomi di progetti se ne hai rinominati altri che non sono nella lista
    )

    foreach ($oldProjectName in $projectNames) {
        $newProjectName = $oldProjectName -replace "Forma.", "Forma.Resource."

        # Sostituisce il nome del progetto nella riga del Project() = "NomeProgetto"
        $newContent = $newContent -replace "`"($oldProjectName)`"", "`"$($newProjectName)`""

        # Sostituisce il percorso del file .csproj
        # Attenzione ai backslash nei percorsi di Windows, raddoppiali per la regex
        $oldPathPattern = [regex]::Escape("src\$oldProjectName\$oldProjectName.csproj")
        $newPathReplacement = "src\$newProjectName\$newProjectName.csproj"
        $newContent = $newContent -replace $oldPathPattern, $newPathReplacement
    }
    
    # Se il nome della soluzione stessa era referenziato in qualche modo strano, o in una PropertyGroup interna
    $newContent = $newContent -replace "Forma.sln", "Forma.Resource.sln"


    if ($content -ne $newContent) {
        Set-Content -Path $renamedSolutionPath -Value $newContent -Force
        Write-Host "File solution '$newSolutionName' aggiornato con successo." -ForegroundColor Green
    } else {
        Write-Host "Nessuna modifica necessaria all'interno di '$newSolutionName'." -ForegroundColor DarkGray
    }
} else {
    Write-Host "Impossibile trovare il percorso del file solution per aggiornare i riferimenti interni." -ForegroundColor Red
}

Write-Host "`nAggiornamento del file .sln completato. Riapri Visual Studio e carica il nuovo file Forma.Resource.sln."