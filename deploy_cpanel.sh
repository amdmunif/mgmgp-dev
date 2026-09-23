#!/bin/bash
echo "Building Frontend..."
npm run build

echo "Preparing cPanel Directory..."
rm -rf cpanel_deploy
mkdir cpanel_deploy

echo "Copying Frontend Files..."
cp -r dist/* cpanel_deploy/
cp dist/.htaccess cpanel_deploy/ 2>/dev/null || true

echo "Copying Backend Files..."
mkdir cpanel_deploy/api
rsync -av --exclude='.git*' --exclude='node_modules/' --exclude='.env' --exclude='database.php' --exclude='uploads/' backend/ cpanel_deploy/api/

echo "Creating deploy.zip..."
cd cpanel_deploy
zip -r ../deploy.zip .
cd ..

echo "Cleaning up..."
rm -rf cpanel_deploy

echo "✅ deploy.zip is ready to be uploaded to cPanel!"
