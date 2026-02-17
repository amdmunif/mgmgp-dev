<?php
// backend/controllers/ContentController.php
include_once './config/database.php';
include_once './utils/Helper.php';

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
    public function getEvents()
    {
        $query = "SELECT * FROM events ORDER BY date ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function getEventDetail($id)
    {
        $query = "SELECT * FROM events WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
        return json_encode($event ?: null);
    }

    public function createEvent($data, $userId, $userName)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO events (id, title, description, date, location, image_url, is_registration_open, is_premium, created_at) 
                  VALUES (:id, :title, :description, :date, :location, :image_url, :is_registration_open, :is_premium, NOW())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':date', $data['date']);
        $stmt->bindParam(':location', $data['location']);
        $stmt->bindParam(':image_url', $data['image_url']);
        $stmt->bindParam(':image_url', $data['image_url']);
        $isReg = $data['is_registration_open'] ?? 1;
        $stmt->bindParam(':is_registration_open', $isReg, PDO::PARAM_INT);
        $isPremium = $data['is_premium'] ?? 0;
        $stmt->bindParam(':is_premium', $isPremium, PDO::PARAM_INT);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'CREATE_EVENT', $data['title']);
            return json_encode(["message" => "Event created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create event"]);
    }

    public function deleteEvent($id, $userId, $userName)
    {
        // Get title for logging
        $title = "Unknown Event";
        $stmtTitle = $this->conn->prepare("SELECT title FROM events WHERE id = :id");
        $stmtTitle->bindParam(':id', $id);
        $stmtTitle->execute();
        if ($res = $stmtTitle->fetch(PDO::FETCH_ASSOC))
            $title = $res['title'];

        $query = "DELETE FROM events WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'DELETE_EVENT', $title);
            return json_encode(["message" => "Event deleted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete event"]);
    }

    public function updateEvent($id, $data, $userId, $userName)
    {
        $query = "UPDATE events SET 
                    title = :title, 
                    description = :description, 
                    date = :date, 
                    location = :location, 
                    image_url = :image_url, 
                    is_registration_open = :is_registration_open,
                    is_premium = :is_premium
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

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'UPDATE_EVENT', $data['title']);
            return json_encode(["message" => "Event updated"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to update event"]);
    }

    // --- EVENT PARTICIPATION ---
    public function joinEvent($eventId, $userId)
    {
        $check = $this->conn->prepare("SELECT * FROM event_participants WHERE event_id = :eid AND user_id = :uid");
        $check->bindParam(':eid', $eventId);
        $check->bindParam(':uid', $userId);
        $check->execute();
        if ($check->rowCount() > 0)
            return json_encode(["message" => "Already joined"]);

        $query = "INSERT INTO event_participants (event_id, user_id, registered_at) VALUES (:eid, :uid, NOW())";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);

        if ($stmt->execute())
            return json_encode(["message" => "Joined successfully"]);
        http_response_code(500);
        return json_encode(["message" => "Failed to join"]);
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

        if ($stmt->execute())
            return json_encode(["message" => "Task submitted"]);
        http_response_code(500);
        return json_encode(["message" => "Failed to submit task"]);
    }

    public function getUpcomingEvents($userId)
    {
        // Debug
        // error_log("Fetching upcoming events for user: $userId");

        // Use LEFT JOIN to get events even if user hasn't participated, but filtering by date.
        // REMOVED explicit e.is_premium to prevent SQL error if migration hasn't run on production yet.
        // e.* will include is_premium IF it exists.
        $query = "SELECT e.*, ep.status as participation_status 
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
        $query = "SELECT ep.*, e.title, e.date, e.location 
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
                'status' => $row['status'] ?? 'registered',
                'registered_at' => $row['registered_at'],
                'events' => [
                    'title' => $row['title'],
                    'date' => $row['date'],
                    'location' => $row['location']
                ]
            ];
        }
        return json_encode($formatted);
    }

    public function getEventParticipants($eventId)
    {
        // Fetch participants with user details
        $query = "SELECT ep.*, p.nama, p.email, p.foto_profile 
                  FROM event_participants ep
                  JOIN profiles p ON ep.user_id = p.id
                  WHERE ep.event_id = :eid
                  ORDER BY ep.registered_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':eid', $eventId);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function updateParticipantStatus($eventId, $userId, $status)
    {
        // Update both status and is_hadir for compatibility
        $isHadir = ($status === 'attended') ? 1 : 0;

        // Check if status column exists in schema by try-catch or just update is_hadir if status fails?
        // Safest approach: Update what we know exists first.
        // Assuming status column exists based on getUpcomingEvents query.

        $query = "UPDATE event_participants SET status = :status, is_hadir = :is_hadir WHERE event_id = :eid AND user_id = :uid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':is_hadir', $isHadir, PDO::PARAM_INT);
        $stmt->bindParam(':eid', $eventId);
        $stmt->bindParam(':uid', $userId);

        if ($stmt->execute()) {
            return json_encode(["message" => "Status updated"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to update status"]);
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

        // 2. Mark as attended
        $updateQuery = "UPDATE event_participants SET status = 'attended', is_hadir = 1 WHERE event_id = :eid AND user_id = :uid";
        $updateStmt = $this->conn->prepare($updateQuery);
        $updateStmt->bindParam(':eid', $eventId);
        $updateStmt->bindParam(':uid', $userId);

        if ($updateStmt->execute()) {
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

        $query = "UPDATE event_participants SET status = ?, is_hadir = ? WHERE event_id = ? AND user_id IN ($placeholders)";
        $stmt = $this->conn->prepare($query);

        // Bind parameters: status, is_hadir, eventId, ...userIds
        $params = array_merge([$status, $isHadir, $eventId], $userIds);

        if ($stmt->execute($params)) {
            return json_encode(["message" => "Bulk update successful"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to update participants"]);
    }
}
?>