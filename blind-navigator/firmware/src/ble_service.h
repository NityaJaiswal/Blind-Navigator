#ifndef BLE_SERVICE_H
#define BLE_SERVICE_H

#include <Arduino.h>
#include <NimBLEDevice.h>

// Struct definition matching implementation plan payload
#pragma pack(push, 1)
struct BLEPayload {
    uint16_t distance_cm;
    int16_t delta_cm;
    uint8_t state;
    uint8_t battery_pct;
};
#pragma pack(pop)

class BLEServiceHandler {
private:
    NimBLEServer* _pServer;
    NimBLEService* _pService;
    NimBLECharacteristic* _pCharacteristic;
    bool _deviceConnected;

public:
    static constexpr const char* SERVICE_UUID = "d3b073ac-7b89-4bc2-89cd-df6a44ec2f6b";
    static constexpr const char* CHARACTERISTIC_UUID = "e4612445-5d15-4ae3-9d93-3dcb2955f114";

    BLEServiceHandler();
    void initBLE();
    void updateCharacteristic(const BLEPayload& payload);
    bool isConnected() const { return _deviceConnected; }
    void setConnected(bool connected) { _deviceConnected = connected; }
};

#endif
