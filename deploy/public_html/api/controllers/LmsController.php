<?php
// backend/controllers/LmsController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class LmsController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    // ==========================================
    // TOPICS
    // ==========================================

    public function getTopicsByEvent($eventId)
    {
        $query = "SELECT * FROM lms_topics WHERE event_id = :event_id ORDER BY order_num ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':event_id', $eventId);
        $stmt->execute();
        
        $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Cast types
        foreach ($topics as &$topic) {
            $topic['order_num'] = (int)$topic['order_num'];
        }
        return json_encode($topics);
    }

    public function createTopic($data, $userId, $userName)
    {
        try {
            $id = Helper::uuid();
            $query = "INSERT INTO lms_topics (id, event_id, title, order_num, created_at) 
                      VALUES (:id, :event_id, :title, :order_num, NOW())";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':event_id', $data['event_id']);
            $stmt->bindParam(':title', $data['title']);
            $orderNum = isset($data['order_num']) ? (int)$data['order_num'] : 0;
            $stmt->bindParam(':order_num', $orderNum, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                // Fetch the created record
                $stmtGet = $this->conn->prepare("SELECT * FROM lms_topics WHERE id = :id");
                $stmtGet->bindParam(':id', $id);
                $stmtGet->execute();
                $topic = $stmtGet->fetch(PDO::FETCH_ASSOC);
                
                Helper::log($this->conn, $userId, $userName, 'CREATE_LMS_TOPIC', $data['title'] . " (Event: {$data['event_id']})");
                return json_encode(["message" => "Topic created", "data" => $topic]);
            }
            http_response_code(500);
            return json_encode(["message" => "Failed to create topic"]);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    public function updateTopic($id, $data, $userId, $userName)
    {
        try {
            $query = "UPDATE lms_topics SET title = :title, order_num = :order_num WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':title', $data['title']);
            $orderNum = isset($data['order_num']) ? (int)$data['order_num'] : 0;
            $stmt->bindParam(':order_num', $orderNum, PDO::PARAM_INT);

            if ($stmt->execute()) {
                Helper::log($this->conn, $userId, $userName, 'UPDATE_LMS_TOPIC', $data['title']);
                
                // Fetch updated
                $stmtGet = $this->conn->prepare("SELECT * FROM lms_topics WHERE id = :id");
                $stmtGet->bindParam(':id', $id);
                $stmtGet->execute();
                $topic = $stmtGet->fetch(PDO::FETCH_ASSOC);
                
                return json_encode(["message" => "Topic updated", "data" => $topic]);
            }
            http_response_code(500);
            return json_encode(["message" => "Failed to update topic"]);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    public function deleteTopic($id, $userId, $userName)
    {
        try {
            // Get title for logging
            $title = "Unknown";
            $stmtGet = $this->conn->prepare("SELECT title FROM lms_topics WHERE id = :id");
            $stmtGet->bindParam(':id', $id);
            $stmtGet->execute();
            if ($row = $stmtGet->fetch(PDO::FETCH_ASSOC)) {
                $title = $row['title'];
            }

            // Also delete associated materials (handled by DB cascade ideally, but let's be explicit if not)
            $stmtDelMat = $this->conn->prepare("DELETE FROM lms_materials WHERE topic_id = :id");
            $stmtDelMat->bindParam(':id', $id);
            $stmtDelMat->execute();

            $query = "DELETE FROM lms_topics WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                Helper::log($this->conn, $userId, $userName, 'DELETE_LMS_TOPIC', $title);
                return json_encode(["message" => "Topic deleted"]);
            }
            http_response_code(500);
            return json_encode(["message" => "Failed to delete topic"]);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    // ==========================================
    // MATERIALS
    // ==========================================

    public function getMaterialsByTopic($topicId)
    {
        $query = "SELECT * FROM lms_materials WHERE topic_id = :topic_id ORDER BY order_num ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':topic_id', $topicId);
        $stmt->execute();
        
        $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($materials as &$mat) {
            $mat['order_num'] = (int)$mat['order_num'];
            $mat['duration'] = (int)$mat['duration'];
        }
        return json_encode($materials);
    }

    public function createMaterial($data, $userId, $userName)
    {
        try {
            $id = Helper::uuid();
            $query = "INSERT INTO lms_materials (id, topic_id, title, type, content, url, duration, order_num, created_at) 
                      VALUES (:id, :topic_id, :title, :type, :content, :url, :duration, :order_num, NOW())";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':topic_id', $data['topic_id']);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':type', $data['type']);
            $content = $data['content'] ?? null;
            $stmt->bindParam(':content', $content);
            $url = $data['url'] ?? null;
            $stmt->bindParam(':url', $url);
            $duration = isset($data['duration']) ? (int)$data['duration'] : 0;
            $stmt->bindParam(':duration', $duration, PDO::PARAM_INT);
            $orderNum = isset($data['order_num']) ? (int)$data['order_num'] : 0;
            $stmt->bindParam(':order_num', $orderNum, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                $stmtGet = $this->conn->prepare("SELECT * FROM lms_materials WHERE id = :id");
                $stmtGet->bindParam(':id', $id);
                $stmtGet->execute();
                $material = $stmtGet->fetch(PDO::FETCH_ASSOC);

                Helper::log($this->conn, $userId, $userName, 'CREATE_LMS_MATERIAL', $data['title']);
                return json_encode(["message" => "Material created", "data" => $material]);
            }
            http_response_code(500);
            return json_encode(["message" => "Failed to create material"]);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    public function updateMaterial($id, $data, $userId, $userName)
    {
        try {
            $query = "UPDATE lms_materials SET 
                        title = :title, 
                        type = :type,
                        content = :content,
                        url = :url,
                        duration = :duration,
                        order_num = :order_num
                      WHERE id = :id";
                      
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':type', $data['type']);
            $content = $data['content'] ?? null;
            $stmt->bindParam(':content', $content);
            $url = $data['url'] ?? null;
            $stmt->bindParam(':url', $url);
            $duration = isset($data['duration']) ? (int)$data['duration'] : 0;
            $stmt->bindParam(':duration', $duration, PDO::PARAM_INT);
            $orderNum = isset($data['order_num']) ? (int)$data['order_num'] : 0;
            $stmt->bindParam(':order_num', $orderNum, PDO::PARAM_INT);

            if ($stmt->execute()) {
                Helper::log($this->conn, $userId, $userName, 'UPDATE_LMS_MATERIAL', $data['title']);
                
                $stmtGet = $this->conn->prepare("SELECT * FROM lms_materials WHERE id = :id");
                $stmtGet->bindParam(':id', $id);
                $stmtGet->execute();
                $material = $stmtGet->fetch(PDO::FETCH_ASSOC);

                return json_encode(["message" => "Material updated", "data" => $material]);
            }
            http_response_code(500);
            return json_encode(["message" => "Failed to update material"]);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    public function deleteMaterial($id, $userId, $userName)
    {
        try {
            // Get title for logging
            $title = "Unknown";
            $stmtGet = $this->conn->prepare("SELECT title FROM lms_materials WHERE id = :id");
            $stmtGet->bindParam(':id', $id);
            $stmtGet->execute();
            if ($row = $stmtGet->fetch(PDO::FETCH_ASSOC)) {
                $title = $row['title'];
            }

            $query = "DELETE FROM lms_materials WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                Helper::log($this->conn, $userId, $userName, 'DELETE_LMS_MATERIAL', $title);
                return json_encode(["message" => "Material deleted"]);
            }
            http_response_code(500);
            return json_encode(["message" => "Failed to delete material"]);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    // ==========================================
    // QUIZZES
    // ==========================================

    public function getQuizByMaterialId($materialId)
    {
        try {
            // Check if quiz exists for this topic/material
            // Assuming material has type='quiz', and the quiz's `id` is linked to material's `id` or topic
            // Wait, in lms_schema.sql.md, lms_quizzes has `id`, `topic_id`.
            // But how do we map a material of type quiz to lms_quizzes? 
            // Often, material.id == quiz.id or quiz has `material_id`. 
            // In the schema: CREATE TABLE lms_quizzes (id, topic_id, title...)
            // Since we navigate to `/admin/events/:eventId/lms/quiz/:materialId`, we can assume `lms_quizzes.id` = `lms_materials.id`
            $query = "SELECT * FROM lms_quizzes WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $materialId);
            $stmt->execute();
            $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$quiz) {
                return json_encode(null);
            }

            // Fetch questions
            $qQuery = "SELECT * FROM lms_quiz_questions WHERE quiz_id = :quiz_id ORDER BY order_num ASC";
            $qStmt = $this->conn->prepare($qQuery);
            $qStmt->bindParam(':quiz_id', $quiz['id']);
            $qStmt->execute();
            $questions = $qStmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch options for each question
            foreach ($questions as &$question) {
                $oQuery = "SELECT * FROM lms_quiz_options WHERE question_id = :question_id";
                $oStmt = $this->conn->prepare($oQuery);
                $oStmt->bindParam(':question_id', $question['id']);
                $oStmt->execute();
                $options = $oStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Convert is_correct to boolean for frontend
                foreach ($options as &$opt) {
                    $opt['is_correct'] = (bool)$opt['is_correct'];
                }
                $question['options'] = $options;
            }

            $quiz['questions'] = $questions;
            return json_encode($quiz);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    public function saveQuiz($data, $userId, $userName)
    {
        try {
            $this->conn->beginTransaction();

            $quizId = $data['id']; // This is the materialId
            $topicId = $data['topic_id'] ?? '';
            $title = $data['title'] ?? 'Quiz';
            $description = $data['description'] ?? '';
            $duration = isset($data['duration_minutes']) ? (int)$data['duration_minutes'] : 0;
            $passingScore = isset($data['passing_score']) ? (float)$data['passing_score'] : 70;
            $maxAttempts = isset($data['max_attempts']) ? (int)$data['max_attempts'] : 1;

            // Check if quiz exists
            $stmtCheck = $this->conn->prepare("SELECT id FROM lms_quizzes WHERE id = :id");
            $stmtCheck->bindParam(':id', $quizId);
            $stmtCheck->execute();

            if ($stmtCheck->rowCount() > 0) {
                // Update
                $q = "UPDATE lms_quizzes SET title = :title, description = :description, duration_minutes = :duration_minutes, passing_score = :passing_score, max_attempts = :max_attempts WHERE id = :id";
                $s = $this->conn->prepare($q);
            } else {
                // Insert
                $q = "INSERT INTO lms_quizzes (id, topic_id, title, description, duration_minutes, passing_score, max_attempts) VALUES (:id, :topic_id, :title, :description, :duration_minutes, :passing_score, :max_attempts)";
                $s = $this->conn->prepare($q);
                $s->bindParam(':topic_id', $topicId);
            }

            $s->bindParam(':id', $quizId);
            $s->bindParam(':title', $title);
            $s->bindParam(':description', $description);
            $s->bindParam(':duration_minutes', $duration, PDO::PARAM_INT);
            $s->bindParam(':passing_score', $passingScore);
            $s->bindParam(':max_attempts', $maxAttempts, PDO::PARAM_INT);
            $s->execute();

            // Clear old questions & options (simpler for updates)
            // Options will cascade or we delete them explicitly
            $stmtGetOldQs = $this->conn->prepare("SELECT id FROM lms_quiz_questions WHERE quiz_id = :quiz_id");
            $stmtGetOldQs->bindParam(':quiz_id', $quizId);
            $stmtGetOldQs->execute();
            $oldQs = $stmtGetOldQs->fetchAll(PDO::FETCH_ASSOC);

            foreach ($oldQs as $oldQ) {
                $delOpt = $this->conn->prepare("DELETE FROM lms_quiz_options WHERE question_id = :q_id");
                $delOpt->bindParam(':q_id', $oldQ['id']);
                $delOpt->execute();
            }

            $delQ = $this->conn->prepare("DELETE FROM lms_quiz_questions WHERE quiz_id = :quiz_id");
            $delQ->bindParam(':quiz_id', $quizId);
            $delQ->execute();

            // Insert new questions
            $questions = $data['questions'] ?? [];
            foreach ($questions as $index => $qData) {
                $qId = Helper::uuid();
                $qText = $qData['text'] ?? '';
                $qType = $qData['type'] ?? 'multiple_choice';
                $qPoints = isset($qData['points']) ? (float)$qData['points'] : 1;
                
                $iQ = "INSERT INTO lms_quiz_questions (id, quiz_id, question_text, question_type, points, order_num) VALUES (:id, :quiz_id, :qtext, :qtype, :points, :order_num)";
                $siQ = $this->conn->prepare($iQ);
                $siQ->bindParam(':id', $qId);
                $siQ->bindParam(':quiz_id', $quizId);
                $siQ->bindParam(':qtext', $qText);
                $siQ->bindParam(':qtype', $qType);
                $siQ->bindParam(':points', $qPoints);
                $siQ->bindParam(':order_num', $index, PDO::PARAM_INT);
                $siQ->execute();

                // Insert options
                $options = $qData['options'] ?? [];
                foreach ($options as $optData) {
                    $oId = Helper::uuid();
                    $oText = $optData['text'] ?? '';
                    $oCorrect = !empty($optData['is_correct']) ? 1 : 0;
                    
                    $iO = "INSERT INTO lms_quiz_options (id, question_id, option_text, is_correct) VALUES (:id, :qid, :otext, :is_correct)";
                    $siO = $this->conn->prepare($iO);
                    $siO->bindParam(':id', $oId);
                    $siO->bindParam(':qid', $qId);
                    $siO->bindParam(':otext', $oText);
                    $siO->bindParam(':is_correct', $oCorrect, PDO::PARAM_INT);
                    $siO->execute();
                }
            }

            $this->conn->commit();
            
            Helper::log($this->conn, $userId, $userName, 'SAVE_LMS_QUIZ', $title);
            return json_encode(["message" => "Quiz saved successfully"]);

        } catch (\Throwable $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }
}
?>
