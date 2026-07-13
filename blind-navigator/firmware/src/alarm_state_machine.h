#ifndef ALARM_STATE_MACHINE_H
#define ALARM_STATE_MACHINE_H

#include <Arduino.h>

enum AlarmState {
    IDLE = 0,
    MUTE = 1,
    ALARM = 2,
    OVERRIDE_STOP = 3
};

class AlarmStateMachine {
private:
    float _prevDistance;
    unsigned long _lastStateChange;
    AlarmState _currentState;

public:
    // Distance Thresholds in cm
    static constexpr float FAR_THRESHOLD = 150.0f;       // Scenario A trigger distance
    static constexpr float CLOSE_THRESHOLD = 100.0f;     // Scenario B trigger distance
    static constexpr float CRITICAL_THRESHOLD = 50.0f;   // Scenario C trigger distance
    
    // Delta approach speed thresholds (cm per cycle)
    static constexpr float APPROACH_FAST = -12.0f;      // Rapid approaching object
    static constexpr float APPROACH_SLOW = -4.0f;       // Slow approaching object

    AlarmStateMachine();
    void init();
    AlarmState evaluate(float currentDistance, float deltaDistance);
    AlarmState getCurrentState() const { return _currentState; }
};

#endif
