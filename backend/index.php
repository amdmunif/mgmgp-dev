<?php
// backend/index.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri_parts = explode('/', trim($uri, '/'));

// Simple Router (Assumption: /api/controller/action)
// Example: mgmp-v2/backend/index.php/auth/login -> resource=auth, action=login
// If served from root: /auth/login

// For local dev with `php -S localhost:8000`:
// /auth/login -> $uri_parts[0] = auth, $uri_parts[1] = login

if (isset($uri_parts[0]) && $uri_parts[0] === 'api') {
    array_shift($uri_parts); // Remove 'api' prefix if present
}

// Serve Static Files from 'uploads'
if (isset($uri_parts[0]) && $uri_parts[0] === 'uploads') {
    $filename = $uri_parts[1] ?? '';
    $filename = basename($filename); // Sanitize
    $filePath = __DIR__ . '/../uploads/' . $filename;

    if (file_exists($filePath)) {
        $mime = mime_content_type($filePath);
        header("Content-Type: $mime");
        readfile($filePath);
        exit();
    } else {
        http_response_code(404);
        echo "File not found";
        exit();
    }
}

// Temporary Debug Route
if (isset($uri_parts[0]) && $uri_parts[0] === 'debug-db') {
    include_once 'check_db_browser.php';
    exit();
}

// Temporary Migration Route
if (isset($uri_parts[0]) && $uri_parts[0] === 'migrate-db') {
    include_once 'migrate_premium_browser.php';
    exit();
}

if (isset($uri_parts[0]) && $uri_parts[0] === 'migrate-training') {
    include_once 'migrate_training_browser.php';
    exit();
}

if (isset($uri_parts[0]) && $uri_parts[0] === 'migrate-reset') {
    include_once 'migrate_reset_password_browser.php';
    exit();
}

if (isset($uri_parts[0]) && $uri_parts[0] === 'migrate-cleanup') {
    include_once 'migrate_cleanup_browser.php';
    exit();
}

if (isset($uri_parts[0]) && $uri_parts[0] === 'migrate-v2') {
    include_once 'migrate_v2_browser.php';
    exit();
}

if (isset($uri_parts[0]) && $uri_parts[0] === 'diagnose') {
    include_once 'diagnose_db.php';
    exit();
}

include_once './controllers/AuthController.php';
include_once './controllers/ResourceController.php';
include_once './controllers/LearningController.php';

$resource = isset($uri_parts[0]) ? $uri_parts[0] : null;
$action = isset($uri_parts[1]) ? $uri_parts[1] : null;

// Get JSON input
$input = json_decode(file_get_contents("php://input"), true);

// Polyfill for getallheaders if not exists (e.g., Nginx/FastCGI)
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

// Auth Check (Global)
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');
$token = str_replace('Bearer ', '', $authHeader);
$userId = null;
$userName = 'System'; // Fallback
$userRole = null;

if ($token) {
    include_once './utils/Helper.php';
    $payload = Helper::verifyJWT($token);
    if ($payload && isset($payload['sub'])) {
        $userId = $payload['sub'];
        $userName = $payload['nama'] ?? 'User'; // Assuming 'nama' is in JWT payload or we might need to fetch it
        
        $rawRole = $payload['role'] ?? 'Anggota';
        if (in_array(strtolower($rawRole), ['admin', 'super admin'])) {
            $userRole = 'Admin';
            $payload['role'] = 'Admin'; // Normalize for controllers
        } else {
            $userRole = ucfirst(strtolower($rawRole));
            $payload['role'] = $userRole;
        }
    }
}

include_once './controllers/ContentController.php';
include_once './controllers/QuestionController.php';
include_once './controllers/LetterController.php';
include_once './controllers/StatsController.php';
include_once './controllers/TrainingController.php';
include_once './controllers/FinanceController.php';
include_once './controllers/ProjectController.php';
include_once './controllers/LmsController.php';

// ... includes

// Resource Routing
if ($resource === 'news') {
    $controller = new ContentController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action)
            echo $controller->getNewsDetail($action);
        else
            echo $controller->getNews();
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->createNews($input, $userId, $userName);
    if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action)
        echo $controller->updateNews($action, $input, $userId, $userName);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->deleteNews($action, $userId, $userName);

} elseif ($resource === 'lms') {
    $controller = new LmsController();
    $subAction = isset($uri_parts[2]) ? $uri_parts[2] : null;

    if ($action === 'topics') {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            // GET /lms/topics/:eventId
            echo $controller->getTopicsByEvent($subAction);
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if ($subAction === 'reorder') {
                echo $controller->reorderTopics($input, $userId, $userName);
            } else {
                // POST /lms/topics
                echo $controller->createTopic($input, $userId, $userName);
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && $subAction) {
            // PUT /lms/topics/:id
            echo $controller->updateTopic($subAction, $input, $userId, $userName);
        } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $subAction) {
            // DELETE /lms/topics/:id
            echo $controller->deleteTopic($subAction, $userId, $userName);
        }
    } elseif ($action === 'materials') {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            // GET /lms/materials/:topicId
            echo $controller->getMaterialsByTopic($subAction);
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if ($subAction === 'reorder') {
                echo $controller->reorderMaterials($input, $userId, $userName);
            } else {
                // POST /lms/materials
                echo $controller->createMaterial($input, $userId, $userName);
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && $subAction) {
            // PUT /lms/materials/:id
            echo $controller->updateMaterial($subAction, $input, $userId, $userName);
        } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $subAction) {
            // DELETE /lms/materials/:id
            echo $controller->deleteMaterial($subAction, $userId, $userName);
        }
    } elseif ($action === 'quizzes') {
        if ($_SERVER['REQUEST_METHOD'] === 'GET' && $subAction) {
            if ($subAction === 'all-attempts') {
                // GET /lms/quizzes/all-attempts/:quizId
                $quizId = isset($uri_parts[3]) ? $uri_parts[3] : '';
                echo $controller->getAllQuizAttempts($quizId);
            } elseif ($subAction === 'my-attempts') {
                // GET /lms/quizzes/my-attempts/:quizId
                $quizId = isset($uri_parts[3]) ? $uri_parts[3] : '';
                echo $controller->getQuizAttempts($quizId, $userId);
            } else {
                // GET /lms/quizzes/:materialId
                echo $controller->getQuizByMaterialId($subAction);
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
            if ($subAction === 'submit') {
                // POST /lms/quizzes/submit
                echo $controller->submitQuizAttempt($input, $userId, $userName);
            } else {
                // POST /lms/quizzes
                echo $controller->saveQuiz($input, $userId, $userName);
            }
        }
    } elseif ($action === 'assignments') {
        if ($_SERVER['REQUEST_METHOD'] === 'GET' && $subAction) {
            if ($subAction === 'all-submissions' && isset($uri_parts[3])) {
                // GET /lms/assignments/all-submissions/:assignmentId
                echo $controller->getAllAssignmentSubmissions($uri_parts[3]);
            } elseif ($subAction === 'my-submission' && isset($uri_parts[3])) {
                // GET /lms/assignments/my-submission/:assignmentId
                echo $controller->getAssignmentSubmission($uri_parts[3], $userId);
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if ($subAction === 'submit') {
                // POST /lms/assignments/submit
                echo $controller->submitAssignment($input, $userId, $userName);
            } elseif ($subAction === 'grade') {
                // POST /lms/assignments/grade
                echo $controller->gradeAssignment($input, $userId);
            }
        }
    } elseif ($action === 'progress') {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            if ($subAction === 'summary') {
                // GET /lms/progress/summary
                echo $controller->getProgressSummary($userId);
            } elseif ($subAction === 'event' && isset($uri_parts[3])) {
                // GET /lms/progress/event/:eventId
                echo $controller->getEventProgress($uri_parts[3], $userId);
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if ($subAction === 'mark') {
                // POST /lms/progress/mark
                echo $controller->markProgress($input, $userId);
            }
        }
    } elseif ($action === 'gradebook') {
        if ($_SERVER['REQUEST_METHOD'] === 'GET' && $subAction === 'event' && isset($uri_parts[3])) {
            // GET /lms/gradebook/event/:eventId
            echo $controller->getEventGradebook($uri_parts[3]);
        }
    }
} elseif ($resource === 'events') {
    $controller = new ContentController();

    // Auth Check
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');
    $token = str_replace('Bearer ', '', $authHeader);
    $userId = null;
    if ($token) {
        $payload = Helper::verifyJWT($token);
        if ($payload && isset($payload['sub']))
            $userId = $payload['sub'];
    }

    $subAction = isset($uri_parts[2]) ? $uri_parts[2] : null;

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'upcoming') {
            echo $controller->getUpcomingEvents($userId);
        } elseif ($action === 'history') {
            if ($userId)
                echo $controller->getMyHistory($userId);
            else {
                http_response_code(401);
                echo json_encode(["message" => "Unauthorized"]);
            }
        } elseif ($action && $subAction === 'participation') {
            if ($userId)
                echo $controller->getParticipation($action, $userId);
            else {
                http_response_code(401);
                echo json_encode(["message" => "Unauthorized"]);
            }
        } elseif ($action && $subAction === 'participants') {
            // GET /events/:id/participants
            echo $controller->getEventParticipants($action);
        } elseif ($action) {
            echo $controller->getEventDetail($action, in_array($userRole, ['Admin', 'Pengurus']));
        } else {
            echo $controller->getEvents(in_array($userRole, ['Admin', 'Pengurus']));
        }
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($action && $subAction === 'join') {
            if ($userId)
                echo $controller->joinEvent($action, $userId);
            else {
                http_response_code(401);
                echo json_encode(["message" => "Unauthorized"]);
            }
        } elseif ($action && $subAction === 'attend') {
            // POST /events/:id/attend
            $day = $input['day'] ?? 1;
            if ($userId)
                echo $controller->markSelfAttendance($action, $userId, $day);
            else {
                http_response_code(401);
                echo json_encode(["message" => "Unauthorized"]);
            }
        } elseif ($action && $subAction === 'upload-payment') {
            $proofUrl = $input['proof_url'] ?? '';
            if ($userId)
                echo $controller->uploadEventPaymentProof($action, $userId, $proofUrl);
            else {
                http_response_code(401);
                echo json_encode(["message" => "Unauthorized"]);
            }
        } elseif ($action && $subAction === 'submit-task') {
            $taskUrl = $input['task_url'] ?? '';
            if ($userId)
                echo $controller->submitTask($action, $userId, $taskUrl);
            else {
                http_response_code(401);
                echo json_encode(["message" => "Unauthorized"]);
            }
        } elseif ($action && $subAction === 'approve-lms') {
            $targetUserId = $input['user_id'] ?? null;
            $isApproved = $input['is_approved'] ?? 0;
            if ($targetUserId && in_array($userRole, ['Admin', 'Pengurus']))
                echo $controller->approveLms($action, $targetUserId, $isApproved);
            else {
                http_response_code(403);
                echo json_encode(["message" => "Forbidden"]);
            }
        } elseif ($action && $subAction === 'confirm-payment') {
            $targetUserId = $input['user_id'] ?? null;
            if ($targetUserId && in_array($userRole, ['Admin', 'Pengurus']))
                echo $controller->confirmPayment($action, $targetUserId, $userId);
            else {
                http_response_code(403);
                echo json_encode(["message" => "Forbidden or missing user_id"]);
            }
        } elseif ($action && $subAction === 'reject-payment') {
            $targetUserId = $input['user_id'] ?? null;
            if ($targetUserId && in_array($userRole, ['Admin', 'Pengurus']))
                echo $controller->rejectPayment($action, $targetUserId);
            else {
                http_response_code(403);
                echo json_encode(["message" => "Forbidden or missing user_id"]);
            }
        } elseif ($action && $subAction === 'participants' && isset($uri_parts[3]) && $uri_parts[3] === 'bulk') {
            // POST /events/:id/participants/bulk
            $userIds = $input['user_ids'] ?? [];
            $status = $input['status'] ?? 'registered';

            // Check admin role
            if (in_array($userRole, ['Admin', 'Pengurus']))
                echo $controller->updateParticipantsBulk($action, $userIds, $status);
            else {
                http_response_code(403);
                echo json_encode(["message" => "Forbidden"]);
            }
        } else {
            echo $controller->createEvent($input, $userId, $userName);
        }
    }
    if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action) {
        if ($subAction === 'participants') {
            // PUT /events/:id/participants/:userId
            // URL structure: /events/ID/participants/USERID
            // $uri_parts[0]=events, [1]=ID (action), [2]=participants (subAction), [3]=USERID

            // We need to parse URI parts again or grab from parts in index.php context
            // $uri_parts is available globally in this file scope
            $targetUserId = isset($uri_parts[3]) ? $uri_parts[3] : null;

            if ($targetUserId) {
                if (isset($input['is_passed'])) {
                    echo $controller->updateParticipantPassed($action, $targetUserId, $input['is_passed']);
                } elseif (isset($input['status'])) {
                    echo $controller->updateParticipantStatus($action, $targetUserId, $input['status']);
                } else {
                    http_response_code(400);
                    echo json_encode(["message" => "Parameter tidak lengkap"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["message" => "User ID required"]);
            }
        } else {
            echo $controller->updateEvent($action, $input, $userId, $userName);
        }
    }
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action) {
        if ($subAction === 'participants') {
            // DELETE /events/:id/participants/:userId
            $targetUserId = isset($uri_parts[3]) ? $uri_parts[3] : null;
            if ($targetUserId) {
                echo $controller->deleteParticipant($action, $targetUserId);
            } else {
                http_response_code(400);
                echo json_encode(["message" => "User ID required"]);
            }
        } else {
            echo $controller->deleteEvent($action, $userId, $userName, $userRole);
        }
    }

} elseif ($resource === 'questions') {
    $controller = new QuestionController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action)
            echo $controller->getById($action);
        else
            echo $controller->getAll();
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->create($input);
    if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action)
        echo $controller->update($action, $input);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->delete($action);

} elseif ($resource === 'question-banks') {
    $controller = new QuestionController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET')
        echo $controller->getBanks();
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->createBank($input);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->deleteBank($action);

} elseif ($resource === 'letters') {
    $controller = new LetterController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action)
            echo $controller->getById($action);
        else
            echo $controller->getAll();
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->create($input);
    if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action)
        echo $controller->update($action, $input, $userId, $userName);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->delete($action);

} elseif ($resource === 'stats') {
    $controller = new StatsController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'teachers') {
            echo $controller->getTeacherStats();
        } else {
            echo $controller->getOverview();
        }
    }

} elseif ($resource === 'games') {
    $controller = new ResourceController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET')
        echo $controller->getGames();
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->createGame($input, $userId, $userName);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->deleteGame($action, $userId, $userName);
} elseif ($resource === 'prompts') {
    $controller = new ResourceController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET')
        echo $controller->getPrompts($userId, $userRole);
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->createPrompt($input, $userId, $userName);
    if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action)
        echo $controller->updatePrompt($action, $input, $userId, $userName);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->deletePrompt($action, $userId, $userName);
} elseif ($resource === 'logs') {
    include_once './controllers/AuditController.php';
    $controller = new AuditController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET')
        echo $controller->getAll();
} elseif ($resource === 'references') {
    $controller = new ResourceController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action)
            echo $controller->getReferenceById($action);
        else
            echo $controller->getReferences();
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->createReference($input);
    if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action)
        echo $controller->updateReference($action, $input);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->deleteReference($action);
} elseif ($resource === 'learning') {
    $controller = new LearningController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action)
            echo $controller->getById($action);
        else
            echo $controller->getAll();
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->create($userId, $userName);
    if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action)
        echo $controller->update($action, $input, $userId, $userName);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->delete($action, $userId, $userName);
} elseif ($resource === 'cp') {
    include_once './controllers/CurriculumController.php';
    $controller = new CurriculumController();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $mapel = $_GET['mapel'] ?? 'Informatika';
        echo $controller->getCP($mapel);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $controller->saveCP($input, $userId, $userName);
    }
} elseif ($resource === 'tp') {
    include_once './controllers/CurriculumController.php';
    $controller = new CurriculumController();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Filters from query params
        $filters = [
            'mapel' => $_GET['mapel'] ?? null,
            'kelas' => $_GET['kelas'] ?? null,
            'semester' => $_GET['semester'] ?? null
        ];
        echo $controller->getTPs($filters);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $controller->createTP($input, $userId, $userName);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action) {
        echo $controller->updateTP($action, $input, $userId, $userName);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action) {
        echo $controller->deleteTP($action, $userId, $userName);
    }
} elseif ($resource === 'upload') {
    include_once './controllers/UploadController.php';
    $controller = new UploadController();
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->upload();
} elseif ($resource === 'settings') {
    include_once './controllers/SettingsController.php';
    $controller = new SettingsController();
    if ($action === 'logo' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!in_array($userRole, ['Admin', 'Super Admin'])) {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden - Admin Only"]);
        } else {
            echo $controller->uploadLogo();
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!in_array($userRole, ['Admin', 'Super Admin'])) {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden - Admin Only"]);
        } else {
            echo $controller->updateSettings($input, $userId, $userName);
        }
    } else {
        echo $controller->getSettings();
    }
} elseif ($resource === 'gallery') {
    include_once './controllers/GalleryController.php';
    $controller = new GalleryController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo $controller->getImages();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $controller->createImage($input);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action) {
        echo $controller->deleteImage($action);
    }
} elseif ($resource === 'members') {
    include_once './controllers/MemberController.php';
    $controller = new MemberController();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'duplicates') {
            if (in_array($userRole, ['Admin', 'Pengurus'])) {
                echo $controller->getDuplicates();
            } else {
                http_response_code(403);
                echo json_encode(["message" => "Forbidden"]);
            }
        } else {
            echo $controller->getAll();
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'merge') {
        if (in_array($userRole, ['Admin', 'Pengurus'])) {
            echo $controller->mergeDuplicate($input);
        } else {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($uri_parts[2]) && $uri_parts[2] === 'reset-password') {
        if (in_array($userRole, ['Admin', 'Pengurus'])) {
            echo $controller->resetPassword($action, $input);
        } else {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action) {
        // Update Member (Role, Name, Email)
        echo $controller->update($action, $input);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action) {
        echo $controller->delete($action);
    }

} elseif ($resource === 'premium') {
    include_once './controllers/PremiumController.php';
    $controller = new PremiumController();

    // AUTH CHECK
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');
    $token = str_replace('Bearer ', '', $authHeader);
    $userId = null;
    if ($token) {
        $payload = Helper::verifyJWT($token);
        if ($payload && isset($payload['sub'])) {
            $userId = $payload['sub'];
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'my-latest') {
        if ($userId)
            echo $controller->getMyLatest($userId);
        else {
            http_response_code(401);
            echo json_encode(["message" => "Unauthorized"]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
        if ($userId)
            echo $controller->create($userId, $input);
        else {
            http_response_code(401);
            echo json_encode(["message" => "Unauthorized"]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo $controller->getAllRequests();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'approve') {
        $id = $input['id'] ?? null;
        if ($id)
            echo $controller->approve($id);
        else {
            http_response_code(400);
            echo json_encode(["message" => "ID required"]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'reject') {
        $id = $input['id'] ?? null;
        if ($id)
            echo $controller->reject($id, $input);
        else {
            http_response_code(400);
            echo json_encode(["message" => "ID required"]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'active') {
        echo $controller->getActiveSubscribers();

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'revoke') {
        $id = $input['user_id'] ?? null;
        if ($id)
            echo $controller->revoke($id);
        else {
            http_response_code(400);
            echo json_encode(["message" => "User ID required"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action) {
        echo $controller->deleteRequest($action);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action) {
        echo $controller->updateRequest($action, $input);
    }

} elseif ($resource === 'bank-accounts') {
    include_once './controllers/BankController.php';
    $controller = new BankController();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'active') {
            echo $controller->getActive();
        } else {
            echo $controller->getAll();
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $controller->create($input);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action) {
        echo $controller->update($action, $input);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action) {
        echo $controller->delete($action);
    }

} elseif ($resource === 'contact') {
    include_once './controllers/ContactController.php';
    $controller = new ContactController();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $controller->saveMessage($input);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo $controller->getMessages();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action) {
        echo $controller->deleteMessage($action);
    }
} elseif ($resource === 'contributor') {
    include_once './controllers/ContributorController.php';
    $controller = new ContributorController();

    // AUTH CHECK
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');
    $token = str_replace('Bearer ', '', $authHeader);
    $userId = null;
    $userRole = null;

    if ($token) {
        $payload = Helper::verifyJWT($token);
        if ($payload && isset($payload['sub'])) {
            $userId = $payload['sub'];
            $userRole = ucfirst(strtolower($payload['role'] ?? 'Anggota'));
            if (in_array(strtolower($payload['role'] ?? ''), ['admin', 'super admin'])) {
                $userRole = 'Admin';
            }
        }
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(["message" => "Unauthorized"]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'status') {
        echo $controller->getStatus($userId);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'apply') {
        echo $controller->apply($userId);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'applications') {
        // Admin Only
        if ($userRole !== 'Admin') {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden - Access requires Admin role"]);
        } else {
            echo $controller->getAllApplications();
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'verify') {
        // Admin Only
        if ($userRole !== 'Admin') {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden"]);
        } else {
            echo $controller->verify($input);
        }
    }

} elseif ($resource === 'auth') {
    $auth = new AuthController();
    if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $auth->register($input);
    } elseif ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $auth->login($input);
    } elseif ($action === 'forgot-password' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $auth->forgotPassword($input);
    } elseif ($action === 'reset-password' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $auth->resetPassword($input);
    } elseif ($action === 'profile') {
        // Need to extract User ID from Token (Middleware replacement)
        // For now, allow passing ID or check Authorization header decoding
        // Simple approach: Frontend sends User ID in body or query param? 
        // Better: Decode token.

        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');
        $token = str_replace('Bearer ', '', $authHeader);

        if ($token) {
            try {
                // We need Helper included
                $payload = Helper::verifyJWT($token); // Need to verify Helper has verifyJWT (it usually does or we need to add it)
                // If Helper::verifyJWT is not static or doesn't exist, we might proceed with caution.
                // Assuming Helper::verifyJWT works or we trust client sending ID for now (NOT SECURE but MVP).
                // Let's implement Payload decoding in Helper if needed.

                // FALLBACK for MVP if Verify not ready: Trust input['id'] OR decode basic
                if (isset($payload['sub'])) {
                    $userId = $payload['sub'];
                    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                        echo $auth->updateProfile($userId, $input);
                    } else {
                        echo $auth->getProfile($userId);
                    }
                } else {
                    // Fallback: If VerifyJWT not implemented yet, check Helper.
                    // If not verified, return 401
                    http_response_code(401);
                    echo json_encode(["message" => "Unauthorized"]);
                }
            } catch (Exception $e) {
                http_response_code(401);
                echo json_encode(["message" => "Unauthorized"]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["message" => "No token provided"]);
        }

    } else {
        http_response_code(404);
        echo json_encode(["message" => "Endpoint not found"]);
    }
} elseif ($resource === 'training') {
    $training = new TrainingController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'settings') {
            echo $training->getSettings();
        } elseif ($action === 'registrations' && in_array($userRole, ['Admin', 'Pengurus'])) {
            echo $training->getRegistrations();
        } else {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden: Admin access required"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($action === 'register') {
            echo $training->register($input);
        } elseif ($action === 'settings' && in_array($userRole, ['Admin', 'Pengurus'])) {
            echo $training->updateSettings($input);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Endpoint not found"]);
        }
    }
} elseif ($resource === 'finances') {
    $controller = new FinanceController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'summary' && in_array($userRole, ['Admin', 'Pengurus'])) {
            echo $controller->getSummary();
        } elseif ($action === 'transactions' && in_array($userRole, ['Admin', 'Pengurus'])) {
            echo $controller->getTransactions();
        } else {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($action === 'add' && in_array($userRole, ['Admin', 'Pengurus'])) {
            echo $controller->addTransaction($input, $userId, $userName);
        } else {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action && in_array($userRole, ['Admin', 'Pengurus'])) {
        echo $controller->deleteTransaction($action, $userId, $userName);
    }
} elseif ($resource === 'projects') {
    $controller = new ProjectController();

    // Re-verify token because some endpoints need auth
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');
    $token = str_replace('Bearer ', '', $authHeader);
    $userId = null;
    $userRole = null;

    if ($token) {
        $payload = Helper::verifyJWT($token);
        if ($payload && isset($payload['sub'])) {
            $userId = $payload['sub'];
            $userRole = ucfirst(strtolower($payload['role'] ?? 'Anggota'));
            if (in_array(strtolower($payload['role'] ?? ''), ['admin', 'super admin'])) {
                $userRole = 'Admin';
            }
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'public') {
            echo $controller->getPublicProjects();
        } elseif ($action === 'my' && $userId) {
            echo $controller->getMyProjects($userId);
        } elseif ($action === 'all' && in_array($userRole, ['Admin', 'Pengurus'])) {
            echo $controller->getAllProjects();
        } else {
            http_response_code($userId ? 403 : 401);
            echo json_encode(["message" => "Unauthorized"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($userId) {
            echo $controller->createProject($userId, $input);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Unauthorized"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action) {
        if ($userId && !in_array($userRole, ['Admin', 'Pengurus'])) {
            echo $controller->updateProject($action, $userId, $input);
        } elseif (in_array($userRole, ['Admin', 'Pengurus']) && isset($input['status'])) {
            // Admin updating status
            echo $controller->updateStatus($action, $input['status']);
        } else {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action) {
        if ($userId) {
            echo $controller->deleteProject($action, $userId, $userRole);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Unauthorized"]);
        }
    }
} else {
    echo json_encode([
        "message" => "Welcome to MGMP V2 API",
        "resource" => $resource,
        "action" => $action
    ]);
}
?>