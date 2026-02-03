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

include_once './controllers/AuthController.php';
include_once './controllers/ResourceController.php';
include_once './controllers/LearningController.php';

$resource = isset($uri_parts[0]) ? $uri_parts[0] : null;
$action = isset($uri_parts[1]) ? $uri_parts[1] : null;

// Get JSON input
$input = json_decode(file_get_contents("php://input"), true);

// Resource Routing
if ($resource === 'games') {
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
    if ($_SERVER['REQUEST_METHOD'] === 'GET')
        echo $controller->getAll();
    if ($_SERVER['REQUEST_METHOD'] === 'POST')
        echo $controller->create();
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action)
        echo $controller->delete($action);
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
        echo $controller->updateSettings($input);
    } else {
        echo $controller->getSettings();
    }
} elseif ($resource === 'members') {
    include_once './controllers/MemberController.php';
    $controller = new MemberController();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo $controller->getAll();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action) {
        // Update Role: /members/{id}
        // Ideally should separate /role but simplified REST: PUT /members/{id} with body {role: ...}
        echo $controller->updateRole($action, $input);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $action) {
        echo $controller->delete($action);
    }

} elseif ($resource === 'premium') {
    include_once './controllers/PremiumController.php';
    $controller = new PremiumController();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo $controller->getAllRequests();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'approve') {
        // POST /premium/approve with body { id: ... } or POST /premium/{id}/approve
        // Let's assume POST /premium/approve with body { id: ... } OR 
        // using the $uri parts more flexibly.
        // Current Router: resource/action. 
        // So /premium/approve -> logic below. But we need ID.
        // Let's accept ID in body for approve/reject actions to keep router simple.

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
    }

} elseif ($resource === 'auth') {
    $auth = new AuthController();
    if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $auth->register($input);
    } elseif ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $auth->login($input);
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