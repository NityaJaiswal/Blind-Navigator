#include "alarm_state_machine.h"

AlarmStateMachine::AlarmStateMachine() 
    : _prevDistance(400.0f), _lastStateChange(0), _currentState(IDLE) {}

void AlarmStateMachine::init() {
    _prevDistance = 400.0f;
    _currentState = IDLE;
    _lastStateChange = millis();
}

AlarmState AlarmStateMachine::evaluate(float currentDistance, float deltaDistance) {
    AlarmState nextState = IDLE;

    if (currentDistance <= CRITICAL_THRESHOLD) {
        // Critical collision risk - Scenario C
        nextState = OVERRIDE_STOP;
    } 
    else if (currentDistance <= CLOSE_THRESHOLD) {
        // Close range obstacles - Scenario B
        if (deltaDistance <= APPROACH_FAST) {
            // Rapid approach: trigger active alarm
            nextState = ALARM;
        } else {
            // Static or slow approach: trigger mute state (tactile feedback but no audio spam)
            nextState = MUTE;
        }
    } 
    else if (currentDistance <= FAR_THRESHOLD) {
        // Far range obstacles - Scenario A
        if (deltaDistance <= APPROACH_SLOW) {
            // Approaching: trigger mute state (tactile notification)
            nextState = MUTE;
        } else {
            nextState = IDLE;
        }
    } 
    else {
        // No obstacle in range
        nextState = IDLE;
    }

    // Apply state change debouncing to prevent flickering (minimum 150ms in a state unless it's OVERRIDE_STOP)
    if (nextState != _currentState) {
        if (nextState == OVERRIDE_STOP || (millis() - _lastStateChange > 150)) {
            _currentState = nextState;
            _lastStateChange = millis();
        }
    }

    _prevDistance = currentDistance;
    return _currentState;
}
