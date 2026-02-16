<?php
// backend/controllers/UploadController.php

class UploadController
{
    public function upload()
    {
        // Default upload directory
        $baseUploadDir = __DIR__ . '/../../uploads/';
        $targetDir = $baseUploadDir;
        $folderParam = '';

        // Check for specific folder in POST request
        if (isset($_POST['folder'])) {
            // Sanitize folder path to prevent directory traversal
            $folder = trim($_POST['folder'], '/');
            // Allow alphanumeric, underscores, hyphens, and forward slashes
            $folder = preg_replace('/[^a-zA-Z0-9\/_\-]/', '', $folder);

            if (!empty($folder)) {
                $targetDir = $baseUploadDir . $folder . '/';
                $folderParam = $folder . '/';
            }
        }

        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '.' . $ext;

            if (move_uploaded_file($_FILES['file']['tmp_name'], $targetDir . $filename)) {
                return json_encode([
                    "message" => "Upload successful",
                    "url" => '/uploads/' . $folderParam . $filename // Accessed directly from root
                ]);
            }
        }

        http_response_code(400);
        return json_encode(["message" => "Upload failed or no file provided"]);
    }
}
?>