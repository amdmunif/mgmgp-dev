<?php
// backend/utils/Mailer.php

class Mailer
{
    private static function sendHtmlEmail($to, $subject, $htmlContent)
    {
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: MGMP Informatika <noreply@" . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'mgmpinformatika.com') . ">" . "\r\n";

        return mail($to, $subject, $htmlContent, $headers);
    }

    private static function getBaseTemplate($title, $bodyContent)
    {
        // Beautiful responsive template
        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a, #312e81); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; font-size: 16px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; text-align: center; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .highlight { font-weight: 600; color: #1e293b; }
        .alert { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 4px; color: #92400e; font-size: 15px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>MGMP Informatika</h1>
        </div>
        <div class='content'>
            {$bodyContent}
        </div>
        <div class='footer'>
            &copy; " . date('Y') . " MGMP Informatika. Semua hak dilindungi.<br>
            Email otomatis, mohon tidak membalas ke alamat ini.
        </div>
    </div>
</body>
</html>";
    }

    public static function sendResetPassword($email, $token)
    {
        $resetLink = "https://" . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'mgmpinformatika.com') . "/reset-password?token=" . $token . "&email=" . urlencode($email);
        $title = "Reset Password";
        $body = "
            <h2 style='color: #1e293b; margin-top: 0;'>Halo,</h2>
            <p>Kami menerima permintaan untuk mereset password akun MGMP Informatika Anda.</p>
            <p>Silakan klik tombol di bawah ini untuk mengatur ulang password Anda:</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$resetLink}' class='button'>Reset Password Sekarang</a>
            </div>
            <p>Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut di browser Anda:</p>
            <p style='font-size: 14px; word-break: break-all; color: #2563eb;'>{$resetLink}</p>
            <p style='margin-top: 30px; font-size: 14px; color: #64748b;'>Jika Anda tidak meminta reset password, abaikan email ini. Tautan ini akan kedaluwarsa dalam 1 jam.</p>
        ";
        $html = self::getBaseTemplate($title, $body);
        return self::sendHtmlEmail($email, "Permintaan Reset Password - MGMP Informatika", $html);
    }

    public static function sendRegistrationSuccess($email, $nama)
    {
        $title = "Pendaftaran Berhasil";
        $body = "
            <h2 style='color: #1e293b; margin-top: 0;'>Selamat Datang, <span class='highlight'>{$nama}</span>!</h2>
            <p>Terima kasih telah mendaftar di Komunitas MGMP Informatika.</p>
            <div class='alert'>
                <strong>Informasi Penting:</strong> Akun Anda saat ini sedang dalam status menunggu verifikasi dari Administrator. Anda akan menerima email pemberitahuan ketika akun sudah aktif.
            </div>
            <p>Sementara menunggu, Anda dapat mencari tahu lebih banyak tentang program dan kegiatan kami melalui website utama kami.</p>
            <p>Salam hangat,<br><strong>Tim Admin MGMP Informatika</strong></p>
        ";
        $html = self::getBaseTemplate($title, $body);
        return self::sendHtmlEmail($email, "Pendaftaran Berhasil & Menunggu Verifikasi", $html);
    }

    public static function sendMemberVerified($email, $nama)
    {
        $loginLink = "https://" . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'mgmpinformatika.com') . "/login";
        $title = "Akun Terverifikasi";
        $body = "
            <h2 style='color: #1e293b; margin-top: 0;'>Halo, <span class='highlight'>{$nama}</span>!</h2>
            <p>Kabar gembira! Akun Anda telah berhasil diverifikasi oleh Administrator MGMP Informatika.</p>
            <p>Sekarang Anda sudah memiliki akses penuh sebagai anggota komunitas. Temukan berbagai modul pembelajaran, agenda kegiatan, serta forum diskusi yang bermanfaat.</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$loginLink}' class='button'>Masuk ke Area Anggota</a>
            </div>
            <p>Salam hangat,<br><strong>Tim Admin MGMP Informatika</strong></p>
        ";
        $html = self::getBaseTemplate($title, $body);
        return self::sendHtmlEmail($email, "Selamat! Akun Anda Telah Aktif - MGMP Informatika", $html);
    }

    public static function sendPremiumUpgradeRequest($email, $nama)
    {
        $title = "Permintaan Upgrade Premium";
        $body = "
            <h2 style='color: #1e293b; margin-top: 0;'>Halo, <span class='highlight'>{$nama}</span>!</h2>
            <p>Kami telah menerima permohonan Anda untuk melakukan upgrade akun menjadi <strong>Member Premium</strong>.</p>
            <div class='alert'>
                Tim kami akan segera memverifikasi bukti pembayaran yang telah Anda unggah. Proses ini biasanya membutuhkan waktu 1-2 hari kerja.
            </div>
            <p>Kami akan mengirimkan email pemberitahuan setelah akun Anda berhasil di-upgrade.</p>
            <p>Terima kasih atas partisipasi aktif Anda dalam mendukung MGMP Informatika!</p>
            <p>Salam hangat,<br><strong>Tim Admin MGMP Informatika</strong></p>
        ";
        $html = self::getBaseTemplate($title, $body);
        return self::sendHtmlEmail($email, "Pengajuan Member Premium Diterima", $html);
    }

    public static function sendPremiumVerified($email, $nama, $expiryDate)
    {
        $memberLink = "https://" . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'mgmpinformatika.com') . "/member";
        // Format Tgl
        $formattedDate = date('d F Y', strtotime($expiryDate));

        $title = "Selamat Datang di Premium";
        $body = "
            <h2 style='color: #1e293b; margin-top: 0;'>Selamat Datang di Premium, <span class='highlight'>{$nama}</span>! 🎉</h2>
            <p>Terima kasih. Permohonan upgrade akun Anda telah berhasil diverifikasi. Anda sekarang resmi menjadi <strong>Member Premium</strong> MGMP Informatika!</p>
            <p>Masa aktif keanggotaan premium Anda berlaku hingga: <br><strong style='color: #2563eb; font-size: 18px;'>{$formattedDate}</strong></p>
            <p>Nikmati seluruh fitur eksklusif seperti akses penuh ke sistem Bank Soal, Pembuat Game Edukasi, Library Prompt AI, dan masih banyak lagi.</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$memberLink}' class='button'>Mulai Eksplorasi Fitur Premium</a>
            </div>
            <p>Salam berkarya,<br><strong>Tim Admin MGMP Informatika</strong></p>
        ";
        $html = self::getBaseTemplate($title, $body);
        return self::sendHtmlEmail($email, "Selamat! Akun Premium Anda Sudah Aktif", $html);
    }
}
?>