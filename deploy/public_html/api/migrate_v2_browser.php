<?php
// backend/migrate_v2_browser.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

require_once __DIR__ . '/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    if (!$conn)
        die("DB Connection Failed.");

    echo "Starting Migration V2 (Tables & Settings)...\n\n";

    // 1. Create site_content if not exists
    echo "1. Checking table `site_content`...\n";
    $sqlContent = "CREATE TABLE IF NOT EXISTS `site_content` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `home_hero_title` varchar(255) DEFAULT NULL,
      `home_hero_subtitle` text DEFAULT NULL,
      `home_hero_image` text DEFAULT NULL,
      `app_logo` text DEFAULT NULL,
      `profile_visi` text DEFAULT NULL,
      `profile_misi` text DEFAULT NULL,
      `profile_sejarah` text DEFAULT NULL,
      `profile_struktur` text DEFAULT NULL,
      `contact_address` text DEFAULT NULL,
      `contact_phone` varchar(50) DEFAULT NULL,
      `contact_email` varchar(255) DEFAULT NULL,
      `contact_map_url` text DEFAULT NULL,
      `kop_surat` text DEFAULT NULL,
      `ketua_nama` varchar(255) DEFAULT NULL,
      `ketua_nip` varchar(100) DEFAULT NULL,
      `ketua_signature_url` text DEFAULT NULL,
      `sekretaris_nama` varchar(255) DEFAULT NULL,
      `sekretaris_nip` varchar(100) DEFAULT NULL,
      `sekretaris_signature_url` text DEFAULT NULL,
      `mkks_nama` varchar(255) DEFAULT NULL,
      `mkks_nip` varchar(100) DEFAULT NULL,
      `mkks_signature_url` text DEFAULT NULL,
      `premium_rules` text DEFAULT NULL,
      `bank_name` text DEFAULT NULL,
      `bank_number` text DEFAULT NULL,
      `bank_holder` text DEFAULT NULL,
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    $conn->exec($sqlContent);
    echo "   -> Table `site_content` ensured.\n";

    // 2. Create premium_settings if not exists
    echo "2. Checking table `premium_settings`...\n";
    $sqlPremium = "CREATE TABLE IF NOT EXISTS `premium_settings` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `registration_fee` decimal(10,2) DEFAULT 0.00,
      `active_period_months` int(11) DEFAULT 12,
      `premium_features` longtext DEFAULT NULL,
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    $conn->exec($sqlPremium);
    echo "   -> Table `premium_settings` ensured.\n";

    // 3. Create premium_bank_accounts if not exists
    echo "3. Checking table `premium_bank_accounts`...\n";
    $sqlBank = "CREATE TABLE IF NOT EXISTS `premium_bank_accounts` (
      `id` char(36) NOT NULL,
      `bank_name` varchar(255) NOT NULL,
      `account_number` varchar(255) NOT NULL,
      `account_holder` varchar(255) NOT NULL,
      `is_active` tinyint(1) DEFAULT 1,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    $conn->exec($sqlBank);
    echo "   -> Table `premium_bank_accounts` ensured.\n";

    // 4. Migrate Data from app_settings (if exists)
    echo "4. Migrating data from legacy `app_settings`...\n";

    // Check if app_settings exists
    $checkApp = "SELECT count(*) FROM information_schema.TABLES WHERE (TABLE_SCHEMA = DATABASE()) AND (TABLE_NAME = 'app_settings')";
    $stmtCheck = $conn->prepare($checkApp);
    $stmtCheck->execute();
    $tableExists = $stmtCheck->fetchColumn();

    if ($tableExists) {
        $stmtOld = $conn->query("SELECT * FROM app_settings LIMIT 1");
        $oldData = $stmtOld->fetch(PDO::FETCH_ASSOC);

        if ($oldData) {
            echo "   -> Legacy data found. Copying to new tables...\n";

            // Map legacy fields to new fields
            // app_settings fields: site_title, logo_url, email, phone, address, site_description, bank_name, etc.

            $siteTitle = $oldData['site_title'] ?? 'MGMP Informatika';
            $siteDesc = $oldData['site_description'] ?? '';
            $appLogo = $oldData['logo_url'] ?? '';
            $contactEmail = $oldData['email'] ?? '';
            $contactPhone = $oldData['phone'] ?? '';
            $contactAddress = $oldData['address'] ?? ''; // address in app_settings was contact address?
            $bankName = $oldData['bank_name'] ?? '';
            $bankNumber = $oldData['bank_number'] ?? '';
            $bankHolder = $oldData['bank_holder'] ?? '';
            $premiumPrice = $oldData['premium_price'] ?? 0;

            // Upsert into site_content
            // using ON DUPLICATE KEY UPDATE to avoid errors if id=1 exists
            $upsertContent = "INSERT INTO site_content (id, home_hero_title, home_hero_subtitle, app_logo, contact_email, contact_phone, contact_address, bank_name, bank_number, bank_holder)
            VALUES (1, :title, :desc, :logo, :email, :phone, :address, :b_name, :b_num, :b_hold)
            ON DUPLICATE KEY UPDATE
               home_hero_title = VALUES(home_hero_title),
               home_hero_subtitle = VALUES(home_hero_subtitle),
               app_logo = VALUES(app_logo),
               contact_email = VALUES(contact_email),
               contact_phone = VALUES(contact_phone),
               contact_address = VALUES(contact_address),
               bank_name = VALUES(bank_name),
               bank_number = VALUES(bank_number),
               bank_holder = VALUES(bank_holder)";

            $stmtUp = $conn->prepare($upsertContent);
            $stmtUp->bindValue(':title', $siteTitle);
            $stmtUp->bindValue(':desc', $siteDesc);
            $stmtUp->bindValue(':logo', $appLogo);
            $stmtUp->bindValue(':email', $contactEmail);
            $stmtUp->bindValue(':phone', $contactPhone);
            $stmtUp->bindValue(':address', $contactAddress);
            $stmtUp->bindValue(':b_name', $bankName);
            $stmtUp->bindValue(':b_num', $bankNumber);
            $stmtUp->bindValue(':b_hold', $bankHolder);
            $stmtUp->execute();
            echo "   -> Copied site settings to `site_content`.\n";

            // Upsert into premium_settings
            $upsertPrem = "INSERT INTO premium_settings (id, registration_fee) VALUES (1, :fee)
            ON DUPLICATE KEY UPDATE registration_fee = VALUES(registration_fee)";
            $stmtPrem = $conn->prepare($upsertPrem);
            $stmtPrem->bindValue(':fee', $premiumPrice);
            $stmtPrem->execute();
            echo "   -> Copied premium price to `premium_settings`.\n";

        } else {
            echo "   -> `app_settings` table exists but is empty.\n";
        }
    } else {
        echo "   -> Table `app_settings` NOT found. Skipping data migration.\n";

        // Ensure defaults if tables are empty
        $conn->exec("INSERT INTO site_content (id, home_hero_title) SELECT 1, 'MGMP Informatika' WHERE NOT EXISTS (SELECT 1 FROM site_content)");
        $conn->exec("INSERT INTO premium_settings (id, registration_fee) SELECT 1, 50000 WHERE NOT EXISTS (SELECT 1 FROM premium_settings)");
    }

    echo "\nAll Done! Settings page should now work.\n";

} catch (Exception $e) {
    http_response_code(500);
    echo "ERROR: " . $e->getMessage();
}
?>