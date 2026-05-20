$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('f:\KLTN 2026\101\KLTN_2026.docx')
$content = $doc.Content.Text
$doc.Close($false)
$word.Quit()
$content | Out-File -FilePath 'f:\KLTN 2026\101\KLTN_2026_text.txt' -Encoding UTF8
