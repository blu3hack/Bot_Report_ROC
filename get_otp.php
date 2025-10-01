<?php
include 'Database/conn.php';
$apiToken = '7235593002:AAGjkzbxH-fCUYBXV6qXFoKGocUHIkh4XRo';
$lastUpdateId = 0;
$apiUrl = "https://api.telegram.org/bot$apiToken/getUpdates?timeout=30";

// Array untuk menyimpan status pending command per user (chat id)
$pendingCommands = [];

while (true) {
    $response = @file_get_contents($apiUrl . "&offset=" . ($lastUpdateId + 1));
    if ($response === false) {
        echo "Gagal terhubung ke API Telegram.\n";
        sleep(5);
        continue;
    }

    $updates = json_decode($response, true);
    if (!isset($updates['result'])) {
        echo "Respon API tidak sesuai.\n";
        continue;
    }

    foreach ($updates['result'] as $update) {
        $lastUpdateId = $update['update_id'];
        if (!isset($update['message']['text'], $update['message']['chat']['id'])) {
            continue;
        }

        $chatId   = $update['message']['chat']['id'];
        $username = $update['message']['chat']['username'] ?? 'Tidak ada username';
        $message  = $conn->real_escape_string($update['message']['text']);

        // Daftar command yang valid
        $command = ['perf_tif', 'q_hsi', 'sugar_hsi', 'ff_laten', 'unspec', 'valdat', 'pspi_hsi', 'wsa', 'testing', 'wsa_gamas'];

        if(in_array($message, $command)) {
            echo " Starting Process $message ....... \n";
            exec("node $message");
            echo " Processing $message Complete ....... \n";
        }else {
            echo "";
        }
    }
}
$conn->close();
?>
