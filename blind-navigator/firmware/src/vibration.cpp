#include "vibration.h"

VibrationMotor::VibrationMotor(uint8_t pin) 
    : _pin(pin), _lastUpdate(0), _motorState(false) {}

void VibrationMotor::init() {
    pinMode(_pin, OUTPUT);
    digitalWrite(_pin, LOW);
}

void VibrationMotor::updatePattern(AlarmState state) {
    unsigned long now = millis();
    
    switch (state) {
        case IDLE:
            _motorState = false;
            digitalWrite(_pin, LOW);
            break;
            
        case MUTE:
            // Subtle notification: 80ms buzz every 2 seconds
            if (_motorState) {
                if (now - _lastUpdate >= 80) {
                    _motorState = false;
                    digitalWrite(_pin, LOW);
                    _lastUpdate = now;
                }
            } else {
                if (now - _lastUpdate >= 1920) {
                    _motorState = true;
                    digitalWrite(_pin, HIGH);
                    _lastUpdate = now;
                }
            }
            break;
            
        case ALARM:
            // Medium warning: 300ms on, 300ms off
            if (now - _lastUpdate >= 300) {
                _motorState = !_motorState;
                digitalWrite(_pin, _motorState ? HIGH : LOW);
                _lastUpdate = now;
            }
            break;
            
        case OVERRIDE_STOP:
            // Urgent warning: 100ms on, 100ms off
            if (now - _lastUpdate >= 100) {
                _motorState = !_motorState;
                digitalWrite(_pin, _motorState ? HIGH : LOW);
                _lastUpdate = now;
            }
            break;
            
        default:
            digitalWrite(_pin, LOW);
            break;
    }
}
