-- Fix access_token column to support v2 tokens
-- V1 tokens: 6-8 characters
-- V2 tokens: 43+ characters

ALTER TABLE share_links 
MODIFY COLUMN access_token VARCHAR(255) NOT NULL;

-- Verify the change
DESCRIBE share_links;