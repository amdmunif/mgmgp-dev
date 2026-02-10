<?php
// backend/controllers/UploadController.php

class UploadController
{
    public function upload()
    {
        // Ensure upload directory exists
        // Pointing to public_html/uploads (sibling of api folder)
        $uploadDir = __DIR__ . '/../../uploads/';
        if (!is_dir($uploadDir))
            mkdir($uploadDir, 0777, true);

        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '.' . $ext;

            if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadDir . $filename)) {
                return json_encode([
                    "message" => "Upload successful",
                    "url" => '/uploads/' . $filename // Accessed directly from root
                ]);
            }
        }

        http_response_code(400);
        return json_encode(["message" => "Upload failed or no file provided"]);
    }
}
?>