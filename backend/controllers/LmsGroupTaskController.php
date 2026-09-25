<?php
// backend/controllers/LmsGroupTaskController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class LmsGroupTaskController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getGroups($eventId)
    {
        try {
            // Get all groups
            $q = "SELECT * FROM event_groups WHERE event_id = :event_id ORDER BY created_at ASC";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([':event_id' => $eventId]);
            $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get members
            $qM = "SELECT gm.group_id, gm.user_id, p.nama, p.asal_sekolah 
                   FROM event_group_members gm 
                   JOIN profiles p ON gm.user_id = p.id 
                   WHERE gm.group_id IN (SELECT id FROM event_groups WHERE event_id = :event_id)";
            $stmtM = $this->conn->prepare($qM);
            $stmtM->execute([':event_id' => $eventId]);
            $allMembers = $stmtM->fetchAll(PDO::FETCH_ASSOC);

            // Get Peer evaluations (Likes/Dislikes)
            $qP = "SELECT target_group_id, evaluation, COUNT(*) as count 
                   FROM event_group_peer_evaluations 
                   WHERE target_group_id IN (SELECT id FROM event_groups WHERE event_id = :event_id)
                   GROUP BY target_group_id, evaluation";
            $stmtP = $this->conn->prepare($qP);
            $stmtP->execute([':event_id' => $eventId]);
            $evaluations = $stmtP->fetchAll(PDO::FETCH_ASSOC);

            // Get Jury evaluations
            $qJ = "SELECT target_group_id, grade 
                   FROM event_jury_group_evaluations 
                   WHERE target_group_id IN (SELECT id FROM event_groups WHERE event_id = :event_id)";
            $stmtJ = $this->conn->prepare($qJ);
            $stmtJ->execute([':event_id' => $eventId]);
            $juryEvals = $stmtJ->fetchAll(PDO::FETCH_ASSOC);

            foreach ($groups as &$group) {
                $group['members'] = array_values(array_filter($allMembers, function ($m) use ($group) {
                    return $m['group_id'] === $group['id'];
                }));
                
                $group['likes'] = 0;
                $group['dislikes'] = 0;
                foreach ($evaluations as $e) {
                    if ($e['target_group_id'] === $group['id']) {
                        if ($e['evaluation'] === 'like') $group['likes'] = (int)$e['count'];
                        if ($e['evaluation'] === 'dislike') $group['dislikes'] = (int)$e['count'];
                    }
                }

                $group['jury_grades'] = array_values(array_filter($juryEvals, function ($j) use ($group) {
                    return $j['target_group_id'] === $group['id'];
                }));
            }

            return json_encode(["status" => "success", "data" => $groups]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function createGroup($data)
    {
        try {
            $eventId = $data['event_id'];
            $name = $data['name'];
            $members = isset($data['members']) ? $data['members'] : []; // Array of user_ids

            $groupId = Helper::uuid();

            $this->conn->beginTransaction();

            $q = "INSERT INTO event_groups (id, event_id, name) VALUES (:id, :event_id, :name)";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([':id' => $groupId, ':event_id' => $eventId, ':name' => $name]);

            if (count($members) > 0) {
                $qM = "INSERT INTO event_group_members (group_id, user_id) VALUES (:group_id, :user_id)";
                $stmtM = $this->conn->prepare($qM);
                foreach ($members as $userId) {
                    $stmtM->execute([':group_id' => $groupId, ':user_id' => $userId]);
                }
            }

            $this->conn->commit();
            return json_encode(["status" => "success", "message" => "Group created", "id" => $groupId]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function updateGroup($groupId, $data)
    {
        try {
            $name = $data['name'];
            $members = isset($data['members']) ? $data['members'] : [];

            $this->conn->beginTransaction();

            $q = "UPDATE event_groups SET name = :name WHERE id = :id";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([':name' => $name, ':id' => $groupId]);

            // Replace members
            $stmtDel = $this->conn->prepare("DELETE FROM event_group_members WHERE group_id = :id");
            $stmtDel->execute([':id' => $groupId]);

            if (count($members) > 0) {
                $qM = "INSERT INTO event_group_members (group_id, user_id) VALUES (:group_id, :user_id)";
                $stmtM = $this->conn->prepare($qM);
                foreach ($members as $userId) {
                    $stmtM->execute([':group_id' => $groupId, ':user_id' => $userId]);
                }
            }

            $this->conn->commit();
            return json_encode(["status" => "success", "message" => "Group updated"]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function deleteGroup($groupId)
    {
        try {
            $stmt = $this->conn->prepare("DELETE FROM event_groups WHERE id = :id");
            $stmt->execute([':id' => $groupId]);
            return json_encode(["status" => "success", "message" => "Group deleted"]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function getMyGroup($eventId, $userId)
    {
        try {
            $q = "SELECT g.* FROM event_groups g 
                  JOIN event_group_members gm ON g.id = gm.group_id 
                  WHERE g.event_id = :event_id AND gm.user_id = :user_id LIMIT 1";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([':event_id' => $eventId, ':user_id' => $userId]);
            $group = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($group) {
                // get members
                $qM = "SELECT gm.user_id, p.nama FROM event_group_members gm JOIN profiles p ON gm.user_id = p.id WHERE gm.group_id = :group_id";
                $stmtM = $this->conn->prepare($qM);
                $stmtM->execute([':group_id' => $group['id']]);
                $group['members'] = $stmtM->fetchAll(PDO::FETCH_ASSOC);
            }

            return json_encode(["status" => "success", "data" => $group]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function submitTask($data, $userId)
    {
        try {
            $groupId = $data['group_id'];
            $taskUrl = $data['task_url'];

            // verify user is in group
            $stmt = $this->conn->prepare("SELECT 1 FROM event_group_members WHERE group_id = :g AND user_id = :u");
            $stmt->execute([':g' => $groupId, ':u' => $userId]);
            if (!$stmt->fetch()) {
                http_response_code(403);
                return json_encode(["message" => "Bukan anggota kelompok ini"]);
            }

            $q = "UPDATE event_groups SET task_url = :url, is_submitted = 1 WHERE id = :id";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([':url' => $taskUrl, ':id' => $groupId]);

            return json_encode(["status" => "success", "message" => "Tugas berhasil dikumpulkan"]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function peerEvaluate($data, $userId)
    {
        try {
            $targetGroupId = $data['target_group_id'];
            $evaluation = $data['evaluation']; // 'like' or 'dislike'

            // ensure user is not in this group
            $stmt = $this->conn->prepare("SELECT 1 FROM event_group_members WHERE group_id = :g AND user_id = :u");
            $stmt->execute([':g' => $targetGroupId, ':u' => $userId]);
            if ($stmt->fetch()) {
                http_response_code(400);
                return json_encode(["message" => "Tidak dapat menilai kelompok sendiri"]);
            }

            // upsert evaluation
            $id = Helper::uuid();
            // check if exists
            $stmtCheck = $this->conn->prepare("SELECT id FROM event_group_peer_evaluations WHERE evaluator_user_id = :u AND target_group_id = :g");
            $stmtCheck->execute([':u' => $userId, ':g' => $targetGroupId]);
            $existing = $stmtCheck->fetch();

            if ($existing) {
                $q = "UPDATE event_group_peer_evaluations SET evaluation = :e WHERE id = :id";
                $stmtU = $this->conn->prepare($q);
                $stmtU->execute([':e' => $evaluation, ':id' => $existing['id']]);
            } else {
                $q = "INSERT INTO event_group_peer_evaluations (id, evaluator_user_id, target_group_id, evaluation) VALUES (:id, :u, :g, :e)";
                $stmtI = $this->conn->prepare($q);
                $stmtI->execute([':id' => $id, ':u' => $userId, ':g' => $targetGroupId, ':e' => $evaluation]);
            }

            return json_encode(["status" => "success", "message" => "Penilaian berhasil"]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function juryEvaluateGroup($data, $userId)
    {
        try {
            $targetGroupId = $data['target_group_id'];
            $grade = $data['grade'];

            // Upsert
            $id = Helper::uuid();
            $stmtCheck = $this->conn->prepare("SELECT id FROM event_jury_group_evaluations WHERE jury_user_id = :u AND target_group_id = :g");
            $stmtCheck->execute([':u' => $userId, ':g' => $targetGroupId]);
            $existing = $stmtCheck->fetch();

            if ($existing) {
                $stmtU = $this->conn->prepare("UPDATE event_jury_group_evaluations SET grade = :grade WHERE id = :id");
                $stmtU->execute([':grade' => $grade, ':id' => $existing['id']]);
            } else {
                $stmtI = $this->conn->prepare("INSERT INTO event_jury_group_evaluations (id, jury_user_id, target_group_id, grade) VALUES (:id, :u, :g, :grade)");
                $stmtI->execute([':id' => $id, ':u' => $userId, ':g' => $targetGroupId, ':grade' => $grade]);
            }

            return json_encode(["status" => "success", "message" => "Nilai juri berhasil disimpan"]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function juryEvaluateParticipant($data, $userId)
    {
        try {
            $targetUserId = $data['target_user_id'];
            $eventId = $data['event_id'];
            $grade = $data['grade'];

            // Upsert
            $id = Helper::uuid();
            $stmtCheck = $this->conn->prepare("SELECT id FROM event_jury_participant_evaluations WHERE jury_user_id = :j AND target_user_id = :t AND event_id = :e");
            $stmtCheck->execute([':j' => $userId, ':t' => $targetUserId, ':e' => $eventId]);
            $existing = $stmtCheck->fetch();

            if ($existing) {
                $stmtU = $this->conn->prepare("UPDATE event_jury_participant_evaluations SET grade = :grade WHERE id = :id");
                $stmtU->execute([':grade' => $grade, ':id' => $existing['id']]);
            } else {
                $stmtI = $this->conn->prepare("INSERT INTO event_jury_participant_evaluations (id, jury_user_id, target_user_id, event_id, grade) VALUES (:id, :j, :t, :e, :grade)");
                $stmtI->execute([':id' => $id, ':j' => $userId, ':t' => $targetUserId, ':e' => $eventId, ':grade' => $grade]);
            }

            return json_encode(["status" => "success", "message" => "Nilai keaktifan berhasil disimpan"]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function getSettings()
    {
        try {
            $stmt = $this->conn->query("SELECT * FROM lms_grade_settings ORDER BY grade ASC");
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode(["status" => "success", "data" => $settings]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function updateSettings($data)
    {
        try {
            $this->conn->beginTransaction();
            $stmtDel = $this->conn->query("DELETE FROM lms_grade_settings");
            
            $stmtI = $this->conn->prepare("INSERT INTO lms_grade_settings (grade, points) VALUES (:grade, :points)");
            foreach ($data as $item) {
                $stmtI->execute([':grade' => $item['grade'], ':points' => $item['points']]);
            }

            $this->conn->commit();
            return json_encode(["status" => "success", "message" => "Settings updated"]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function getJuries($eventId)
    {
        try {
            $q = "SELECT ep.user_id, p.nama, p.asal_sekolah 
                  FROM event_participants ep 
                  JOIN profiles p ON ep.user_id = p.id 
                  WHERE ep.event_id = :event_id AND ep.is_jury = 1";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([':event_id' => $eventId]);
            $juries = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode(["status" => "success", "data" => $juries]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function setJuryRole($data)
    {
        try {
            $eventId = $data['event_id'];
            $userId = $data['user_id'];
            $isJury = $data['is_jury'];

            $stmt = $this->conn->prepare("UPDATE event_participants SET is_jury = :is_jury WHERE event_id = :event_id AND user_id = :user_id");
            $stmt->execute([':is_jury' => $isJury, ':event_id' => $eventId, ':user_id' => $userId]);

            return json_encode(["status" => "success", "message" => "Role Juri berhasil diupdate"]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function getParticipantsWithActiveness($eventId)
    {
        try {
            $q = "SELECT ep.user_id, p.nama, p.asal_sekolah,
                  (SELECT grade FROM event_jury_participant_evaluations WHERE target_user_id = ep.user_id AND event_id = :e LIMIT 1) as grade
                  FROM event_participants ep 
                  JOIN profiles p ON ep.user_id = p.id 
                  WHERE ep.event_id = :e ORDER BY p.nama ASC";
            $stmt = $this->conn->prepare($q);
            $stmt->execute([':e' => $eventId]);
            $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode(["status" => "success", "data" => $participants]);
        } catch (PDOException $e) {
            http_response_code(500);
            return json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }
}
