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

    public function createGame($data, $userId = null, $userName = 'System')
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
            Helper::log($this->conn, $userId, $userName, 'CREATE_GAME', $data['title']);
            return json_encode(["message" => "Game created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create game"]);
    }

    public function deleteGame($id, $userId, $userName)
    {
        Helper::log($this->conn, $userId, $userName, 'DELETE_GAME', $id);
        return $this->delete('games', $id);
    }

    // --- Prompts ---
    public function getPrompts($userId = null, $userRole = null)
    {
        // Admin sees EVERYTHING
        if ($userRole === 'Admin') {
            $query = "SELECT * FROM prompt_library ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($query);
        }
        // Return published prompts, plus unpublished ones by this user
        else if ($userId) {
            $query = "SELECT * FROM prompt_library WHERE is_published = 1 OR created_by = :uid ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':uid', $userId);
        } else {
            $query = "SELECT * FROM prompt_library WHERE is_published = 1 OR is_published IS NULL ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($data as &$item) {
            if (isset($item['tags'])) $item['tags'] = json_decode($item['tags']);
        }
        return json_encode($data);
    }

    public function getMyPrompts($userId)
    {
        $query = "SELECT * FROM prompt_library WHERE created_by = :uid ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($data as &$item) {
            if (isset($item['tags'])) $item['tags'] = json_decode($item['tags']);
        }
        return json_encode($data);
    }

    public function createPrompt($data, $userId = null, $userName = 'System')
    {
        $id = Helper::uuid();
        $query = "INSERT INTO prompt_library (id, title, prompt_content, description, example_result, example_type, tags, category, is_premium, is_published, created_by, source_type, generator_meta) 
                  VALUES (:id, :title, :prompt_content, :description, :example_result, :example_type, :tags, :category, :is_premium, :is_published, :created_by, :source_type, :generator_meta)";
        $stmt = $this->conn->prepare($query);

        $tags = isset($data['tags']) ? json_encode($data['tags']) : '[]';
        $category = isset($data['category']) ? $data['category'] : 'Teaching';
        $example_type = isset($data['example_type']) ? $data['example_type'] : 'text';
        $example_result = isset($data['example_result']) ? $data['example_result'] : null;
        $is_premium = isset($data['is_premium']) ? (int)$data['is_premium'] : 1;
        $is_published = isset($data['is_published']) ? (int)$data['is_published'] : 1;
        $created_by = isset($data['created_by']) ? $data['created_by'] : null;
        $source_type = isset($data['source_type']) ? $data['source_type'] : 'manual';
        $generator_meta = isset($data['generator_meta']) ? $data['generator_meta'] : null;

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':prompt_content', $data['prompt_content']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':example_result', $example_result);
        $stmt->bindParam(':example_type', $example_type);
        $stmt->bindParam(':tags', $tags);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':is_premium', $is_premium);
        $stmt->bindParam(':is_published', $is_published);
        $stmt->bindParam(':created_by', $created_by);
        $stmt->bindParam(':source_type', $source_type);
        $stmt->bindParam(':generator_meta', $generator_meta);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'CREATE_PROMPT', $data['title']);
            return json_encode(["message" => "Prompt created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create prompt"]);
    }

    public function updatePrompt($id, $data, $userId = null, $userName = 'System')
    {
        $query = "UPDATE prompt_library SET title = :title, prompt_content = :prompt_content, description = :description, example_result = :example_result, example_type = :example_type, category = :category, is_premium = :is_premium WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $category = isset($data['category']) ? $data['category'] : 'General';
        $example_type = isset($data['example_type']) ? $data['example_type'] : 'text';
        $example_result = isset($data['example_result']) ? $data['example_result'] : null;
        $is_premium = isset($data['is_premium']) ? $data['is_premium'] : 1;

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':prompt_content', $data['prompt_content']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':example_result', $example_result);
        $stmt->bindParam(':example_type', $example_type);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':is_premium', $is_premium);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'UPDATE_PROMPT', $data['title']);
            return json_encode(["message" => "Prompt updated", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to update prompt"]);
    }

    public function deletePrompt($id, $userId = null, $userName = 'System')
    {
        Helper::log($this->conn, $userId, $userName, 'DELETE_PROMPT', $id);
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

    public function getReferenceById($id)
    {
        $query = "SELECT * FROM learning_references WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            return json_encode($row);
        } else {
            http_response_code(404);
            return json_encode(["message" => "Reference not found"]);
        }
    }

    public function updateReference($id, $data)
    {
        $query = "UPDATE learning_references SET title = :title, type = :type, link_url = :link_url, description = :description, is_premium = :is_premium WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $is_premium = isset($data['is_premium']) ? $data['is_premium'] : 0;

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':type', $data['type']);
        $stmt->bindParam(':link_url', $data['link_url']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':is_premium', $is_premium);

        if ($stmt->execute()) {
            return json_encode(["message" => "Reference updated", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to update reference"]);
    }

    public function deleteReference($id)
    {
        return $this->delete('learning_references', $id);
    }
}
?>