#ifndef VIBRATION_H
#define VIBRATION_H

#include <Arduino.h>
#include "alarm_state_machine.h"

class VibrationMotor {
private:
    uint8_t _pin;
    unsigned long _lastUpdate;
    bool _motorState;

public:
    VibrationMotor(uint8_t pin);
    void init();
    void updatePattern(AlarmState state);
};

#endif
