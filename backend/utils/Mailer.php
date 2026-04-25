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

    public static function sendAdminNewMemberNotification($namaMember, $emailMember)
    {
        $adminEmail = 'admin@mgmpinformatika.com';
        $loginLink = "https://" . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'mgmpinformatika.com') . "/admin/users";
        $title = "Pendaftar Baru Menunggu Verifikasi";
        $body = "
            <h2 style='color: #1e293b; margin-top: 0;'>Ada Anggota Baru! 📋</h2>
            <p>Seorang guru baru telah mendaftar dan menunggu verifikasi akun:</p>
            <table style='width:100%; border-collapse:collapse; margin:16px 0; font-size:15px;'>
                <tr><td style='padding:8px; background:#f8fafc; font-weight:600; width:140px;'>Nama</td><td style='padding:8px; border-bottom:1px solid #e2e8f0;'>{$namaMember}</td></tr>
                <tr><td style='padding:8px; background:#f8fafc; font-weight:600;'>Email</td><td style='padding:8px;'>{$emailMember}</td></tr>
            </table>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$loginLink}' class='button'>Verifikasi Sekarang</a>
            </div>
            <p style='font-size:13px; color:#64748b;'>Akun akan tetap dalam status pending hingga admin melakukan verifikasi.</p>
        ";
        $html = self::getBaseTemplate($title, $body);
        return self::sendHtmlEmail($adminEmail, "Pendaftar Baru: {$namaMember} - MGMP Informatika", $html);
    }

    public static function sendMemberActivated($email, $nama)
    {
        $loginLink = "https://" . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'mgmpinformatika.com') . "/login";
        $title = "Akun Anda Telah Diaktifkan";
        $body = "
            <h2 style='color: #1e293b; margin-top: 0;'>Halo, <span class='highlight'>{$nama}</span>!</h2>
            <p>Kabar gembira! Akun Anda di MGMP Informatika telah <strong>berhasil diaktifkan</strong> oleh Administrator.</p>
            <p>Sekarang Anda dapat login dan mengakses berbagai materi, agenda kegiatan, dan fitur lainnya sebagai anggota komunitas.</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$loginLink}' class='button'>Login Sekarang</a>
            </div>
            <p>Salam hangat,<br><strong>Tim Admin MGMP Informatika</strong></p>
        ";
        $html = self::getBaseTemplate($title, $body);
        return self::sendHtmlEmail($email, "Akun Anda Telah Aktif - MGMP Informatika", $html);
    }

    public static function sendTrainingInvoice($email, $nama, $code, $price, $eventName)
    {
        $title = "Pendaftaran Berhasil - Menunggu Pembayaran";
        $body = "
            <h2 style='color: #1e293b; margin-top: 0;'>Halo, {$nama}!</h2>
            <p>Terima kasih telah mendaftar di acara <strong>{$eventName}</strong>. Pendaftaran Anda telah kami catat dengan rincian sebagai berikut:</p>
            
            <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0 0 5px 0; color: #64748b; font-size: 13px; text-transform: uppercase;'>Kode Registrasi</p>
                <p style='margin: 0 0 15px 0; font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: 1px;'>{$code}</p>
                
                <p style='margin: 0 0 5px 0; color: #64748b; font-size: 13px; text-transform: uppercase;'>Total Tagihan</p>
                <p style='margin: 0; font-size: 20px; font-weight: bold; color: #2563eb;'>Rp " . number_format($price, 0, ',', '.') . "</p>
            </div>
            
            <h3 style='color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;'>Instruksi Pembayaran</h3>
            <p>Silakan lakukan pembayaran melalui transfer bank ke rekening berikut:</p>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                <tr>
                    <td style='padding: 8px 0; font-weight: bold; width: 120px;'>Bank</td>
                    <td style='padding: 8px 0;'>Bank Syariah Indonesia (BSI)</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; font-weight: bold;'>No. Rekening</td>
                    <td style='padding: 8px 0; font-size: 18px; font-family: monospace;'>7123456789</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; font-weight: bold;'>Atas Nama</td>
                    <td style='padding: 8px 0;'>MGMP Informatika</td>
                </tr>
            </table>
            
            <div style='background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; color: #92400e; font-size: 14px;'>
                <strong>Penting:</strong> Setelah melakukan transfer, mohon konfirmasi melalui WhatsApp Admin dengan melampirkan bukti transfer dan menyebutkan kode registrasi Anda.
            </div>
            
            <p style='margin-top: 30px;'>Salam sukses,<br><strong>Panitia Pelaksana MGMP Informatika</strong></p>
        ";
        $html = self::getBaseTemplate($title, $body);
        return self::sendHtmlEmail($email, "Invoice Pendaftaran [{$code}] - {$eventName}", $html);
    }
}
?>
