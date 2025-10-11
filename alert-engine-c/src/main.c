#include "include/alert_engine.h"
#include <stdio.h>
#include <signal.h>
#include <unistd.h>

static volatile bool running = true;

void signal_handler(int sig) {
    printf("\nReceived signal %d, shutting down...\n", sig);
    running = false;
}

int main(void) {
    printf("Starting Alert Engine C Server...\n");
    
    // Установка обработчиков сигналов
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    
    // Инициализация Alert Engine
    if (alert_engine_init() != 0) {
        printf("Failed to initialize Alert Engine\n");
        return 1;
    }
    
    printf("Alert Engine started successfully!\n");
    printf("HTTP API: http://localhost:8090\n");
    printf("WebSocket: ws://localhost:8081\n");
    printf("Press Ctrl+C to stop\n\n");
    
    // Основной цикл
    while (running) {
        sleep(1);
    }
    
    printf("\nShutting down Alert Engine...\n");
    alert_engine_cleanup();
    printf("Alert Engine stopped.\n");
    
    return 0;
}