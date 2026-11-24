-- Local development only: lets the app's role log in with a known, fake password.
-- Migrations create the roles without login (they never hold a password, ADR 0012).
-- In CI and production the password is set outside the repo.
create role fairy_app login password 'fairy_app_local';
create role fairy_admin login password 'fairy_admin_local';
