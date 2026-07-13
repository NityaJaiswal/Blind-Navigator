#ifndef ULTRASONIC_H
#define ULTRASONIC_H

#include <Arduino.h>

class Ultrasonic {
private:
    uint8_t _trigPin;
    uint8_t _echoPin;
    unsigned long _timeoutUs;

public:
    Ultrasonic(uint8_t trigPin, uint8_t echoPin);
    void init();
    float readDistanceCm();
};

#endif
