# ESP32 Blind Navigator Firmware

This subproject implements the firmware running on the ESP32 smart band. It reads distances from the HC-SR04 ultrasonic sensor, evaluates threats via a non-blocking state machine, updates the local haptic vibration motor, and advertises state data over Bluetooth Low Energy (BLE).

## Wiring Diagram

| Peripheral | ESP32 Pin | Note |
|------------|-----------|------|
| **HC-SR04 Trig** | GPIO 12 | Trigger pin, configured as Output |
| **HC-SR04 Echo** | GPIO 13 | Echo pulse reader, configured as Input |
| **Vibration Motor**| GPIO 14 | Digital Output (driver gate / active buzzer) |
| **Battery Divider** | GPIO 34 | Analog Input (voltage divider, ADC1_CH6) |
| **Power** | 5V / 3.3V & GND| Match sensor specifications |

> [!WARNING]
> HC-SR04 operates at 5V logic. Use a level-divider (e.g., 1k and 2k resistors) on the **Echo** line before linking to the ESP32 GPIO 13 to avoid damaging the pin with 5V logic signals.

## State Machine Logic

The state machine runs on a **75ms cycle** and evaluates obstacles:
*   **IDLE (State 0)**: No obstacles in range (>150cm). Haptic motor is off.
*   **MUTE (State 1)**: Static obstacles in range (50-100cm) or obstacles in 100-150cm range that are approaching slowly. Haptic motor pulses briefly once every 2 seconds.
*   **ALARM (State 2)**: Obstacles in range (50-100cm) that are approaching rapidly. Haptic motor pulses continuously at 300ms ON / 300ms OFF.
*   **OVERRIDE_STOP (State 3)**: Critical risk (<50cm). Haptic motor pulses urgently at 100ms ON / 100ms OFF.

## Building & Flashing

This project uses **PlatformIO**. You can build it using the PlatformIO IDE or CLI.

### CLI Instructions

```bash
# Navigate to firmware directory
cd blind-navigator/firmware

# Compile the project to check for errors
pio run

# Flash the binary to your connected ESP32
pio run --target upload

# Open the serial monitor to view debugging logs
pio device monitor
```
