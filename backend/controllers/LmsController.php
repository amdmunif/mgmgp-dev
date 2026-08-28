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
        $this->ensureTablesExist();
    }

    private function ensureTablesExist() {
        try {
            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS lms_user_progress (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    event_id VARCHAR(36) NOT NULL,
                    item_type VARCHAR(20) NOT NULL,
                    item_id VARCHAR(36) NOT NULL,
                    is_completed TINYINT(1) DEFAULT 0,
                    completed_at TIMESTAMP NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_user_item (user_id, item_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
            
            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS lms_assignment_submissions (
                    id VARCHAR(36) PRIMARY KEY,
                    assignment_id VARCHAR(36) NOT NULL,
                    user_id VARCHAR(36) NOT NULL,
                    content_url TEXT,
                    text_content TEXT,
                    score DECIMAL(5,2) DEFAULT NULL,
                    feedback TEXT,
                    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    graded_at TIMESTAMP NULL,
                    UNIQUE KEY unique_submission (assignment_id, user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");

            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS lms_quiz_attempts (
                    id VARCHAR(36) PRIMARY KEY,
                    quiz_id VARCHAR(36) NOT NULL,
                    user_id VARCHAR(36) NOT NULL,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    finished_at TIMESTAMP NULL,
                    answers JSON DEFAULT NULL,
                    total_score DECIMAL(5,2) DEFAULT 0,
                    is_passed TINYINT(1) DEFAULT 0
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        } catch (\PDOException $e) {
            // Silently ignore if lacking permissions, etc.
        }
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

    public function getAssignmentSubmission($assignmentId, $userId) {
        try {
            $query = "SELECT * FROM lms_assignment_submissions WHERE assignment_id = :aid AND user_id = :uid LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':aid', $assignmentId);
            $stmt->bindParam(':uid', $userId);
            $stmt->execute();
            return json_encode($stmt->fetch(\PDO::FETCH_ASSOC) ?: null);
        } catch (\PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function submitAssignment($data, $userId, $userName) {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }
        try {
            $assignmentId = $data['assignment_id'] ?? '';
            $contentUrl = $data['content_url'] ?? '';
            $textContent = $data['text_content'] ?? '';

            $chk = $this->conn->prepare("SELECT id FROM lms_assignment_submissions WHERE assignment_id = :aid AND user_id = :uid LIMIT 1");
            $chk->execute([':aid' => $assignmentId, ':uid' => $userId]);
            $existing = $chk->fetch();

            if ($existing) {
                $q = "UPDATE lms_assignment_submissions SET content_url = :url, text_content = :txt, submitted_at = NOW() WHERE id = :id";
                $s = $this->conn->prepare($q);
                $s->execute([':url' => $contentUrl, ':txt' => $textContent, ':id' => $existing['id']]);
                $id = $existing['id'];
            } else {
                $id = Helper::uuid();
                $q = "INSERT INTO lms_assignment_submissions (id, assignment_id, user_id, content_url, text_content, submitted_at) VALUES (:id, :aid, :uid, :url, :txt, NOW())";
                $s = $this->conn->prepare($q);
                $s->execute([':id' => $id, ':aid' => $assignmentId, ':uid' => $userId, ':url' => $contentUrl, ':txt' => $textContent]);
            }
            $this->_autoMarkProgress($assignmentId, 'assignment', $userId);
            return json_encode(["message" => "Berhasil dikumpulkan", "id" => $id]);
        } catch (\PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function getQuizAttempts($quizId, $userId) {
        try {
            $q = "SELECT * FROM lms_quiz_attempts WHERE quiz_id = :qid AND user_id = :uid ORDER BY started_at DESC";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([':qid' => $quizId, ':uid' => $userId]);
            $res = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            error_log("getQuizAttempts DEBUG: quizId=$quizId, userId=$userId, count=" . count($res) . "\n", 3, "/Users/ahmadmunif/Documents/web/mgmp-v2/my_debug.log");
            return json_encode($res);
        } catch (\PDOException $e) {
            error_log("getQuizAttempts EXCEPTION: " . $e->getMessage() . "\n", 3, "/Users/ahmadmunif/Documents/web/mgmp-v2/my_debug.log");
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function submitQuizAttempt($data, $userId, $userName) {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }
        try {
            $this->conn->beginTransaction();
            $quizId = $data['quiz_id'] ?? '';
            $answers = $data['answers'] ?? [];
            
            $stmt = $this->conn->prepare("SELECT * FROM lms_quizzes WHERE id = :id");
            $stmt->execute([':id' => $quizId]);
            $quiz = $stmt->fetch();
            if (!$quiz) throw new \Exception("Quiz not found");
            
            $qStmt = $this->conn->prepare("SELECT * FROM lms_quiz_questions WHERE quiz_id = :qid");
            $qStmt->execute([':qid' => $quizId]);
            $questions = $qStmt->fetchAll(\PDO::FETCH_ASSOC);

            $oStmt = $this->conn->prepare("SELECT * FROM lms_quiz_options WHERE question_id IN (SELECT id FROM lms_quiz_questions WHERE quiz_id = :qid)");
            $oStmt->execute([':qid' => $quizId]);
            $options = $oStmt->fetchAll(\PDO::FETCH_ASSOC);
            
            $totalPoints = 0;
            $earnedPoints = 0;
            $processedAnswers = [];
            
            foreach ($questions as $q) {
                $p = (float)($q['points'] ?? 1);
                $totalPoints += $p;
                
                $selectedOptId = $answers[$q['id']] ?? null;
                $isCorrect = 0;
                $pointsEarned = 0;
                
                foreach ($options as $opt) {
                    if ($opt['question_id'] === $q['id'] && $opt['is_correct']) {
                        if ($selectedOptId === $opt['id']) {
                            $isCorrect = 1;
                            $pointsEarned = $p;
                            $earnedPoints += $p;
                        }
                        break;
                    }
                }
                
                $processedAnswers[] = [
                    'q_id' => $q['id'],
                    'o_id' => $selectedOptId,
                    'is_correct' => $isCorrect,
                    'points_earned' => $pointsEarned
                ];
            }
            
            $score = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;
            $isPassed = $score >= (float)$quiz['passing_score'] ? 1 : 0;
            
            $attemptId = Helper::uuid();
            $insAtt = $this->conn->prepare("INSERT INTO lms_quiz_attempts (id, user_id, quiz_id, status, finished_at, total_score, is_passed) VALUES (:id, :uid, :qid, 'completed', NOW(), :score, :passed)");
            $insAtt->execute([
                ':id' => $attemptId,
                ':uid' => $userId,
                ':qid' => $quizId,
                ':score' => $score,
                ':passed' => $isPassed
            ]);
            
            error_log("submitQuizAttempt DEBUG: inserted attemptId=$attemptId for quizId=$quizId, userId=$userId\n", 3, "/Users/ahmadmunif/Documents/web/mgmp-v2/my_debug.log");
            
            $insAns = $this->conn->prepare("INSERT INTO lms_quiz_answers (id, attempt_id, question_id, selected_option_id, is_correct, score_awarded) VALUES (:id, :aid, :qid, :oid, :is_correct, :score_awarded)");
            foreach ($processedAnswers as $pa) {
                $insAns->execute([
                    ':id' => Helper::uuid(),
                    ':aid' => $attemptId,
                    ':qid' => $pa['q_id'],
                    ':oid' => $pa['o_id'],
                    ':is_correct' => $pa['is_correct'],
                    ':score_awarded' => $pa['points_earned']
                ]);
            }
            
            $this->_autoMarkProgress($quizId, 'quiz', $userId);

            $this->conn->commit();
            return json_encode([
                "message" => "Berhasil disimpan",
                "score" => $score,
                "earned_points" => $earnedPoints,
                "total_points" => $totalPoints,
                "is_passed" => $isPassed
            ]);
        } catch (\Throwable $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    public function getAllAssignmentSubmissions($assignmentId) {
        try {
            $query = "SELECT s.*, u.full_name as user_name 
                      FROM lms_assignment_submissions s 
                      LEFT JOIN users u ON s.user_id = u.id 
                      WHERE s.assignment_id = :aid 
                      ORDER BY s.submitted_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':aid' => $assignmentId]);
            return json_encode($stmt->fetchAll(\PDO::FETCH_ASSOC));
        } catch (\PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function gradeAssignment($data, $graderId) {
        if (!$graderId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }
        try {
            $submissionId = $data['submission_id'] ?? '';
            $score = $data['score'] ?? null;
            $feedback = $data['feedback'] ?? '';
            
            $q = "UPDATE lms_assignment_submissions 
                  SET score = :score, feedback = :feedback, graded_at = NOW(), graded_by = :graderId 
                  WHERE id = :id";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([
                ':score' => $score !== '' ? (float)$score : null,
                ':feedback' => $feedback,
                ':graderId' => $graderId,
                ':id' => $submissionId
            ]);
            
            return json_encode(["message" => "Penilaian berhasil disimpan"]);
        } catch (\PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function getAllQuizAttempts($quizId) {
        try {
            $query = "SELECT a.*, u.full_name as user_name 
                      FROM lms_quiz_attempts a 
                      INNER JOIN (
                          SELECT user_id, MAX(started_at) as max_started_at
                          FROM lms_quiz_attempts
                          WHERE quiz_id = :qid1
                          GROUP BY user_id
                      ) latest ON a.user_id = latest.user_id AND a.started_at = latest.max_started_at
                      LEFT JOIN users u ON a.user_id = u.id 
                      WHERE a.quiz_id = :qid2 
                      ORDER BY a.started_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':qid1' => $quizId, ':qid2' => $quizId]);
            return json_encode($stmt->fetchAll(\PDO::FETCH_ASSOC));
        } catch (\PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function getProgressSummary($userId)
    {
        try {
            $query = "SELECT 
                        t.event_id,
                        (SELECT COUNT(*) FROM lms_materials m2 INNER JOIN lms_topics t2 ON m2.topic_id = t2.id WHERE t2.event_id = t.event_id) as total_items,
                        (SELECT COUNT(*) FROM lms_user_progress p WHERE p.event_id = t.event_id AND p.user_id = :uid) as completed_items
                      FROM lms_topics t
                      GROUP BY t.event_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':uid' => $userId]);
            $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $summary = [];
            foreach ($results as $row) {
                $total = (int)$row['total_items'];
                $completed = (int)$row['completed_items'];
                $percent = $total > 0 ? round(($completed / $total) * 100) : 0;
                $summary[$row['event_id']] = $percent;
            }

            return json_encode($summary);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    public function getEventProgress($eventId, $userId)
    {
        try {
            $query = "SELECT item_id FROM lms_user_progress WHERE event_id = :eid AND user_id = :uid AND is_completed = 1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':eid' => $eventId, ':uid' => $userId]);
            $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            $completedItems = array_column($results, 'item_id');
            return json_encode($completedItems);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    public function markProgress($data, $userId)
    {
        try {
            $eventId = $data['event_id'] ?? '';
            $itemType = $data['item_type'] ?? 'material';
            $itemId = $data['item_id'] ?? '';
            
            if (!$eventId || !$itemId) {
                http_response_code(400);
                return json_encode(["message" => "Missing parameters"]);
            }

            // check if exists
            $check = $this->conn->prepare("SELECT id FROM lms_user_progress WHERE user_id = :uid AND item_type = :itype AND item_id = :iid");
            $check->execute([
                ':uid' => $userId,
                ':itype' => $itemType,
                ':iid' => $itemId
            ]);
            
            if ($check->rowCount() == 0) {
                $id = Helper::uuid();
                $ins = $this->conn->prepare("INSERT INTO lms_user_progress (id, user_id, event_id, item_type, item_id, is_completed, completed_at) VALUES (:id, :uid, :eid, :itype, :iid, 1, NOW())");
                $ins->execute([
                    ':id' => $id,
                    ':uid' => $userId,
                    ':eid' => $eventId,
                    ':itype' => $itemType,
                    ':iid' => $itemId
                ]);
            }
            return json_encode(["message" => "Progress marked"]);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }

    private function _autoMarkProgress($itemId, $itemType, $userId) {
        try {
            $q = "SELECT t.event_id FROM lms_materials m INNER JOIN lms_topics t ON m.topic_id = t.id WHERE m.id = :id";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([':id' => $itemId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if ($row && $row['event_id']) {
                $this->markProgress([
                    'event_id' => $row['event_id'],
                    'item_type' => $itemType,
                    'item_id' => $itemId
                ], $userId);
            }
        } catch (\Throwable $e) {
            // ignore
        }
    }
// Function draft for LmsController.php
public function getEventGradebook($eventId) {
    // 1. Get all participants
    $qParts = "SELECT ep.user_id, p.nama, p.asal_sekolah, p.foto_profile 
               FROM event_participants ep 
               LEFT JOIN profiles p ON ep.user_id = p.id 
               WHERE ep.event_id = :eid";
    $stmt = $this->conn->prepare($qParts);
    $stmt->execute([':eid' => $eventId]);
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get all quizzes for this event
    $qQuizzes = "SELECT q.id, q.title FROM lms_quizzes q 
                 JOIN lms_topics t ON q.topic_id = t.id 
                 WHERE t.event_id = :eid ORDER BY q.order_num ASC";
    $stmt = $this->conn->prepare($qQuizzes);
    $stmt->execute([':eid' => $eventId]);
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Get all assignments for this event
    $qAssignments = "SELECT a.id, a.title FROM lms_assignments a 
                     JOIN lms_topics t ON a.topic_id = t.id 
                     WHERE t.event_id = :eid ORDER BY a.order_num ASC";
    $stmt = $this->conn->prepare($qAssignments);
    $stmt->execute([':eid' => $eventId]);
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Get quiz scores (latest attempt for each user & quiz)
    // We can fetch all attempts and filter in PHP since it's simpler.
    $qQuizScores = "SELECT qa.user_id, qa.quiz_id, qa.total_score, qa.started_at 
                    FROM lms_quiz_attempts qa
                    JOIN lms_quizzes q ON qa.quiz_id = q.id
                    JOIN lms_topics t ON q.topic_id = t.id
                    WHERE t.event_id = :eid
                    ORDER BY qa.started_at DESC";
    $stmt = $this->conn->prepare($qQuizScores);
    $stmt->execute([':eid' => $eventId]);
    $allQuizAttempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group quiz attempts (latest only)
    $quizScores = [];
    foreach ($allQuizAttempts as $qa) {
        $key = $qa['user_id'] . '_' . $qa['quiz_id'];
        if (!isset($quizScores[$key])) {
            $quizScores[$key] = $qa['total_score'];
        }
    }

    // 5. Get assignment scores
    $qAssignmentScores = "SELECT s.user_id, s.assignment_id, s.score 
                          FROM lms_assignment_submissions s
                          JOIN lms_assignments a ON s.assignment_id = a.id
                          JOIN lms_topics t ON a.topic_id = t.id
                          WHERE t.event_id = :eid";
    $stmt = $this->conn->prepare($qAssignmentScores);
    $stmt->execute([':eid' => $eventId]);
    $allAssignmentSubs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $assignmentScores = [];
    foreach ($allAssignmentSubs as $sub) {
        $key = $sub['user_id'] . '_' . $sub['assignment_id'];
        $assignmentScores[$key] = $sub['score'];
    }

    // 6. Assemble gradebook
    $gradebook = [];
    foreach ($participants as $p) {
        $p['quizzes'] = [];
        $p['assignments'] = [];
        $totalScore = 0;
        $countItems = count($quizzes) + count($assignments);

        foreach ($quizzes as $q) {
            $score = isset($quizScores[$p['user_id'] . '_' . $q['id']]) ? floatval($quizScores[$p['user_id'] . '_' . $q['id']]) : null;
            $p['quizzes'][] = [
                'quiz_id' => $q['id'],
                'title' => $q['title'],
                'score' => $score
            ];
            if ($score !== null) {
                $totalScore += $score;
            }
        }

        foreach ($assignments as $a) {
            $score = isset($assignmentScores[$p['user_id'] . '_' . $a['id']]) ? floatval($assignmentScores[$p['user_id'] . '_' . $a['id']]) : null;
            $p['assignments'][] = [
                'assignment_id' => $a['id'],
                'title' => $a['title'],
                'score' => $score
            ];
            if ($score !== null) {
                $totalScore += $score;
            }
        }

        $p['average_score'] = $countItems > 0 ? round($totalScore / $countItems, 2) : 0;
        $gradebook[] = $p;
    }

    return json_encode([
        'quizzes' => $quizzes,
        'assignments' => $assignments,
        'participants' => $gradebook
    ]);
}
}
?>
