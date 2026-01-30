<?php
// backend/utils/Helper.php

class Helper
{
    public static function uuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }

    // Simple JWT implementation (HS256)
    public static function generateJWT($payload, $secret = 'YOUR_SECRET_KEY')
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function verifyJWT($token, $secret = 'YOUR_SECRET_KEY')
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3)
            return false;

        $header = $parts[0];
        $payload = $parts[1];
        $signature_provided = $parts[2];

        $signature_check = hash_hmac('sha256', $header . "." . $payload, $secret, true);
        $base64UrlSignatureCheck = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature_check));

        if ($base64UrlSignatureCheck === $signature_provided) {
            return json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
        }
        return false;
    }
}
?>