#include <Arduino.h>
#include "ultrasonic.h"
#include "alarm_state_machine.h"
#include "ble_service.h"
#include "vibration.h"

// Pin configurations
#define TRIG_PIN 12
#define ECHO_PIN 13
#define VIBRATION_PIN 14
#define BATTERY_PIN 34 // ADC pin for monitoring battery divider (if wired)

// Timing constants
const unsigned long CYCLE_TIME_MS = 75;

// Objects instantiation
Ultrasonic ultrasonic(TRIG_PIN, ECHO_PIN);
AlarmStateMachine stateMachine;
BLEServiceHandler bleHandler;
VibrationMotor motor(VIBRATION_PIN);

// Global state variables
float lastDistance = 400.0f;
unsigned long lastCycleTime = 0;

uint8_t readBatteryPct() {
    // Battery monitoring simulation
    // Reads from BATTERY_PIN (analog read) or falls back to a high dummy charge if floating
    int raw = analogRead(BATTERY_PIN);
    if (raw == 0 || raw > 4095) {
        return 95; // default high backup level
    }
    
    // Assuming battery divider on 3.7V LiPo
    float voltage = (raw / 4095.0f) * 3.3f * 2.0f; // raw to voltage (times 2 for divider ratio)
    float pct = ((voltage - 3.4f) / (4.2f - 3.4f)) * 100.0f;
    
    if (pct > 100.0f) return 100;
    if (pct < 0.0f) return 0;
    return (uint8_t)pct;
}

void setup() {
    Serial.begin(115200);
    Serial.println("Blind Person Navigator - Firmware Starting...");

    // Initialize subsystems
    ultrasonic.init();
    stateMachine.init();
    motor.init();
    bleHandler.initBLE();

    lastCycleTime = millis();
    Serial.println("System fully initialized.");
}

void loop() {
    unsigned long currentMillis = millis();
    
    // Process vibration pattern in real-time (needs high frequency updates for short pulsing)
    motor.updatePattern(stateMachine.getCurrentState());
    
    // 75ms control cycle for reading sensor and evaluating states
    if (currentMillis - lastCycleTime >= CYCLE_TIME_MS) {
        lastCycleTime = currentMillis;
        
        // Read sensor
        float currentDistance = ultrasonic.readDistanceCm();
        
        // Calculate delta (approach rate)
        float delta = currentDistance - lastDistance;
        lastDistance = currentDistance;
        
        // Evaluate state machine
        AlarmState state = stateMachine.evaluate(currentDistance, delta);
        
        // Read battery status
        uint8_t battery = readBatteryPct();
        
        // Build and send BLE notify packet
        BLEPayload payload;
        payload.distance_cm = (uint16_t)currentDistance;
        payload.delta_cm = (int16_t)delta;
        payload.state = (uint8_t)state;
        payload.battery_pct = battery;
        
        bleHandler.updateCharacteristic(payload);
        
        // Debug prints
        static int debugCounter = 0;
        if (++debugCounter >= 10) { // Print every 750ms
            debugCounter = 0;
            Serial.printf("Dist: %.1fcm | Delta: %.1fcm | State: %d | Bat: %d%% | BLE: %s\n", 
                currentDistance, 
                delta, 
                (int)state, 
                battery, 
                bleHandler.isConnected() ? "CONNECTED" : "ADVERTISING"
            );
        }
    }
}
