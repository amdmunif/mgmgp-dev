-- Ganti 'EMAIL_ANDA@GMAIL.COM' dengan email yang Anda gunakan untuk login
UPDATE public.profiles
SET role = 'Admin'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'EMAIL_ANDA@GMAIL.COM';
