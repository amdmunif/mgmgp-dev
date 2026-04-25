<?php

$db = new PDO('sqlite::memory:');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Create tables
$db->exec("
CREATE TABLE contributor_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT NULL
);

CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL
);

CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id TEXT NOT NULL
);
");

// 2. Insert test data
$db->exec("
-- User 1: Has everything
INSERT INTO users (id, email) VALUES ('user1', 'user1@example.com');
INSERT INTO profiles (id, nama) VALUES ('user1', 'Budi');
INSERT INTO questions (creator_id) VALUES ('user1'), ('user1');
INSERT INTO contributor_applications (user_id, status) VALUES ('user1', 'pending');

-- User 2: Missing profile
INSERT INTO users (id, email) VALUES ('user2', 'user2@example.com');
INSERT INTO questions (creator_id) VALUES ('user2');
INSERT INTO contributor_applications (user_id, status) VALUES ('user2', 'pending');

-- User 3: Missing user (should not happen in real life but let's test)
INSERT INTO profiles (id, nama) VALUES ('user3', 'Siti');
INSERT INTO contributor_applications (user_id, status) VALUES ('user3', 'pending');
");

// 3. Test Old Query (INNER JOIN)
echo "=== OLD QUERY (INNER JOIN) ===\n";
$queryOld = "SELECT ca.*, p.nama, u.email, 
          (SELECT COUNT(*) FROM questions q WHERE q.creator_id = ca.user_id) as question_count
          FROM contributor_applications ca
          JOIN profiles p ON ca.user_id = p.id
          JOIN users u ON ca.user_id = u.id
          ORDER BY ca.applied_at DESC";
$stmtOld = $db->query($queryOld);
$resOld = $stmtOld->fetchAll(PDO::FETCH_ASSOC);
print_r($resOld);


// 4. Test New Query (LEFT JOIN)
echo "\n=== NEW QUERY (LEFT JOIN) ===\n";
$queryNew = "SELECT ca.*, p.nama, u.email, 
          (SELECT COUNT(*) FROM questions q WHERE q.creator_id = ca.user_id) as question_count
          FROM contributor_applications ca
          LEFT JOIN profiles p ON ca.user_id = p.id
          LEFT JOIN users u ON ca.user_id = u.id
          ORDER BY ca.applied_at DESC";
$stmtNew = $db->query($queryNew);
$resNew = $stmtNew->fetchAll(PDO::FETCH_ASSOC);
print_r($resNew);

?>