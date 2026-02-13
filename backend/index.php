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

include_once './controllers/AuthController.php';
include_once './controllers/ResourceController.php';
include_once './controllers/LearningController.php';

$resource = isset($uri_parts[0]) ? $uri_parts[0] : null;
$action = isset($uri_parts[1]) ? $uri_parts[1] : null;

// Get JSON input
$input = json_decode(file_get_contents("php://input"), true);

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
        $userRole = $payload['role'] ?? 'Anggota';
    }
}

include_once './controllers/ContentController.php';
include_once './controllers/QuestionController.php';
include_once './controllers/LetterController.php';
include_once './controllers/StatsController.php';

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

} elseif ($resource === 'events') {
    $controller = new ContentController();

    // Auth Check
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
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
        } elseif ($action) {
            echo $controller->getEventDetail($action);
        } else {
            echo $controller->getEvents();
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
        } elseif ($action && $subAction === 'submit-task') {
            $taskUrl = $input['task_url'] ?? '';
            if ($userId)
                echo $controller->submitTask($action, $userId, $taskUrl);
            else {
                http_response_code(401);
                echo json_encode(["message" => "Unauthorized"]);
            }
        } else {
            echo $controller->createEvent($input, $userId, $userName);
        }
    }
    if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action) {
        echo $controller->updateEvent($action, $input, $userId, $userName);
    }
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->deleteEvent($action, $userId, $userName);

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
        echo $controller->createGame($input);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->deleteGame($action);
} elseif ($resource === 'prompts') {
    $controller = new ResourceController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET')
        echo $controller->getPrompts();
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->createPrompt($input);
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->deletePrompt($action);
} elseif ($resource === 'logs') {
    include_once './controllers/AuditController.php';
    $controller = new AuditController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET')
        echo $controller->getAll();
} elseif ($resource === 'references') {
    $controller = new ResourceController();
    if ($_SERVER['REQUEST_METHOD'] === 'GET')
        echo $controller->getReferences();
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->createReference($input);
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
        echo $controller->uploadLogo();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $controller->updateSettings($input, $userId, $userName);
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
        echo $controller->getAll();
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
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
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
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    $token = str_replace('Bearer ', '', $authHeader);
    $userId = null;
    $userRole = null;

    if ($token) {
        $payload = Helper::verifyJWT($token);
        if ($payload && isset($payload['sub'])) {
            $userId = $payload['sub'];
            $userRole = $payload['role'] ?? 'Anggota';
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
            echo json_encode(["message" => "Forbidden"]);
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
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
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
} else {
    echo json_encode([
        "message" => "Welcome to MGMP V2 API",
        "resource" => $resource,
        "action" => $action
    ]);
}
?>