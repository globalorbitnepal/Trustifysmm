<?php
/**
 * TrustifySMM — Full PHP API + Banker client
 * Download from: https://trustifysmm.com/api
 *
 * Requirements: PHP 7.4+ with cURL enabled
 */

declare(strict_types=1);

final class TrustifySmmApi
{
    private string $apiUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct(string $apiKey, ?string $apiUrl = null, int $timeout = 60)
    {
        $this->apiKey = $apiKey;
        $this->apiUrl = $apiUrl ?? 'https://trustifysmm.com/api/v2';
        $this->timeout = $timeout;
    }

    /**
     * @return array<int, array<string, mixed>>|array{error: string}
     */
    public function services(): array
    {
        return $this->call(['action' => 'services']);
    }

    /**
     * @return array{balance?: string, currency?: string, error?: string}
     */
    public function balance(): array
    {
        return $this->call(['action' => 'balance']);
    }

    /**
     * @return array{order?: int, error?: string}
     */
    public function add(int $serviceId, string $link, int $quantity, array $extra = []): array
    {
        $params = array_merge(
            [
                'action' => 'add',
                'service' => (string) $serviceId,
                'link' => $link,
                'quantity' => (string) $quantity,
            ],
            $extra
        );
        return $this->call($params);
    }

    /**
     * @return array<string, mixed>
     */
    public function status(int $orderId): array
    {
        return $this->call(['action' => 'status', 'order' => (string) $orderId]);
    }

    /**
     * @param int[] $orderIds
     * @return array<string, mixed>
     */
    public function multiStatus(array $orderIds): array
    {
        $ids = implode(',', array_map('intval', $orderIds));
        return $this->call(['action' => 'multi_status', 'orders' => $ids]);
    }

    /**
     * Create banker invoice (balance top-up).
     *
     * @return array<string, mixed>
     */
    public function createInvoice(float $amountUsd, ?string $bankerUrl = null): array
    {
        $url = $bankerUrl ?? preg_replace('#/api/v2$#', '/api/banker/invoice', $this->apiUrl);
        if ($url === $this->apiUrl) {
            $url = 'https://trustifysmm.com/api/banker/invoice';
        }

        $payload = json_encode(['key' => $this->apiKey, 'amount' => $amountUsd], JSON_THROW_ON_ERROR);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        ]);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false) {
            return ['error' => 'Banker request failed'];
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return ['error' => 'Invalid banker JSON', 'http_code' => $code];
        }
        return $data;
    }

    /**
     * Invoice status for a Banker top-up. Requires the reseller API key.
     *
     * The API key is sent in the `x-api-key` header — never in the query string, so it does
     * not leak into access logs, proxy logs or Referer headers.
     *
     * @return array<string, mixed>
     */
    public function invoiceStatus(string $invoiceId, ?string $statusUrl = null): array
    {
        $base = $statusUrl ?? preg_replace('#/api/v2$#', '/api/banker/status', $this->apiUrl);
        if ($base === $this->apiUrl) {
            $base = 'https://trustifysmm.com/api/banker/status';
        }
        $url = $base . '?id=' . rawurlencode($invoiceId);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'x-api-key: ' . $this->apiKey,
            ],
        ]);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false) {
            return ['error' => 'Status request failed'];
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return ['error' => 'Invalid status JSON', 'http_code' => $code];
        }
        if ($code === 401) {
            return ['error' => 'API key rejected by /api/banker/status', 'http_code' => 401];
        }
        if ($code === 404) {
            return ['error' => 'Invoice not found for this API key', 'http_code' => 404];
        }
        return $data;
    }

    /**
     * @param array<string, string> $params
     * @return array<string, mixed>
     */
    private function call(array $params): array
    {
        $params['key'] = $this->apiKey;
        $body = http_build_query($params);

        $ch = curl_init($this->apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        ]);
        $raw = curl_exec($ch);
        curl_close($ch);

        if ($raw === false) {
            return ['error' => 'API request failed'];
        }

        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        return ['error' => 'Invalid JSON from API', 'raw' => $raw];
    }
}

// ——— Example usage (remove or protect in production) ———

if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['argv'][0] ?? '')) {
    $key = getenv('TRUSTIFY_API_KEY') ?: 'YOUR_API_KEY';
    $api = new TrustifySmmApi($key, getenv('TRUSTIFY_API_URL') ?: 'https://trustifysmm.com/api/v2');

    echo "Balance:\n";
    print_r($api->balance());

    echo "\nFirst 2 services (truncated):\n";
    $services = $api->services();
    print_r(array_slice(is_array($services) ? $services : [], 0, 2));

    // $invoice = $api->createInvoice(10.0);
    // print_r($invoice);
}