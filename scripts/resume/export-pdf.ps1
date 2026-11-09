# Saves a .docx as PDF through Microsoft Word, which embeds the installed Inter font.
# Prints "pages: N" for scripts/resume/word.ts to check.
param([Parameter(Mandatory)][string]$In, [Parameter(Mandatory)][string]$Out)
$ErrorActionPreference = 'Stop'
# Word resolves relative paths against its own working directory and rejects forward slashes.
$In = [System.IO.Path]::GetFullPath($In)
$Out = [System.IO.Path]::GetFullPath($Out)
$WD_FORMAT_PDF = 17
$WD_STATISTIC_PAGES = 2
$WD_ALERTS_NONE = 0
$word = New-Object -ComObject Word.Application
try {
  $word.Visible = $false
  # A dialog in a hidden Word would wait forever for a click.
  $word.DisplayAlerts = $WD_ALERTS_NONE
  $doc = $word.Documents.Open($In, $false, $true)
  try {
    $doc.SaveAs([ref]$Out, [ref]$WD_FORMAT_PDF)
    "pages: " + $doc.ComputeStatistics($WD_STATISTIC_PAGES)
  } finally {
    $doc.Close($false)
  }
} finally {
  $word.Quit()
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
}
