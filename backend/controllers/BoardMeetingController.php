<?php
// backend/controllers/BoardMeetingController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Helper.php';

class BoardMeetingController {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll($userRole) {
        if (!in_array($userRole, ['Admin', 'Pengurus'])) {
            http_response_code(403);
            return json_encode(["message" => "Forbidden"]);
        }
        $query = "SELECT m.*, p.nama as creator_name 
                  FROM board_meetings m
                  LEFT JOIN profiles p ON m.created_by = p.id
                  ORDER BY m.date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($result);
    }

    public function getById($id, $userId) {
        $query = "SELECT m.*, p.nama as creator_name 
                  FROM board_meetings m
                  LEFT JOIN profiles p ON m.created_by = p.id
                  WHERE m.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $meeting = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($meeting) {
            // Get all attendances
            $attQuery = "SELECT a.*, p.nama, p.role
                         FROM board_meeting_attendances a
                         JOIN profiles p ON a.user_id = p.id
                         WHERE a.meeting_id = :id";
            $attStmt = $this->conn->prepare($attQuery);
            $attStmt->bindParam(':id', $id);
            $attStmt->execute();
            $meeting['attendances'] = $attStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // For Member UI, check if they attended
            $myAtt = array_filter($meeting['attendances'], function($a) use ($userId) {
                return $a['user_id'] === $userId;
            });
            $meeting['my_attendance'] = count($myAtt) > 0 ? array_values($myAtt)[0] : null;

            // Also get all pengurus and admins for manual attendance checking
            $pengurusQuery = "SELECT id, nama, role FROM profiles WHERE role IN ('Admin', 'Pengurus') AND is_active = true ORDER BY nama";
            $pStmt = $this->conn->prepare($pengurusQuery);
            $pStmt->execute();
            $meeting['all_pengurus'] = $pStmt->fetchAll(PDO::FETCH_ASSOC);

            return json_encode($meeting);
        } else {
            http_response_code(404);
            return json_encode(["message" => "Meeting not found"]);
        }
    }

    public function create($data, $userId) {
        // Admin only check should be in index.php or here
        $query = "INSERT INTO board_meetings (id, title, description, date, location, created_by)
                  VALUES (:id, :title, :description, :date, :location, :created_by)";
        
        $stmt = $this->conn->prepare($query);
        
        $id = Helper::uuid();
        $description = $data['description'] ?? null;
        $location = $data['location'] ?? null;
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':date', $data['date']);
        $stmt->bindParam(':location', $location);
        $stmt->bindParam(':created_by', $userId);
        
        if ($stmt->execute()) {
            return json_encode(["message" => "Meeting created successfully"]);
        } else {
            http_response_code(500);
            return json_encode(["message" => "Failed to create meeting"]);
        }
    }

    public function update($id, $data, $userId) {
        $query = "UPDATE board_meetings 
                  SET title = :title, description = :description, date = :date, location = :location, updated_at = NOW()
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $description = $data['description'] ?? null;
        $location = $data['location'] ?? null;
        
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':date', $data['date']);
        $stmt->bindParam(':location', $location);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            return json_encode(["message" => "Meeting updated successfully"]);
        } else {
            http_response_code(500);
            return json_encode(["message" => "Failed to update meeting"]);
        }
    }

    public function delete($id, $userId) {
        $query = "DELETE FROM board_meetings WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            return json_encode(["message" => "Meeting deleted successfully"]);
        } else {
            http_response_code(500);
            return json_encode(["message" => "Failed to delete meeting"]);
        }
    }

    public function markAttendance($meetingId, $targetUserId, $method, $recordedBy) {
        // Check if already attended
        $checkQuery = "SELECT * FROM board_meeting_attendances WHERE meeting_id = :meeting_id AND user_id = :user_id";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':meeting_id', $meetingId);
        $checkStmt->bindParam(':user_id', $targetUserId);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            // Already attended, do nothing or just return success
            return json_encode(["message" => "Already attended"]);
        }

        $query = "INSERT INTO board_meeting_attendances (meeting_id, user_id, attendance_method, recorded_by)
                  VALUES (:meeting_id, :user_id, :method, :recorded_by)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':meeting_id', $meetingId);
        $stmt->bindParam(':user_id', $targetUserId);
        $stmt->bindParam(':method', $method);
        $stmt->bindParam(':recorded_by', $recordedBy);

        if ($stmt->execute()) {
            return json_encode(["message" => "Attendance recorded successfully"]);
        } else {
            http_response_code(500);
            return json_encode(["message" => "Failed to record attendance"]);
        }
    }
    
    public function removeAttendance($meetingId, $targetUserId) {
        $query = "DELETE FROM board_meeting_attendances WHERE meeting_id = :meeting_id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':meeting_id', $meetingId);
        $stmt->bindParam(':user_id', $targetUserId);
        
        if ($stmt->execute()) {
            return json_encode(["message" => "Attendance removed successfully"]);
        } else {
            http_response_code(500);
            return json_encode(["message" => "Failed to remove attendance"]);
        }
    }
}
?>
