# easy-mysql-admin-mcp

一個高權限的 MySQL 管理型 MCP server，專門處理 database 與使用者/權限管理。

這個專案的定位是 DBA 類工具，不提供任意 SQL 執行，也不重複處理 table、view、index、trigger 這些已由 `easy-mysql-mcp` 提供的能力。

## 功能

- 列出、建立、檢視 database
- 列出、建立、修改 MySQL 使用者
- 授權與撤權
- 對危險刪除操作提供短效確認 token

## 可用工具

| 工具 | 說明 |
| --- | --- |
| `mysql_list_databases` | 列出目前 MySQL instance 內的 databases |
| `mysql_create_database` | 建立 database |
| `mysql_describe_database` | 檢視 database 的 charset 與 collation 設定 |
| `mysql_drop_database` | 提出刪除 database 的請求並回傳確認 token |
| `mysql_list_users` | 列出 MySQL users |
| `mysql_create_user` | 建立 MySQL user |
| `mysql_alter_user_password` | 修改 MySQL user 密碼 |
| `mysql_grant_privileges` | 對 user 授權 database privileges |
| `mysql_revoke_privileges` | 取消 user 的 database privileges |
| `mysql_show_grants` | 顯示指定 user 的 grants |
| `mysql_drop_user` | 提出刪除 user 的請求並回傳確認 token |
| `mysql_confirm_task` | 確認並執行先前產生的危險操作 token |

## 安全性

- 不提供原始 SQL passthrough
- 不處理 table、view、index、trigger 管理
- `DROP DATABASE` 與 `DROP USER` 一律要經過 `mysql_confirm_task`
- confirmation token 是隨機產生、只能使用一次、且會在短時間後過期

## 設定

請使用環境變數設定，風格與其他 `easy-*-mcp` 專案一致。

| 變數 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `MYSQL_HOST` | 是 | - | MySQL host name 或 IP address |
| `MYSQL_PORT` | 否 | `3306` | MySQL port |
| `MYSQL_USER` | 是 | - | MySQL 使用者名稱 |
| `MYSQL_PASSWORD` | 是 | - | MySQL 密碼 |
| `MYSQL_DATABASE` | 是 | - | 管理連線所使用的預設 database/schema |
| `MYSQL_CONNECTION_LIMIT` | 否 | `10` | pool 最大 active connections |
| `MYSQL_MAX_IDLE` | 否 | `10` | pool 最大 idle connections |
| `MYSQL_IDLE_TIMEOUT` | 否 | `60000` | idle connection timeout，單位毫秒 |
| `MYSQL_QUEUE_LIMIT` | 否 | `0` | 最大 queued connection requests |
| `MYSQL_WAIT_FOR_CONNECTIONS` | 否 | `true` | connection 滿時是否等待 |
| `MYSQL_ENABLE_KEEP_ALIVE` | 否 | `true` | 是否啟用 TCP keep-alive |
| `MYSQL_KEEP_ALIVE_INITIAL_DELAY` | 否 | `0` | TCP keep-alive 初始延遲，單位毫秒 |
| `MYSQL_ADMIN_TOKEN_TTL_SECONDS` | 否 | `120` | confirmation token 的有效秒數 |

## 範例

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=mysql
MYSQL_ADMIN_TOKEN_TTL_SECONDS=120
```

## Claude Desktop 範例

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

更新設定後，請重新啟動 Claude Desktop。

## 備註

- `mysql_drop_database` 與 `mysql_drop_user` 不會直接執行
- 這兩個動作會先產生 token，使用者確認後才會透過 `mysql_confirm_task` 真正執行
- token 是短效且單次使用，不會保留成長期 pending queue
