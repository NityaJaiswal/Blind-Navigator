#include "ultrasonic.h"

Ultrasonic::Ultrasonic(uint8_t trigPin, uint8_t echoPin) 
    : _trigPin(trigPin), _echoPin(echoPin), _timeoutUs(30000) {}

void Ultrasonic::init() {
    pinMode(_trigPin, OUTPUT);
    pinMode(_echoPin, INPUT);
    digitalWrite(_trigPin, LOW);
}

float Ultrasonic::readDistanceCm() {
    // Clear trigger pin
    digitalWrite(_trigPin, LOW);
    delayMicroseconds(2);
    
    // Send 10us HIGH pulse
    digitalWrite(_trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(_trigPin, LOW);
    
    // Measure pulse duration on echo pin (in microseconds)
    // pulseIn returns 0 if timeout reached
    long duration = pulseIn(_echoPin, HIGH, _timeoutUs);
    
    if (duration == 0) {
        // Return out of range fallback value
        return 400.0f; 
    }
    
    // Speed of sound is 343 m/s or 0.0343 cm/us
    // Distance = (duration * 0.0343) / 2
    float distance = (duration * 0.0343f) / 2.0f;
    
    // Bounds check to HC-SR04 specifications (2cm to 400cm)
    if (distance < 2.0f) return 2.0f;
    if (distance > 400.0f) return 400.0f;
    
    return distance;
}
