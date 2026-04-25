<?php
$host = "127.0.0.1";
$db_name = "ouycwnsb_dev";
$username = "ouycwnsb_admin";
$password = "t_wn8LUzGHv88RA";
try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "--- CONTRIBUTOR APPLICATIONS ---\n";
    $stmt = $conn->query("SELECT * FROM contributor_applications");
    $apps = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($apps);

    echo "\n--- PROFILES ---\n";
    if (count($apps) > 0) {
        $userId = $apps[0]['user_id'];
        $stmt2 = $conn->prepare("SELECT * FROM profiles WHERE id = ?");
        $stmt2->execute([$userId]);
        print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));

        echo "\n--- USERS ---\n";
        $stmt3 = $conn->prepare("SELECT * FROM users WHERE id = ?");
        $stmt3->execute([$userId]);
        print_r($stmt3->fetchAll(PDO::FETCH_ASSOC));
    }
} catch (PDOException $e) {
    echo "Connection error: " . $e->getMessage();
}
?>