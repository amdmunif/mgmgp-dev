<?php
// backend/controllers/ContentController.php
include_once './config/database.php';
include_once './utils/Helper.php';
include_once './utils/Mailer.php';

class ContentController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    // --- NEWS ---
    public function getNews()
    {
        $query = "SELECT * FROM news_articles ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function getNewsDetail($id)
    {
        $query = "SELECT * FROM news_articles WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $news = $stmt->fetch(PDO::FETCH_ASSOC);
        return json_encode($news ?: null);
    }

    public function createNews($data, $userId, $userName)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO news_articles (id, title, content, author_id, image_url, created_at) 
                  VALUES (:id, :title, :content, :author_id, :image_url, NOW())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':author_id', $data['author_id']);
        $stmt->bindParam(':image_url', $data['image_url']);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'CREATE_NEWS', $data['title']);
            return json_encode(["message" => "News created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create news"]);
    }

    public function deleteNews($id, $userId, $userName)
    {
        // Get title for logging
        $title = "Unknown News";
        $stmtTitle = $this->conn->prepare("SELECT title FROM news_articles WHERE id = :id");
        $stmtTitle->bindParam(':id', $id);
        $stmtTitle->execute();
        if ($res = $stmtTitle->fetch(PDO::FETCH_ASSOC))
            $title = $res['title'];

        $query = "DELETE FROM news_articles WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'DELETE_NEWS', $title);
            return json_encode(["message" => "News deleted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete news"]);
    }

    public function updateNews($id, $data, $userId, $userName)
    {
        $query = "UPDATE news_articles SET 
                    title = :title, 
                    content = :content, 
                    category = :category, 
                    image_url = :image_url 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':category', $data['category']);
        $stmt->bindParam(':image_url', $data['image_url']);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'UPDATE_NEWS', $data['title']);
            return json_encode(["message" => "News updated"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to update news"]);
    }

    // --- EVENTS ---
    public function getEvents($isAdmin = false)
    {
        $query = "SELECT * FROM events";
        if (!$isAdmin) {
            $query .= " WHERE is_registration_open = 1";
        }
        $query .= " ORDER BY date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function getEventDetail($id, $isAdmin = false)
    {
        $query = "SELECT * FROM events WHERE id = :id";
        if (!$isAdmin) {
            $query .= " AND is_registration_open = 1";
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($event) {
            $event['is_registration_open'] = (int)$event['is_registration_open'];
            $event['is_premium'] = (int)$event['is_premium'];
            $event['is_paid'] = (int)$event['is_paid'];
            $event['price'] = (float)$event['price'];
            
            if ($event['is_paid'] === 1) {
                // Fetch bank details from premium_bank_accounts
                $stmtBank = $this->conn->prepare("SELECT bank_name, account_number, account_holder FROM premium_bank_accounts WHERE is_active = 1 LIMIT 1");
                $stmtBank->execute();
                $bank = $stmtBank->fetch(PDO::FETCH_ASSOC);
                if ($bank) {
                    $event['bank_name'] = $bank['bank_name'];
                    $event['bank_account_number'] = $bank['account_number'];
                    $event['bank_account_holder'] = $bank['account_holder'];
                }
            }
            $event['has_lms'] = isset($event['has_lms']) ? (int)$event['has_lms'] : 0;
            $event['quota'] = isset($event['quota']) ? (int)$event['quota'] : null;
        }
        return json_encode($event ?: null);
    }

    public function createEvent($data, $userId, $userName)
    {
        try {
            $id = Helper::uuid();
            $query = "INSERT INTO events (id, title, description, date, location, image_url, is_registration_open, is_premium, is_paid, price, registration_deadline, attendance_deadline, quota, has_lms, created_at) 
                      VALUES (:id, :title, :description, :date, :location, :image_url, :is_registration_open, :is_premium, :is_paid, :price, :registration_deadline, :attendance_deadline, :quota, :has_lms, NOW())";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':date', $data['date']);
            $stmt->bindParam(':location', $data['location']);
            $stmt->bindParam(':image_url', $data['image_url']);
            $isReg = $data['is_registration_open'] ?? 1;
            $stmt->bindParam(':is_registration_open', $isReg, PDO::PARAM_INT);
            $isPremium = $data['is_premium'] ?? 0;
            $stmt->bindParam(':is_premium', $isPremium, PDO::PARAM_INT);
            $isPaid = $data['is_paid'] ?? 0;
            $stmt->bindParam(':is_paid', $isPaid, PDO::PARAM_INT);
            $price = $data['price'] ?? 0;
            $stmt->bindParam(':price', $price);
            $deadline = !empty($data['registration_deadline']) ? $data['registration_deadline'] : null;
            $stmt->bindParam(':registration_deadline', $deadline);
            $attDeadline = !empty($data['attendance_deadline']) ? $data['attendance_deadline'] : null;
            $stmt->bindParam(':attendance_deadline', $attDeadline);
            
            $quota = !empty($data['quota']) ? $data['quota'] : null;
            $stmt->bindParam(':quota', $quota, PDO::PARAM_INT);
            $has_lms = $data['has_lms'] ?? 0;
            $stmt->bindParam(':has_lms', $has_lms, PDO::PARAM_INT);

            if ($stmt->execute()) {
                Helper::log($this->conn, $userId, $userName, 'CREATE_EVENT', $data['title']);
                return json_encode(["message" => "Event created", "id" => $id]);
            }
            http_response_code(500);
            return json_encode(["message" => "Failed to create event"]);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "SQL Error: " . $e->getMessage() . " at " . $e->getLine()]);
        }
    }

    public function deleteEvent($id, $userId, $userName, $userRole = '')
    {
        try {
            $this->conn->beginTransaction();
            
            // Get title and event details for logging and role checks
            $title = "Unknown Event";
            $stmtEvent = $this->conn->prepare("SELECT title, is_paid, has_lms FROM events WHERE id = :id");
            $stmtEvent->bindParam(':id', $id);
            $stmtEvent->execute();
            if ($res = $stmtEvent->fetch(PDO::FETCH_ASSOC)) {
                $title = $res['title'];
                
                // Role check: Only Admin can delete events that are paid or have LMS
                if (($res['is_paid'] || $res['has_lms']) && $userRole !== 'Admin') {
                    $this->conn->rollBack();
                    http_response_code(403);
                    return json_encode(["message" => "Hanya Super Admin yang dapat menghapus kegiatan berbayar atau kegiatan yang memiliki modul LMS."]);
                }
            } else {
                $this->conn->rollBack();
                http_response_code(404);
                return json_encode(["message" => "Event not found"]);
            }

            // 1. Lms Sub-items
            $stmtTopics = $this->conn->prepare("SELECT id FROM lms_topics WHERE event_id = :id");
            $stmtTopics->execute([':id' => $id]);
            $topicIds = $stmtTopics->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($topicIds)) {
                $topicIn = str_repeat('?,', count($topicIds) - 1) . '?';
                
                // Quizzes
                $stmtQuiz = $this->conn->prepare("SELECT id FROM lms_quizzes WHERE topic_id IN ($topicIn)");
                $stmtQuiz->execute($topicIds);
                $quizIds = $stmtQuiz->fetchAll(PDO::FETCH_COLUMN);

                if (!empty($quizIds)) {
                    $quizIn = str_repeat('?,', count($quizIds) - 1) . '?';
                    
                    // Attempts
                    $stmtAtt = $this->conn->prepare("SELECT id FROM lms_quiz_attempts WHERE quiz_id IN ($quizIn)");
                    $stmtAtt->execute($quizIds);
                    $attemptIds = $stmtAtt->fetchAll(PDO::FETCH_COLUMN);
                    
                    if (!empty($attemptIds)) {
                        $attIn = str_repeat('?,', count($attemptIds) - 1) . '?';
                        $stmt = $this->conn->prepare("DELETE FROM lms_quiz_answers WHERE attempt_id IN ($attIn)");
                        $stmt->execute($attemptIds);
                    }
                    
                    $stmt = $this->conn->prepare("DELETE FROM lms_quiz_attempts WHERE quiz_id IN ($quizIn)");
                    $stmt->execute($quizIds);

                    // Questions
                    $stmtQ = $this->conn->prepare("SELECT id FROM lms_quiz_questions WHERE quiz_id IN ($quizIn)");
                    $stmtQ->execute($quizIds);
                    $qIds = $stmtQ->fetchAll(PDO::FETCH_COLUMN);

                    if (!empty($qIds)) {
                        $qIn = str_repeat('?,', count($qIds) - 1) . '?';
                        $stmt = $this->conn->prepare("DELETE FROM lms_quiz_options WHERE question_id IN ($qIn)");
                        $stmt->execute($qIds);
                    }

                    $stmt = $this->conn->prepare("DELETE FROM lms_quiz_questions WHERE quiz_id IN ($quizIn)");
                    $stmt->execute($quizIds);

                    $stmt = $this->conn->prepare("DELETE FROM lms_quizzes WHERE topic_id IN ($topicIn)");
                    $stmt->execute($topicIds);
                }

                // Assignments
                $stmtAsg = $this->conn->prepare("SELECT id FROM lms_assignments WHERE topic_id IN ($topicIn)");
                $stmtAsg->execute($topicIds);
                $asgIds = $stmtAsg->fetchAll(PDO::FETCH_COLUMN);

                if (!empty($asgIds)) {
                    $asgIn = str_repeat('?,', count($asgIds) - 1) . '?';
                    $stmt = $this->conn->prepare("DELETE FROM lms_assignment_submissions WHERE assignment_id IN ($asgIn)");
                    $stmt->execute($asgIds);
                }

                $stmt = $this->conn->prepare("DELETE FROM lms_assignments WHERE topic_id IN ($topicIn)");
                $stmt->execute($topicIds);

                $stmt = $this->conn->prepare("DELETE FROM lms_materials WHERE topic_id IN ($topicIn)");
                $stmt->execute($topicIds);

                $stmt = $this->conn->prepare("DELETE FROM lms_topics WHERE event_id = ?");
                $stmt->execute([$id]);
            }

            // 2. Direct Event relations
            $stmt = $this->conn->prepare("DELETE FROM lms_user_progress WHERE event_id = ?");
            $stmt->execute([$id]);

            $stmt = $this->conn->prepare("DELETE FROM event_participants WHERE event_id = ?");
            $stmt->execute([$id]);

            $stmt = $this->conn->prepare("DELETE FROM letters WHERE event_id = ?");
            $stmt->execute([$id]);

            $stmt = $this->conn->prepare("DELETE FROM gallery_images WHERE event_id = ?");
            $stmt->execute([$id]);

            // 3. Delete Event
            $stmt = $this->conn->prepare("DELETE FROM events WHERE id = ?");
            $stmt->execute([$id]);

            Helper::log($this->conn, $userId, $userName, 'DELETE_EVENT', $title);
            
            $this->conn->commit();
            return json_encode(["message" => "Event deleted completely"]);
            
        } catch (\Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Failed to delete event: " . $e->getMessage()]);
        }
    }

    public function updateEvent($id, $data, $userId, $userName)
    {
        try {
            $query = "UPDATE events SET 
                        title = :title, 
                        description = :description, 
                        date = :date, 
                        location = :location, 
                        image_url = :image_url, 
                        is_registration_open = :is_registration_open,
                        is_premium = :is_premium,
                        is_paid = :is_paid,
                        price = :price,
                        registration_deadline = :registration_deadline,
                        attendance_deadline = :attendance_deadline,
                        quota = :quota,
                        has_lms = :has_lms
                      WHERE id = :id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':date', $data['date']);
            $stmt->bindParam(':location', $data['location']);
            $stmt->bindParam(':image_url', $data['image_url']);
            $isReg = $data['is_registration_open'] ?? 1;
            $stmt->bindParam(':is_registration_open', $isReg, PDO::PARAM_INT);
            $isPremium = $data['is_premium'] ?? 0;
            $stmt->bindParam(':is_premium', $isPremium, PDO::PARAM_INT);
            $isPaid = $data['is_paid'] ?? 0;
            $stmt->bindParam(':is_paid', $isPaid, PDO::PARAM_INT);
            $price = $data['price'] ?? 0;
            $stmt->bindParam(':price', $price);
            $deadline = !empty($data['registration_deadline']) ? $data['registration_deadline'] : null;
            $stmt->bindParam(':registration_deadline', $deadline);
            $attDeadline = !empty($data['attendance_deadline']) ? $data['attendance_deadline'] : null;
            $stmt->bindParam(':attendance_deadline', $attDeadline);

            $quota = !empty($data['quota']) ? $data['quota'] : null;
            $stmt->bindParam(':quota', $quota, PDO::PARAM_INT);
            $has_lms = $data['has_lms'] ?? 0;
            $stmt->bindParam(':has_lms', $has_lms, PDO::PARAM_INT);

            if ($stmt->execute()) {
                Helper::log($this->conn, $userId, $userName, 'UPDATE_EVENT', $data['title']);
                return json_encode(["message" => "Event updated"]);
            }
            http_response_code(500);
            return json_encode(["message" => "Failed to update event"]);
        } catch (\Throwable $e) {
            http_response_code(500);
            return json_encode(["message" => "SQL Error: " . $e->getMessage() . " at " . $e->getLine()]);
        }
    }

    // --- EVENT PARTICIPATION ---
    public function joinEvent($eventId, $userId, $paymentProofUrl = null)
    {
        // 0. Check Premium & Payment Status & Get Details for Email
        $stmtEvent = $this->conn->prepare("SELECT is_premium, is_paid, title, date, location FROM events WHERE id = :eid");
        $stmtEvent->bindParam(':eid', $eventId);
        $stmtEvent->execute();
        $event = $stmtEvent->fetch(PDO::FETCH_ASSOC);

        if ($event && $event['is_premium'] == 1) {
            $stmtUser = $this->conn->prepare("SELECT premium_until FROM profiles WHERE id = :uid");
            $stmtUser->bindParam(':uid', $userId);
            $stmtUser->execute();
            $userProfile = $stmtUser->fetch(PDO::FETCH_ASSOC);

            $isPremium = false;
            if ($userProfile && $userProfile['premium_until']) {
                $premiumUntil = new DateTime($userProfile['premium_until']);
                $now = new DateTime();
                if ($premiumUntil > $now) {
                    $isPremium = true;
                }
            }

            if (!$isPremium) {
                http_response_code(403);
                return json_encode(["message" => "This event is for Premium members only"]);
            }
        }

        $check = $this->conn->prepare("SELECT * FROM event_participants WHERE event_id = :eid AND user_id = :uid");
        $check->bindParam(':eid', $eventId);
        $check->bindParam(':uid', $userId);
        $check->execute();
        if ($check->rowCount() > 0)
            return json_encode(["message" => "Already joined"]);

        if ($event && $event['is_paid'] == 1) {
            $paymentStatus = $paymentProofUrl ? 'waiting_confirmation' : 'pending';
        } else {
            $paymentStatus = 'free';
        }
        $paymentDate = ($paymentProofUrl) ? date('Y-m-d H:i:s') : null;

        $query = "INSERT INTO event_participants (event_id, user_id, payment_status, payment_proof_url, payment_date, registered_at) 
                  VALUES (:eid, :uid, :payment_status, :payment_proof_url, :payment_date, NOW())";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);
        $stmt->bindParam(':payment_status', $paymentStatus);
        $stmt->bindParam(':payment_proof_url', $paymentProofUrl);
        $stmt->bindParam(':payment_date', $paymentDate);

        if ($stmt->execute()) {
            $stmtTitle = $this->conn->prepare("SELECT title FROM events WHERE id = :eid");
            $stmtTitle->bindParam(':eid', $eventId);
            $stmtTitle->execute();
            $eventTitle = $stmtTitle->fetchColumn();
            
            // Get user email
            $stmtUser = $this->conn->prepare("SELECT u.email, p.nama FROM users u JOIN profiles p ON u.id = p.id WHERE u.id = :uid");
            $stmtUser->bindParam(':uid', $userId);
            $stmtUser->execute();
            $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);

            if ($userData) {
                Mailer::sendEventRegistration($userData['email'], $userData['nama'], $event['title'], $event);
                if ($paymentProofUrl) {
                    Mailer::sendEventPaymentProofUploaded($userData['email'], $userData['nama'], $event['title']);
                }
            }

            $targetLog = !empty($eventTitle) ? $eventTitle : $eventId;
            Helper::log($this->conn, $userId, 'Member', 'JOIN_EVENT', $targetLog);
            return json_encode(["message" => "Joined successfully"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to join"]);
    }

    public function uploadEventPaymentProof($eventId, $userId, $proofUrl)
    {
        $query = "UPDATE event_participants SET payment_proof_url = :proofUrl, payment_status = 'waiting_confirmation', payment_date = NOW() WHERE event_id = :eid AND user_id = :uid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':proofUrl', $proofUrl);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);
        
        if ($stmt->execute()) {
            $stmtEvent = $this->conn->prepare("SELECT title FROM events WHERE id = :eid");
            $stmtEvent->bindParam(':eid', $eventId);
            $stmtEvent->execute();
            $eventTitle = $stmtEvent->fetchColumn();

            $stmtUser = $this->conn->prepare("SELECT u.email, p.nama FROM users u JOIN profiles p ON u.id = p.id WHERE u.id = :uid");
            $stmtUser->bindParam(':uid', $userId);
            $stmtUser->execute();
            $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);

            if ($userData && $eventTitle) {
                Mailer::sendEventPaymentProofUploaded($userData['email'], $userData['nama'], $eventTitle);
            }
            return json_encode(["message" => "Payment proof uploaded successfully"]);
        }
        
        http_response_code(500);
        return json_encode(["message" => "Failed to upload payment proof"]);
    }

    public function getParticipation($eventId, $userId)
    {
        $query = "SELECT * FROM event_participants WHERE event_id = :eid AND user_id = :uid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();
        $part = $stmt->fetch(PDO::FETCH_ASSOC);
        return json_encode($part ?: null);
    }

    public function submitTask($eventId, $userId, $taskUrl)
    {
        $query = "UPDATE event_participants SET tugas_submitted = 1, task_url = :url WHERE event_id = :eid AND user_id = :uid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':url', $taskUrl);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);

        if ($stmt->execute()) {
            // Send Notification
            $stmtUser = $this->conn->prepare("SELECT p.nama, u.email FROM profiles p JOIN users u ON p.id = u.id WHERE p.id = :uid");
            $stmtUser->execute([':uid' => $userId]);
            $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
            
            $stmtTitle = $this->conn->prepare("SELECT title FROM events WHERE id = :eid");
            $stmtTitle->execute([':eid' => $eventId]);
            $eventTitle = $stmtTitle->fetchColumn();

            if ($user && $eventTitle) {
                Mailer::sendTaskSubmitted($user['email'], $user['nama'], $eventTitle);
            }
            return json_encode(["message" => "Task submitted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to submit task"]);
    }

    public function getUpcomingEvents($userId)
    {
        // Debug
        // error_log("Fetching upcoming events for user: $userId");

        // e.* will include is_premium IF it exists.
        // Synthesize participation_status from is_hadir since 'status' column does not exist
        $query = "SELECT e.*, 
                  CASE 
                    WHEN ep.is_hadir = 1 THEN 'attended'
                    WHEN ep.user_id IS NOT NULL THEN 'registered'
                    ELSE NULL 
                  END as participation_status
                  FROM events e 
                  LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.user_id = :uid 
                  WHERE e.date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                  ORDER BY e.date ASC";

        // Debug Query
        // error_log($query);

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Debug Results
        // error_log("Events found: " . count($results));

        return json_encode($results);
    }

    public function getMyHistory($userId)
    {
        $query = "SELECT ep.*, e.title, e.date, e.location, e.tasks_url as event_tasks_url, e.certificate_url 
                  FROM event_participants ep 
                  JOIN events e ON ep.event_id = e.id 
                  WHERE ep.user_id = :uid 
                  ORDER BY ep.registered_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();

        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formatted = [];
        foreach ($data as $row) {
            $formatted[] = [
                'id' => $row['event_id'] . '-' . $row['user_id'],
                'event_id' => $row['event_id'],
                'user_id' => $row['user_id'],
                // Synthesize status from is_hadir
                'status' => ($row['is_hadir'] == 1) ? 'attended' : 'registered',
                'tugas_submitted' => $row['tugas_submitted'] ?? 0,
                'task_url' => $row['task_url'] ?? null,
                'registered_at' => $row['registered_at'],
                'events' => [
                    'title' => $row['title'],
                    'date' => $row['date'],
                    'location' => $row['location'],
                    'certificate_url' => $row['certificate_url'] ?? null,
                    'tasks_url' => $row['event_tasks_url'] ?? null
                ]
            ];
        }
        return json_encode($formatted);
    }

    public function getEventParticipants($eventId)
    {
        // Fetch participants with user details
        $query = "SELECT ep.*, p.nama, u.email, p.foto_profile, p.asal_sekolah 
                  FROM event_participants ep
                  LEFT JOIN profiles p ON ep.user_id = p.id
                  LEFT JOIN users u ON ep.user_id = u.id
                  WHERE ep.event_id = :eid
                  ORDER BY ep.registered_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':eid', $eventId);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function updateParticipantStatus($eventId, $userId, $status)
    {
        $isHadir = ($status === 'attended') ? 1 : 0;

        $query = "UPDATE event_participants SET is_hadir = :is_hadir WHERE event_id = :eid AND user_id = :uid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':is_hadir', $isHadir, PDO::PARAM_INT);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);

        if ($stmt->execute()) {
            return json_encode(["message" => "Status updated"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to update status"]);
    }

    public function confirmPayment($eventId, $userId, $adminId)
    {
        // First check if it's already confirmed
        $check = $this->conn->prepare("SELECT payment_status FROM event_participants WHERE event_id = :eid AND user_id = :uid");
        $check->execute([':eid' => $eventId, ':uid' => $userId]);
        $participant = $check->fetch(PDO::FETCH_ASSOC);

        if (!$participant) {
            http_response_code(404);
            return json_encode(["message" => "Participant not found"]);
        }

        if ($participant['payment_status'] === 'confirmed') {
            return json_encode(["message" => "Payment already confirmed"]);
        }

        // Fetch user data and event data
        $stmtUser = $this->conn->prepare("SELECT u.email, p.nama, e.title as event_title, e.price FROM users u JOIN profiles p ON u.id = p.id JOIN events e ON e.id = :eid WHERE u.id = :uid");
        $stmtUser->execute([':uid' => $userId, ':eid' => $eventId]);
        $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);

        // Update payment status to confirmed
        $query = "UPDATE event_participants SET payment_status = 'confirmed' WHERE event_id = :eid AND user_id = :uid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);

        if ($stmt->execute()) {
            if ($userData && $userData['price'] > 0) {
                $trxId = Helper::uuid();
                $desc = "Pendaftaran Event: " . $userData['event_title'] . " (a.n. " . $userData['nama'] . ")";
                
                $trxQuery = "INSERT INTO finance_transactions (id, type, amount, description, reference_id, reference_type, created_by) 
                             VALUES (:id, 'income', :amount, :desc, :ref, 'event_registration', :admin)";
                $trxStmt = $this->conn->prepare($trxQuery);
                $trxStmt->bindParam(':id', $trxId);
                $trxStmt->bindParam(':amount', $userData['price']);
                $trxStmt->bindParam(':desc', $desc);
                $trxStmt->bindParam(':ref', $eventId);
                $trxStmt->bindParam(':admin', $adminId);
                $trxStmt->execute();
            }

            // Send confirmation email
            if ($userData && $userData['email']) {
                Mailer::sendEventPaymentConfirmed($userData['email'], $userData['nama'], $userData['event_title']);
            }

            return json_encode(["message" => "Payment confirmed and logged to finance"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to confirm payment"]);
    }

    public function rejectPayment($eventId, $userId)
    {
        $query = "UPDATE event_participants SET payment_status = 'rejected' WHERE event_id = :eid AND user_id = :uid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);

        if ($stmt->execute()) {
            // Send rejection email
            $stmtUser = $this->conn->prepare("SELECT u.email, p.nama, e.title as event_title FROM users u JOIN profiles p ON u.id = p.id JOIN events e ON e.id = :eid WHERE u.id = :uid");
            $stmtUser->bindParam(':uid', $userId);
            $stmtUser->bindParam(':eid', $eventId);
            $stmtUser->execute();
            $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);
            if ($userData && $userData['email']) {
                Mailer::sendEventPaymentRejected($userData['email'], $userData['nama'], $userData['event_title']);
            }

            return json_encode(["message" => "Payment rejected"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to reject payment"]);
    }

    public function markSelfAttendance($eventId, $userId)
    {
        // 1. Verify user is registered
        $checkQuery = "SELECT * FROM event_participants WHERE event_id = :eid AND user_id = :uid";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':eid', $eventId);
        $checkStmt->bindParam(':uid', $userId);
        $checkStmt->execute();

        if ($checkStmt->rowCount() === 0) {
            http_response_code(400);
            return json_encode(["message" => "User not registered for this event"]);
        }

        // 1.5 Check attendance deadline
        $checkEvent = "SELECT attendance_deadline FROM events WHERE id = :eid";
        $stmtEvent = $this->conn->prepare($checkEvent);
        $stmtEvent->execute([':eid' => $eventId]);
        $eventData = $stmtEvent->fetch(PDO::FETCH_ASSOC);

        if ($eventData && $eventData['attendance_deadline']) {
            $deadline = new DateTime($eventData['attendance_deadline']);
            $now = new DateTime();
            if ($now > $deadline) {
                http_response_code(400);
                return json_encode(["message" => "Batas waktu absensi telah berakhir."]);
            }
        }

        // 2. Mark as attended
        $updateQuery = "UPDATE event_participants SET is_hadir = 1 WHERE event_id = :eid AND user_id = :uid";
        $updateStmt = $this->conn->prepare($updateQuery);
        $updateStmt->bindParam(':eid', $eventId);
        $updateStmt->bindParam(':uid', $userId);

        if ($updateStmt->execute()) {
            $stmtTitle = $this->conn->prepare("SELECT title FROM events WHERE id = :eid");
            $stmtTitle->bindParam(':eid', $eventId);
            $stmtTitle->execute();
            $eventTitle = $stmtTitle->fetchColumn();
            $targetLog = !empty($eventTitle) ? $eventTitle : $eventId;
            Helper::log($this->conn, $userId, 'Member', 'SELF_ATTENDANCE', $targetLog);
            
            // Send Notification
            $stmtUser = $this->conn->prepare("SELECT p.nama, u.email FROM profiles p JOIN users u ON p.id = u.id WHERE p.id = :uid");
            $stmtUser->execute([':uid' => $userId]);
            $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
            
            if ($user && $eventTitle) {
                Mailer::sendEventAttendance($user['email'], $user['nama'], $eventTitle);
            }

            return json_encode(["message" => "Attendance marked successfully"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to mark attendance"]);
    }

    public function updateParticipantsBulk($eventId, $userIds, $status)
    {
        if (!is_array($userIds) || empty($userIds)) {
            http_response_code(400);
            return json_encode(["message" => "Invalid user IDs"]);
        }

        $isHadir = ($status === 'attended') ? 1 : 0;

        // Construct placeholders for IN clause
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));

        $query = "UPDATE event_participants SET is_hadir = ? WHERE event_id = ? AND user_id IN ($placeholders)";
        $stmt = $this->conn->prepare($query);

        // Bind parameters: is_hadir, eventId, ...userIds
        $params = array_merge([$isHadir, $eventId], $userIds);

        if ($stmt->execute($params)) {
            Helper::log($this->conn, 0, 'Admin', 'BULK_ATTENDANCE_UPDATE', "Event ID: $eventId, Count: " . count($userIds));
            return json_encode(["message" => "Bulk update successful"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to update participants"]);
    }

    public function deleteParticipant($eventId, $userId)
    {
        $query = "DELETE FROM event_participants WHERE event_id = :eid AND user_id = :uid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);

        if ($stmt->execute()) {
            return json_encode(["message" => "Participant removed successfully"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to remove participant"]);
    }
}
?>