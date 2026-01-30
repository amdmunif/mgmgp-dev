<?php
// backend/controllers/ResourceController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class ResourceController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    private function getAll($table)
    {
        $query = "SELECT * FROM " . $table . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    private function delete($table, $id)
    {
        $query = "DELETE FROM " . $table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            return json_encode(["message" => "Deleted successfully"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete"]);
    }

    // --- Games ---
    public function getGames()
    {
        return $this->getAll('games');
    }

    public function createGame($data)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO games (id, title, description, link_url, image_url, is_premium) VALUES (:id, :title, :description, :link_url, :image_url, :is_premium)";
        $stmt = $this->conn->prepare($query);

        $is_premium = isset($data['is_premium']) ? $data['is_premium'] : 1;

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':link_url', $data['link_url']);
        $stmt->bindParam(':image_url', $data['image_url']);
        $stmt->bindParam(':is_premium', $is_premium);

        if ($stmt->execute()) {
            return json_encode(["message" => "Game created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create game"]);
    }

    public function deleteGame($id)
    {
        return $this->delete('games', $id);
    }

    // --- Prompts ---
    public function getPrompts()
    {
        $data = json_decode($this->getAll('prompt_library'), true);
        // Decode JSON fields if needed
        foreach ($data as &$item) {
            if (isset($item['tags']))
                $item['tags'] = json_decode($item['tags']);
        }
        return json_encode($data);
    }

    public function createPrompt($data)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO prompt_library (id, title, prompt_content, description, example_result, example_type, tags, is_premium) VALUES (:id, :title, :prompt_content, :description, :example_result, :example_type, :tags, :is_premium)";
        $stmt = $this->conn->prepare($query);

        $tags = isset($data['tags']) ? json_encode($data['tags']) : '[]';
        $is_premium = isset($data['is_premium']) ? $data['is_premium'] : 1;

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':prompt_content', $data['prompt_content']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':example_result', $data['example_result']);
        $stmt->bindParam(':example_type', $data['example_type']);
        $stmt->bindParam(':tags', $tags);
        $stmt->bindParam(':is_premium', $is_premium);

        if ($stmt->execute()) {
            return json_encode(["message" => "Prompt created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create prompt"]);
    }

    public function deletePrompt($id)
    {
        return $this->delete('prompt_library', $id);
    }

    // --- References ---
    public function getReferences()
    {
        return $this->getAll('learning_references');
    }

    public function createReference($data)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO learning_references (id, title, type, link_url, description, is_premium) VALUES (:id, :title, :type, :link_url, :description, :is_premium)";
        $stmt = $this->conn->prepare($query);

        $is_premium = isset($data['is_premium']) ? $data['is_premium'] : 0;

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':type', $data['type']);
        $stmt->bindParam(':link_url', $data['link_url']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':is_premium', $is_premium);

        if ($stmt->execute()) {
            return json_encode(["message" => "Reference created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create reference"]);
    }

    public function deleteReference($id)
    {
        return $this->delete('learning_references', $id);
    }
}
?>