<?php
class DBTest {
    private $host = "localhost";
    private $db_name = "ouycwnsb_dev";
    private $username = "ouycwnsb_admin";
    private $password = "t_wn8LUzGHv88RA";
    public $conn;
    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4", $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
$db = (new DBTest())->getConnection();
if ($db) {
  $query = "SELECT id, nama, asal_sekolah FROM members WHERE is_school_standardized = 0;";
  $stmt = $db->prepare($query);
  $stmt->execute();
  $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($result, JSON_PRETTY_PRINT);
} else {
  echo "Failed to connect to DB.";
}
?>
