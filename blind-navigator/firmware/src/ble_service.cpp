#include "ble_service.h"

class ServerCallbacks : public NimBLEServerCallbacks {
private:
    BLEServiceHandler* _handler;
public:
    ServerCallbacks(BLEServiceHandler* handler) : _handler(handler) {}
    
    void onConnect(NimBLEServer* pServer) override {
        _handler->setConnected(true);
        Serial.println("BLE Client connected!");
    }

    void onDisconnect(NimBLEServer* pServer) override {
        _handler->setConnected(false);
        Serial.println("BLE Client disconnected. Restarting advertising...");
        NimBLEDevice::startAdvertising();
    }
};

BLEServiceHandler::BLEServiceHandler() 
    : _pServer(nullptr), _pService(nullptr), _pCharacteristic(nullptr), _deviceConnected(false) {}

void BLEServiceHandler::initBLE() {
    // Initialize BLE device
    NimBLEDevice::init("ESP32-BlindNavigator");
    NimBLEDevice::setPower(ESP_PWR_LVL_P9); // Increase BLE power

    // Create GATT Server
    _pServer = NimBLEDevice::createServer();
    _pServer->setCallbacks(new ServerCallbacks(this));

    // Create Service
    _pService = _pServer->createService(SERVICE_UUID);

    // Create Characteristic (Read + Notify)
    _pCharacteristic = _pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );

    // Start Service
    _pService->start();

    // Start Advertising
    NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);  // helper for iOS connection delay
    pAdvertising->start();

    Serial.println("BLE service is advertising. Device Name: ESP32-BlindNavigator");
}

void BLEServiceHandler::updateCharacteristic(const BLEPayload& payload) {
    if (_pCharacteristic) {
        _pCharacteristic->setValue((uint8_t*)&payload, sizeof(BLEPayload));
        if (_deviceConnected) {
            _pCharacteristic->notify();
        }
    }
}
