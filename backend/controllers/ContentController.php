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

    public function createNews($data)
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
            return json_encode(["message" => "News created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create news"]);
    }

    public function deleteNews($id)
    {
        $query = "DELETE FROM news_articles WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            return json_encode(["message" => "News deleted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete news"]);
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

    public function createEvent($data)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO events (id, title, description, date, location, image_url, is_registration_open, created_at) 
                  VALUES (:id, :title, :description, :date, :location, :image_url, :is_registration_open, NOW())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':date', $data['date']);
        $stmt->bindParam(':location', $data['location']);
        $stmt->bindParam(':image_url', $data['image_url']);
        $isReg = $data['is_registration_open'] ?? 1;
        $stmt->bindParam(':is_registration_open', $isReg, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return json_encode(["message" => "Event created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create event"]);
    }

    public function deleteEvent($id)
    {
        $query = "DELETE FROM events WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            return json_encode(["message" => "Event deleted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete event"]);
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
        $query = "SELECT e.*, ep.status as participation_status 
                  FROM events e 
                  LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.user_id = :uid 
                  WHERE e.date >= NOW() 
                  ORDER BY e.date ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
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
}
?>