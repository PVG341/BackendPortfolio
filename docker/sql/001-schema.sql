CREATE SCHEMA demo;

CREATE TABLE demo.users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username text NOT NULL UNIQUE,
  role text NOT NULL
);

INSERT INTO demo.users (username, role) VALUES
  ('alice', 'admin'),
  ('bob', 'engineer'),
  ('charlie', 'viewer');

REVOKE ALL ON DATABASE portfolio_demo FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

\getenv reader_password POSTGRES_DEMO_READER_PASSWORD

CREATE ROLE portfolio_demo_reader LOGIN PASSWORD :'reader_password'
  CONNECTION LIMIT 4;

GRANT CONNECT ON DATABASE portfolio_demo TO portfolio_demo_reader;
GRANT USAGE ON SCHEMA demo TO portfolio_demo_reader;
GRANT SELECT ON demo.users TO portfolio_demo_reader;

ALTER ROLE portfolio_demo_reader SET default_transaction_read_only = on;
ALTER ROLE portfolio_demo_reader SET statement_timeout = '250ms';
ALTER ROLE portfolio_demo_reader SET lock_timeout = '250ms';
ALTER ROLE portfolio_demo_reader SET idle_in_transaction_session_timeout = '2s';
ALTER ROLE portfolio_demo_reader SET search_path = demo, pg_catalog;