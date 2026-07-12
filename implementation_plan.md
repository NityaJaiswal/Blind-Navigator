# Blind Person Navigator — MVP Implementation Plan

Build a production-grade monorepo (`blind-navigator/`) with **four subprojects**: backend (FastAPI), firmware (ESP32/PlatformIO), mobile app (React Native), and caregiver web dashboard (React JS). The build follows the order specified in the brief: backend → firmware → mobile app → web dashboard.

---

## User Review Required

> [!IMPORTANT]
> **MongoDB connection**: The plan assumes MongoDB is running locally on your machine on port 27017 (e.g., as a local Windows service or via MongoDB Atlas). Confirm you have MongoDB installed and running or have a connection URI.

> [!IMPORTANT]
> **React Native**: The mobile app will be scaffolded with Expo (managed workflow) for faster iteration. If you need a bare React Native CLI project instead (e.g., for native module linking), let me know before I start.

> [!WARNING]
> **TFLite model file**: The mobile app needs a `.tflite` model (e.g., COCO SSD MobileNet). I'll structure the detection module to accept any model file, and add a placeholder path + download instructions in the README. I will **not** download the model file automatically — you'll drop it into `mobile-app/assets/models/` yourself.

> [!WARNING]
> **BLE on iOS/Android**: `react-native-ble-plx` requires native permissions and real hardware to test. The app will compile and the BLE module will be structured correctly, but actual BLE testing needs a physical device + the ESP32 band.

---

## Open Questions

1. **Auth scope**: Should caregivers and users share the same login flow, or should caregivers have a separate registration endpoint? The plan assumes a single `/auth/register` with a `role` field (`"user"` or `"caregiver"`).
2. **Dashboard auth**: Should the web dashboard use the same JWT auth as the mobile app? Plan assumes yes.
3. **Expo vs bare RN**: Expo managed workflow is faster to scaffold but limits some native modules. Confirm Expo is acceptable.
4. **Node.js / Python versions**: Plan assumes Node 18+ and Python 3.11+. Confirm these are available on your machine.

---

## Proposed Changes

### Overview of Build Order

| Phase | Subproject | Key Deliverables |
|-------|-----------|-----------------|
| 1 | **Backend** | FastAPI + Motor, JWT auth, all CRUD routers, local setup instructions, seed script |
| 2 | **Firmware** | PlatformIO C++ project, ultrasonic + state machine + BLE GATT + vibration motor |
| 3 | **Mobile App** | React Native/Expo, BLE client, TFLite detection module, color detection, alarm handler, TTS, REST client, 3 screens |
| 4 | **Web Dashboard** | React (Vite), login, sessions list/detail, summary page with charts |

---

### Phase 1 — Backend (FastAPI + MongoDB)

Async FastAPI application using Motor for MongoDB, with JWT auth, five collection routers, and a dashboard aggregation endpoint.

#### [NEW] [.env](file:///c:/Users/nitya/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/.env)
- `MONGO_URI=mongodb://localhost:27017/blind_navigator`
- `JWT_SECRET=change-me-in-production`
- `JWT_ALGORITHM=HS256`

#### [NEW] [backend/requirements.txt](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/backend/requirements.txt)
- fastapi, uvicorn, motor, pydantic[email], python-jose[cryptography], passlib[bcrypt], python-dotenv

#### [NEW] [backend/app/main.py](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/backend/app/main.py)
- FastAPI app factory with CORS middleware, lifespan event for Mongo connection, router includes

#### [NEW] [backend/app/core/config.py](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/backend/app/core/config.py)
- Pydantic `Settings` class loading from `.env`: MONGO_URI, JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

#### [NEW] [backend/app/core/security.py](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/backend/app/core/security.py)
- `hash_password()`, `verify_password()` (passlib bcrypt)
- `create_access_token()`, `decode_access_token()` (python-jose)
- `get_current_user()` dependency (extracts user from JWT Bearer token)

#### [NEW] [backend/app/db/mongo.py](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/backend/app/db/mongo.py)
- Motor async client singleton, `get_database()` helper, index creation on startup (compound indexes on `sessions.user_id+timestamp`, `detection_events.session_id+timestamp`, `alerts.session_id+timestamp`)

#### [NEW] [backend/app/models/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/backend/app/models/) (Pydantic v2 schemas)
- `user.py` — UserCreate, UserResponse, UserInDB
- `device.py` — DeviceCreate, DeviceResponse
- `session.py` — SessionCreate, SessionResponse
- `detection.py` — DetectionCreate, DetectionResponse
- `alert.py` — AlertCreate, AlertResponse (scenario enum: A/B/C, action_taken enum)
- `auth.py` — TokenResponse, LoginRequest

#### [NEW] [backend/app/routers/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/backend/app/routers/)
- `auth.py` — POST `/auth/register`, POST `/auth/login`
- `devices.py` — POST `/devices`, GET `/devices/{id}`
- `sessions.py` — POST `/sessions/start`, POST `/sessions/{id}/end`
- `detections.py` — POST `/detections`, GET `/detections?session_id=`
- `alerts.py` — POST `/alerts`, GET `/alerts?session_id=&from=&to=`
- `dashboard.py` — GET `/dashboard/summary?user_id=` (aggregation pipeline: alert counts by scenario, top-N detected objects)

#### [NEW] [backend/seed.py](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/backend/seed.py)
- Async script that inserts demo user, device, session, sample detections and alerts

---

### Phase 2 — Firmware (ESP32 / PlatformIO C++)

PlatformIO project targeting ESP32 with NimBLE-Arduino for BLE, HC-SR04 ultrasonic reading, Scenario A/B/C state machine, and vibration motor control.

#### [NEW] [firmware/platformio.ini](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/platformio.ini)
- Board: `esp32dev`, framework: arduino, lib_deps: NimBLE-Arduino
- Monitor speed 115200

#### [NEW] [firmware/src/main.cpp](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/src/main.cpp)
- `setup()`: init serial, ultrasonic pins, vibration pin, BLE service
- `loop()`: 75ms cycle — read ultrasonic, compute delta, run state machine, drive motor, update BLE characteristic

#### [NEW] [firmware/src/ultrasonic.h](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/src/ultrasonic.h) / [ultrasonic.cpp](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/src/ultrasonic.cpp)
- `init(trigPin, echoPin)`, `readDistanceCm()` — pulse timing with timeout guard

#### [NEW] [firmware/src/alarm_state_machine.h](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/src/alarm_state_machine.h) / [alarm_state_machine.cpp](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/src/alarm_state_machine.cpp)
- Named constants: `STILL_THRESHOLD`, `WALK_DROP_THRESHOLD`, `RAPID_DROP_THRESHOLD`
- `enum AlarmState { IDLE, MUTE, ALARM, OVERRIDE_STOP }`
- `AlarmState evaluate(float distance, float delta, bool footstep)` — pure logic, easily unit-testable

#### [NEW] [firmware/src/ble_service.h](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/src/ble_service.h) / [ble_service.cpp](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/src/ble_service.cpp)
- NimBLE GATT server with one service UUID and one notify characteristic
- Payload struct: `{ uint16_t distance_cm, int16_t delta_cm, uint8_t state, uint8_t battery_pct }`
- `initBLE()`, `updateCharacteristic(payload)`

#### [NEW] [firmware/src/vibration.h](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/src/vibration.h) / [vibration.cpp](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/src/vibration.cpp)
- `initMotor(pin)`, `drivePattern(AlarmState)` — off for IDLE/MUTE, steady pulse for ALARM, rapid buzz for OVERRIDE_STOP

#### [NEW] [firmware/README.md](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/firmware/README.md)
- Wiring diagram (text), pin assignments, build/flash instructions, threshold tuning guide

---

### Phase 3 — Mobile App (React Native / Expo)

#### [NEW] Expo project scaffolded in `mobile-app/`
- `npx -y create-expo-app@latest ./` with TypeScript template

#### [NEW] [mobile-app/src/ble/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/mobile-app/src/ble/)
- `BleManager.ts` — scan, connect, subscribe to GATT characteristic, parse payload into `{ distance_cm, delta_cm, state, battery_pct }`
- `bleConstants.ts` — service/characteristic UUIDs (matching firmware)

#### [NEW] [mobile-app/src/detection/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/mobile-app/src/detection/)
- `ObjectDetector.ts` — loads TFLite model from assets, runs inference on camera frame, returns `{ label, confidence, boundingBox }`
- `modelConfig.ts` — model path, label map, confidence threshold (swap-friendly)
- `ColorDetector.ts` — given a bounding box region, samples dominant color and returns a human-readable name

#### [NEW] [mobile-app/src/tts/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/mobile-app/src/tts/)
- `TtsEngine.ts` — wraps `expo-speech`: `speak(text)`, `interrupt()`, `setRate()`, `setVoice()`

#### [NEW] [mobile-app/src/alarmHandler/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/mobile-app/src/alarmHandler/)
- `AlarmHandler.ts` — consumes BLE state:
  - MUTE → no-op
  - ALARM → trigger detection, build sentence, speak, POST to backend
  - OVERRIDE_STOP → interrupt speech, speak "Stop!", POST alert

#### [NEW] [mobile-app/src/api/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/mobile-app/src/api/)
- `client.ts` — axios/fetch wrapper with JWT Bearer header
- `auth.ts`, `devices.ts`, `sessions.ts`, `detections.ts`, `alerts.ts` — typed REST functions

#### [NEW] [mobile-app/src/screens/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/mobile-app/src/screens/)
- `HomeScreen.tsx` — BLE connection status indicator, live distance readout, current state badge, session start/stop button
- `SessionHistoryScreen.tsx` — list of past sessions from backend
- `SettingsScreen.tsx` — BLE device pairing, TTS voice/speed picker, backend URL config

#### [NEW] [mobile-app/src/navigation/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/mobile-app/src/navigation/)
- Tab navigator (Home / History / Settings)

#### [NEW] [mobile-app/assets/models/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/mobile-app/assets/models/)
- `.gitkeep` + README with download instructions for COCO SSD MobileNet .tflite

---

### Phase 4 — Web Dashboard (React + Vite)

#### [NEW] Vite React project scaffolded in `web-dashboard/`
- `npx -y create-vite@latest ./ --template react`

#### [NEW] [web-dashboard/src/pages/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/web-dashboard/src/pages/)
- `LoginPage.jsx` — email/password form, calls `/auth/login`, stores JWT
- `SessionsPage.jsx` — paginated list of sessions for the logged-in user
- `SessionDetailPage.jsx` — timeline of detections + alerts for a single session
- `SummaryPage.jsx` — alert counts by scenario (bar/pie chart), most frequently detected objects (bar chart), using `/dashboard/summary`

#### [NEW] [web-dashboard/src/components/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/web-dashboard/src/components/)
- `Navbar.jsx`, `SessionCard.jsx`, `TimelineEvent.jsx`, `ChartCard.jsx`, `ProtectedRoute.jsx`

#### [NEW] [web-dashboard/src/api/](file:///c:/Users/Asif/OneDrive/Desktop/BLIND%20AI%20APP/blind-navigator/web-dashboard/src/api/)
- `client.js` — fetch wrapper with JWT
- `auth.js`, `sessions.js`, `detections.js`, `alerts.js`, `dashboard.js`

#### Design Direction
- Dark theme with glassmorphism cards
- Color palette: deep navy (#0a0e27) background, electric blue (#4f8cff) accents, warm amber (#ffb347) for alerts
- Google Font: Inter
- Smooth transitions, subtle hover effects, micro-animations on data load
- Responsive layout (CSS Grid + Flexbox)
- Charts via lightweight canvas library (Chart.js via react-chartjs-2)

---

## Verification Plan

### Automated Tests
```bash
# Backend — confirm it starts and responds
# 1. Start MongoDB locally (e.g., via Windows Services or `mongod`)
# 2. Start the backend:
cd blind-navigator/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Test and seed (in a separate terminal):
curl http://localhost:8000/docs          # Swagger UI
curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d '{"name":"test","email":"test@test.com","password":"test1234","role":"user"}'
python seed.py                  # populate demo data
```

# Firmware — compile check (no hardware needed)
cd firmware && pio run                  # must compile without errors

# Mobile app — build check
cd mobile-app && npm install && npx expo start # must start metro bundler

# Web dashboard — build check
cd web-dashboard && npm install && npm run dev  # must serve without errors
```

### Manual Verification
- **Backend**: Hit all endpoints via Swagger UI at `http://localhost:8000/docs`
- **Firmware**: Flash to ESP32, open Serial Monitor, verify Scenario A/B/C state transitions print correctly; open nRF Connect and confirm BLE GATT data is readable
- **Mobile App**: Run on physical Android/iOS device, verify BLE scan finds the band, live distance displays
- **Web Dashboard**: Login with seeded user, navigate sessions → detail, check summary charts render with demo data
