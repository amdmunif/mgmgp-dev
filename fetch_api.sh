#!/bin/bash
TOKEN=$(curl -s -X POST https://mgmpinformatika-wsb.my.id/api/auth/login -H "Content-Type: application/json" -d '{"email":"ahmadmunif.wsb@gmail.com","password":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    echo "Login failed. You need to use your actual password in this script."
    exit 1
fi
echo "Got token: $TOKEN"
curl -s -X GET https://mgmpinformatika-wsb.my.id/api/contributor/applications -H "Authorization: Bearer $TOKEN"
