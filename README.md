# easy-mysql-admin-mcp

High-privilege MySQL admin MCP server for database and user/grant management.

## Features

- List, create, and inspect databases
- List, create, and update users
- Grant and revoke privileges at database scope
- Protect destructive actions with short-lived confirmation tokens

## Available Tools

| Tool | Description |
| --- | --- |
| `mysql_list_databases` | List databases in the current MySQL instance |
| `mysql_create_database` | Create a database |
| `mysql_describe_database` | Inspect database charset and collation settings |
| `mysql_drop_database` | Request database deletion and return a confirmation token |
| `mysql_list_users` | List MySQL users |
| `mysql_create_user` | Create a MySQL user |
| `mysql_alter_user_password` | Change a MySQL user password |
| `mysql_grant_privileges` | Grant database privileges to a user |
| `mysql_revoke_privileges` | Revoke database privileges from a user |
| `mysql_show_grants` | Show grants for a user |
| `mysql_drop_user` | Request user deletion and return a confirmation token |
| `mysql_confirm_task` | Confirm and execute a destructive action token |

## Safety

- No raw SQL passthrough
- No table, view, index, or trigger management
- `DROP DATABASE` and `DROP USER` require `mysql_confirm_task`
- Confirmation tokens are random, single-use, and expire quickly

## Configuration

Use environment variables, matching the rest of the `easy-*-mcp` family.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MYSQL_HOST` | Yes | - | MySQL host name or IP address |
| `MYSQL_PORT` | No | `3306` | MySQL port |
| `MYSQL_USER` | Yes | - | MySQL user name |
| `MYSQL_PASSWORD` | Yes | - | MySQL password |
| `MYSQL_DATABASE` | Yes | - | Default database/schema used for the admin connection |
| `MYSQL_CONNECTION_LIMIT` | No | `10` | Maximum number of active pool connections |
| `MYSQL_MAX_IDLE` | No | `10` | Maximum number of idle pool connections |
| `MYSQL_IDLE_TIMEOUT` | No | `60000` | Idle connection timeout in milliseconds |
| `MYSQL_QUEUE_LIMIT` | No | `0` | Maximum queued connection requests |
| `MYSQL_WAIT_FOR_CONNECTIONS` | No | `true` | Whether the pool waits when all connections are busy |
| `MYSQL_ENABLE_KEEP_ALIVE` | No | `true` | Whether TCP keep-alive is enabled |
| `MYSQL_KEEP_ALIVE_INITIAL_DELAY` | No | `0` | Initial TCP keep-alive delay in milliseconds |
| `MYSQL_ADMIN_TOKEN_TTL_SECONDS` | No | `120` | Confirmation token lifetime in seconds |

## Example

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=mysql
MYSQL_ADMIN_TOKEN_TTL_SECONDS=120
```

## Claude Desktop Example

```json
{
  "mcpServers": {
    "easy-mysql-admin-mcp": {
      "command": "npx",
      "args": ["-y", "easy-mysql-admin-mcp"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "mysql",
        "MYSQL_ADMIN_TOKEN_TTL_SECONDS": "120"
      }
    }
  }
}
```
