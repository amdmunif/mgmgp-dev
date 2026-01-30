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
} elseif ($resource === 'auth') {
    $auth = new AuthController();
    if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $auth->register($input);
    } elseif ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo $auth->login($input);
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