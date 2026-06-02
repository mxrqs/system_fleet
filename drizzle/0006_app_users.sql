-- Migration: Create app_users table for local authentication
CREATE TABLE IF NOT EXISTS `app_users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `username` varchar(64) NOT NULL UNIQUE,
  `passwordHash` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `active` enum('yes','no') NOT NULL DEFAULT 'yes',
  `createdAt` timestamp NOT NULL DEFAULT NOW(),
  `updatedAt` timestamp NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  `lastSignedIn` timestamp NULL,
  INDEX `app_users_username_idx` (`username`)
);
