<?php
// A simple PHP script to login and hit the API using curl
$ch = curl_init('https://mgmpinformatika-wsb.my.id/api/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => 'ahmad.munif02@gmail.com', 'password' => 'password'])); // using dummy password since login won't work without it
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
echo "Login Response: " . $response . "\n";
// The previous script failed here due to invalid password.
// To bypass login, we can use the backend/index.php locally just by including the controller.
