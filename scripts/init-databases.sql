-- Create separate databases for each service
CREATE DATABASE n8n;
CREATE DATABASE chatwoot;
CREATE DATABASE calcom;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE n8n TO crm;
GRANT ALL PRIVILEGES ON DATABASE chatwoot TO crm;
GRANT ALL PRIVILEGES ON DATABASE calcom TO crm;
