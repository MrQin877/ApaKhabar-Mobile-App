<?php
// Read-only: no Laravel bootstrap, migrations, writes, account access, or service startup.
$backend = dirname(__DIR__, 2).'/ApaKhabar-Intelligence-Information-News-Management-System';
$result = ['php' => PHP_VERSION];
try {
    require $backend.'/vendor/autoload.php';
    $result['laravel'] = Illuminate\Foundation\Application::VERSION;
    $env = Dotenv\Dotenv::parse(file_get_contents($backend.'/.env'));
    $cached = is_file($backend.'/bootstrap/cache/config.php') ? require $backend.'/bootstrap/cache/config.php' : null;
    $connection = $cached['database']['default'] ?? $env['DB_CONNECTION'] ?? 'mysql';
    $config = $cached['database']['connections'][$connection] ?? [];
    $host = $config['host'] ?? $env['DB_HOST'] ?? '127.0.0.1';
    $port = $config['port'] ?? $env['DB_PORT'] ?? '3306';
    $database = $config['database'] ?? $env['DB_DATABASE'] ?? '';
    $result['database'] = ['connection' => $connection, 'host' => $host, 'port' => $port, 'database' => $database];
    $result['config_cached'] = $cached !== null;
    $result['moderation_key_configured'] = !empty($env['OPENAI_API_KEY']);
    if ($connection === 'mysql' || $connection === 'mariadb') {
        try {
            $pdo = new PDO('mysql:host='.$host.';port='.$port.';dbname='.$database.';charset=utf8mb4',
                $config['username'] ?? $env['DB_USERNAME'] ?? '', $config['password'] ?? $env['DB_PASSWORD'] ?? '',
                [PDO::ATTR_TIMEOUT => 2, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $result['database']['reachable'] = true;
            $pdo->exec('SET TRANSACTION READ ONLY');
            $pdo->beginTransaction();
            $counts = [];
            foreach (['news', 'comments', 'broadcasts', 'news_categories', 'users'] as $table) {
                $counts[$table] = (int) $pdo->query('SELECT COUNT(*) FROM `'.$table.'`')->fetchColumn();
            }
            $pdo->rollBack();
            $result['counts'] = $counts;
        } catch (PDOException $error) {
            $result['database']['reachable'] = false;
            $result['database']['error_code'] = $error->errorInfo[1] ?? $error->getCode();
            // Omit exception text and credentials.
        }
    }
} catch (Throwable $error) {
    $result['runtime_error_type'] = get_class($error);
}
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
