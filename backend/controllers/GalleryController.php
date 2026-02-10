<?php
// backend/controllers/GalleryController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class GalleryController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getImages()
    {
        $query = "SELECT * FROM gallery_images ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function createImage($data)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO gallery_images (id, image_url, caption, event_id, created_at) VALUES (:id, :image_url, :caption, :event_id, NOW())";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':image_url', $data['image_url']);
        $stmt->bindParam(':caption', $data['caption']);
        $stmt->bindParam(':event_id', $data['event_id']);

        if ($stmt->execute()) {
            return json_encode(["message" => "Image added to gallery", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to add image"]);
    }

    public function deleteImage($id)
    {
        $query = "DELETE FROM gallery_images WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            return json_encode(["message" => "Image deleted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete image"]);
    }
}
