#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Production Build for Main Domain..."

# 1. Clean previous build
rm -rf dist
rm -rf deploy

# 2. Build Frontend
echo "📦 Building Frontend..."
# Ensure we use the production environment variables
npm run build -- --mode production

# 3. Prepare Deploy Directory
echo "Pw Preparing Deploy Directory..."
mkdir -p deploy/public_html
mkdir -p deploy/public_html/api

# 4. Copy Frontend Files
echo "Tx Copying Frontend Files..."
cp -r dist/* deploy/public_html/
# Ensure .htaccess for React routing is copied
cp public/.htaccess deploy/public_html/

# 5. Copy Backend Files
echo "Tx Copying Backend Files..."
# Exclude sensitive or unnecessary files
rsync -av --progress backend/ deploy/public_html/api/ \
    --exclude node_modules \
    --exclude .git \
    --exclude .env \
    --exclude config/database.php \
    --exclude debug_dump.js \
    --exclude uploads/

# Copy backend .htaccess to api folder
cp backend/.htaccess deploy/public_html/api/

# 6. Create Placeholder for Database Config
echo "📝 Creating Database Config Placeholder..."
# We create a sample config so the user remembers to update it
cat > deploy/public_html/api/config/database.php <<EOF
<?php
class Database
{
    private \$host = "localhost";
    private \$db_name = "YOUR_DB_NAME"; // UPDATE THIS
    private \$username = "YOUR_DB_USER"; // UPDATE THIS
    private \$password = "YOUR_DB_PASS"; // UPDATE THIS
    public \$conn;

    public function getConnection()
    {
        \$this->conn = null;
        try {
            \$this->conn = new PDO("mysql:host=" . \$this->host . ";dbname=" . \$this->db_name, \$this->username, \$this->password);
            \$this->conn->exec("set names utf8");
            \$this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            \$this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException \$exception) {
            echo "Connection error: " . \$exception->getMessage();
        }
        return \$this->conn;
    }
}
?>
EOF

echo "✅ Build Complete!"
echo "📂 Upload the contents of 'deploy/public_html' to your server's public_html folder."
echo "⚠️  IMPORTANT: Edit 'api/config/database.php' on the server with your production credentials."
