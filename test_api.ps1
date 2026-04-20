$apiKey = "AIzaSyDrraYlEWWKvv2XEdVhC4wUKkrnkYO9sDg"
$authUrl = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey"
$authBody = "{`"returnSecureToken`":true}"
$authResponse = Invoke-RestMethod -Uri $authUrl -Method Post -Body $authBody -ContentType "application/json"
$idToken = $authResponse.idToken

$trialUrl = "http://localhost:3000/api/trial-topic-refresh"
$trialBody = "{`"previousTopics`":[`"React`", `"Vite`"]}"
$headers = @{ "Authorization" = "Bearer $idToken" }

try {
    $resp = Invoke-RestMethod -Uri $trialUrl -Method Post -Headers $headers -Body $trialBody -ContentType "application/json"
    [PSCustomObject]@{ Status = "Success"; Data = $resp } | ConvertTo-Json
} catch {
    [PSCustomObject]@{ Status = "Error"; Exception = $_.Exception.ToString() } | ConvertTo-Json
}
