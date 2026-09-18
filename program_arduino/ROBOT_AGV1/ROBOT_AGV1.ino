#include <Wire.h>
#include <EEPROM.h>
#include <WiFi.h>
#include "AsyncUDP.h"
#include <ElegantOTA.h>
#include <ESPAsyncWebServer.h>
#include <AccelStepper.h>
#include <PubSubClient.h>
#include <Adafruit_Sensor.h>
#include <Arduino_JSON.h>
#include "TickerMaster.h"

// ******************************** WIFI VARIABEL ******************************* //
const char *ssid = "polman";
const char *password = "polman123";
const char *mqtt_server = "192.168.0.12";  //10 AGV1, 11 AGV2, 12 Server
uint32_t last_ota_time = 0;
AsyncWebServer server(80);

// ******************************** LINE SENSOR ********************************//
unsigned char Trig1 = 12;
unsigned char Trig2 = 13;
unsigned char Trig3 = 23;
unsigned char LineSensor = 36;
unsigned char buzz = 15;
unsigned char led = 2;
// ******************************** STEPPER PIN ******************************** //
const int DIR = 27;
const int STEP = 14;
const int steps_per_rev = 500;

AccelStepper stepper(AccelStepper::DRIVER, STEP, DIR);  // STEPPER LIB DRIVER

// ******************************** MILLIS ******************************** //
unsigned long now, now2;

// ******************************** Variabel Global LINE SENSOR ******************************** //
unsigned int sensor[8], nilaiMin[8], nilaiMax[8], nilaiRef[8] = { 450, 450, 450, 450, 450, 450, 450, 450 };

unsigned int nilaiSens = 450;

// ******************************** AUX ******************************** //
int i;
boolean biner[8];

// ******************************** FREE RTOS ******************************** //
TaskHandle_t TaskMQTTHandle, TaskNavigasiHandle, TaskConveyorHandle, TaskIndikatorSistemrHandle, TaskLiveTracking;
volatile int statusRobot = 0;  // 0=Jalan, 1=Halangan, 2=Di Stasiun


// ******************************** MPU for live tracking ******************************** //

JSONVar readings, monitoring, alarmed, pidel;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ******************************** DRIVER MOTOR DC PIN ******************************** //
#define motor1R 17
#define motor1L 5
#define motor2R 18
#define motor2L 19

#define ENC1A 32
#define ENC1B 33
#define ENC2A 25
#define ENC2B 26

// ******************************** TRACKNG POS ******************************** //
float global_Y1 = 0.0;
float global_X2 = 0.0;

// ******************************** READ ENCODER DATA ******************************** //
volatile long encoderPosition[3] = { 0, 0, 0 };
long lastPulse[3] = { 0, 0, 0 };
long pulsePerSecond[3] = { 0, 0, 0 };
float velocityEncoder[3] = { 0.0, 0.0, 0.0 };
unsigned long lastMillis = 0;
const int PPR = 217;

float Vmot[3] = { 0.0, 0.0, 0.0 };
float pidOutput[3] = { 0.0, 0.0, 0.0 };
float mutlakPidOutput[3] = { 0.0, 0.0, 0.0 };
int PWM[3] = { 0, 0, 0 };
int FPWM[4], BASEPWM = 40;
int DiviedPWM[3] = { 0, 0, 0 };
int sensor_Jarak[5] = { 4, 39, 34, 35 };  //4, 39, 34, 35 sebelumnya
volatile bool C_S_Jarak[5];

int NilaiPosisi, rlp;
volatile bool moveTrigger = false;
bool motorRun = false;

void IRAM_ATTR readEncoder1();  // dua ini perlu di ubah di main
void IRAM_ATTR readEncoder2();

// ******************************** UDP variables for UDP Communication ******************************** //
AsyncUDP udp;
String senderID = "";
unsigned long delayUDP = 0;
int8_t STA_1state, STA_2state, STA_2_5state, STA_3state, STA_3_5state;
volatile bool sta1_signal = false, sta2_signal = false, sta2_5_signal = false, sta3_signal = false, sta3_5_signal = false;


// ******************************** Basic Monitoring variables -From periode 2 ******************************** //
unsigned long JSON1time, JSON2time, JSON3time, JSON4time;
volatile bool confor = false, conrev = false, stopstate = false, moveflag = false, offtrack = false;
int8_t itemLimit = 1, prevCnt = 0;  //for item limit setting and conveyor to push more than just 2 work object
String agvmqtt = "LOADING_AT_STATION_1", backmqtt = "PHASE_BACKWARD";

// ******************************** AGV STATE DEFINE ******************************** //
enum AGVState {
  HOME_IDLE,
  HOME_TO_STATION_1,
  LOADING_AT_STATION_1,    // Conveyor ON (Forward), waiting for 2 items
  MOVING_TO_STATION_2,     // PID ON, Line following to destination
  UNLOADING_AT_STATION_2,  // Conveyor ON (Backward), unloading items
  MOVING_TO_STATION_1,     // PID ON, returning to start
  AUTO_HOME_ST1,           // Home porting on Station 1
  AUTO_HOME_ST1toST2,      // Home porting on the way to Station 2
  AUTO_HOME_ST2,           // Home porting on Station 2
};

enum ReturnState {
  PHASE_BACKWARD,
  PHASE_TURN_RIGHT,
  PHASE_RETURN_STRAIGHT
};

volatile ReturnState returnPhase = PHASE_BACKWARD;
volatile int itemCount = 0;

//Home porting on Station 1
enum AutoHome_ST1 {
  HIT_ST1,
  BACKWARD_ST1,
  TURN_RIGHT_ST1_1,
  STRAIGHT_ST1_1,
  TURN_RIGHT_ST1_2,
  STRAIGHT_ST1_2
};

volatile AutoHome_ST1 AutoHomeST1State = BACKWARD_ST1;

//Home porting on Station 2
enum AutoHome_ST1toST2 {
  STRAIGHT_ST1toST2_1,
  BACKWARD_ST1toST2,
  AROUND_ST1toST2,
  TURN_LEFT_ST1toST2_0_5,
  TURN_LEFT_ST1toST2_0_5_2,
  STRAIGHT_ST1toST2_2,
  TURN_LEFT_ST1toST2,
  STRAIGHT_ST1toST2_3
};

volatile AutoHome_ST1toST2 AutoHomeST1toST2State = STRAIGHT_ST1toST2_1;

// ******************************** NEW SEQUENCE AGV CNFG ******************************** //
struct AGVSequenceConfig {
  AGVState currentState;
  AGVState nextState;
  AGVState previousState;  //tambahan untuk movestarttime

  uint8_t errorCode;
};

AGVSequenceConfig g_AGVCfg;

// ******************************** VARIABEL JEMBATAN MQTT <-> NAVIGASI ******************************** //
volatile bool mqttEmergency = false;
volatile bool mqttReset = false;
bool mqttflag = false;
int current_product_id = 0;
AGVState lastReportedState = HOME_IDLE;

int countBarang = 0;
bool sampaiStation2 = false;
bool conveyorDone = false;
unsigned long Longwait;

// ******************************** MPU READ TO GET DEGREE DATA FOR TRACKING ******************************** //
#define MPU6050_ADDR 0x68

#define SDA_PIN 21
#define SCL_PIN 22

#define CALIBRATION_SAMPLES 2000

float GYRO_X, GYRO_Y, GYRO_Z;
float ACCEL_X, ACCEL_Y, ACCEL_Z;
float TEMPERATURE;

//GYRO OFFSET
float GYRO_X_OFFSET = 0;
float GYRO_Y_OFFSET = 0;
float GYRO_Z_OFFSET = 0;

//ACCEL OFFSET
float ACCEL_X_OFFSET = 0;
float ACCEL_Y_OFFSET = 0;
float ACCEL_Z_OFFSET = 0;

// ******************************** VARIABEL DIMENSION OF AGV ******************************** //
float dt;
unsigned long lastDt;
float GYRO_Zdeg = 90;
//Encoder Logic Function
const float WHEEL_BASE = 170.0;  // mm
const float WHEEL_DIAMETER = 65.0;
const float GEAR_RATIO = 15.0;  //before 16
const float ENCODER_PPR = 14.0;


long lastEncoderLeft = 0;
long lastEncoderRight = 0;

const float PULSE_PER_REV = GEAR_RATIO * ENCODER_PPR;
const float WHEEL_CIRCUMFERENCE = PI * WHEEL_DIAMETER;
const float DISTANCE_PER_PULSE = WHEEL_CIRCUMFERENCE / PULSE_PER_REV;

// ******************************** VARIABEL TO COUNT POS ******************************** //
float posX = 0.0;         // mm
float posY = 0.0;         // mm
float theta = GYRO_Zdeg;  // radian
float degtheta, floatl, floatr;
long truepulseL, truepulseR, delL, delR;

// ******************************** Main Control Varibles from dashboard ******************************** //
//RPM Control
int16_t RPMinput = 40;
//for PID control
volatile bool Done_R = false;
unsigned long time_0_1s = 0;
int realoutput;
double pel = 65.0, iel = 0.0, del = 0.0, setpointel, inputel, outputel;  //default setpoint is 40 and PID goes 1 1 0
double minPID = -455, maxPID = 455;                                      //This is limit for RPM that will get mapped later on in Task_Navigasi previously 313

// ******************************** for manual control ******************************** //
volatile bool conforward, conreverse;
volatile bool MwheelR = false, MwheelL = false;

//FMS Variables for support
volatile bool proxHome = false;
int8_t KananAja = 0;

// ******************************** NEW SEQUENCE AGV EXQ ******************************** //
int lastLoadingState = LOW;
int lastUnloadingState = HIGH;

//Correction for AGV at unloading

int currentUnloadingState = LOW;                                      //TO make sure the unloading process works, the var needs to get updated without having to rely on the function getting called
                                                                      //first
int8_t NoKanan = 0;                                                   //Counting how many kanan actually gets detected
int8_t HomeChoose1 = 0, HomeChoose2 = 0, Porting1 = 1, Porting2 = 3;  //HOme choosing feature


int loadingMoveTimer = 0;
int unloadingDelayTimer = 0;
int debounceTimer = 0;

volatile bool Autohomedelay1 = false, Autohomedelay2 = false;
volatile unsigned long moveStartTime = 0;
unsigned long turnStartTime = 0;

volatile bool DoneCycle = false;


//-----------SUPPORT VAR-----------------//
bool switchUp = false;
double saveI = 0;
double saveII = 0;

//---------------------TICKER NON-INTERUPT----------------------------//
volatile unsigned long TimerState = 0, TimerState2 = 0, TimerState3 = 0, TimerState4 = 0, TimerState5 = 0, millisCNT = 0;

void TimerFlip() {
  TimerState++;
}

void TimerFlip2() {
  TimerState2++;
}

void TimerFlip3() {
  TimerState3++;
}

void TimerFlip4() {
  TimerState4++;
}

void TimerFlip5() {
  TimerState5++;
}

Ticker timer1(TimerFlip, 100);
Ticker timer2(TimerFlip2, 100);
Ticker timer3(TimerFlip3, 100);
Ticker timer4(TimerFlip4, 100);
Ticker timer5(TimerFlip5, 100);

//--------------------------------AGV SEQUENCE PROGRAM START--------------------//

void AGV_StateHomeIdle() {
  MotorStop();


  if (sta1_signal) {
    g_AGVCfg.nextState = HOME_TO_STATION_1;
  }
}


void AGV_Init() {
  g_AGVCfg.currentState = HOME_IDLE;
  g_AGVCfg.nextState = HOME_IDLE;
  g_AGVCfg.previousState = HOME_IDLE;
  g_AGVCfg.errorCode = 0;

  MotorStop();
  stopConveyor();

  itemCount = 0;
}


void AGV_MoveToStation1() {
  //Initialization to reset making sure it actually got resetted
  AutoHomeST1State = BACKWARD_ST1;  //TO RESET AutoHome
  AutoHomeST1toST2State = STRAIGHT_ST1toST2_1;


  //Let's just try to believe in the line-follow function sensor readings to make it only one way / one thing that is updating linesensor

  KendaliBacasensor();
  timer1.update();
  volatile bool isStation = (sensor[0] > nilaiSens && sensor[7] > nilaiSens);
  volatile bool isSimpangKanan = (sensor[0] < nilaiSens && sensor[7] > nilaiSens && (sensor[3] > nilaiSens || sensor[4] > nilaiSens) == true);


  if (TimerState >= 30 && isStation == true) {
    MotorStop();

    g_AGVCfg.nextState = LOADING_AT_STATION_1;

    Serial.println("Robot in Station 1");
  } else if (isSimpangKanan == true || isStation == true) {
    setMotor(30, 30);
  } else {
    line_follow(40);
    // line_follow_BCK(40);
  }
}

void AGV_Loading() {
  Sensor_Distance();

  int currentLoadingState = C_S_Jarak[2];


  if ((millis() - moveStartTime) >= 500 && lastLoadingState == 0 && currentLoadingState == 1) {
    itemCount++;

    Serial.print("Item Loaded: ");
    Serial.println(itemCount);

    moveStartTime = millis();
    turnStartTime = millis();

    moveflag = true;
  }

  //interval for conveyor intervals
  if (moveflag == true && sta3_5_signal == true) {
    timer5.update();
    if (TimerState5 <= 20) {
      stepper_Move();
    } else if (TimerState5 > 20) {
      moveflag = false;
      sta3_5_signal = false;
      TimerState5 = 0;
    }
  }

  if (itemCount >= itemLimit && sta3_signal == true && (millis() - turnStartTime) >= 750) {
    stopConveyor();
    turnStartTime = millis();
    g_AGVCfg.nextState = MOVING_TO_STATION_2;
    sta3_signal = false;

    Serial.println("Items full!");
  }

  lastLoadingState = currentLoadingState;
}

void AGV_MoveToStation2() {

  KendaliBacasensor();

  // timer4.update();

  volatile bool curStationState = (sensor[0] > nilaiSens && sensor[7] > nilaiSens);
  volatile bool isSimpangKanan = (sensor[0] < nilaiSens && (sensor[7] >= nilaiSens || sensor[6] >= nilaiSens) == true && (sensor[3] >= nilaiSens || sensor[4] >= nilaiSens) == true);


  if ((millis() - turnStartTime) >= 5000 && curStationState == true) {
    MotorStop();
    sta1_signal = false;

    returnPhase = PHASE_BACKWARD;          // added to make sure its Backward first
    vTaskDelay(500 / portTICK_PERIOD_MS);  // Jeda sebelum roda jalan

    g_AGVCfg.nextState = UNLOADING_AT_STATION_2;
    vTaskDelay(1000 / portTICK_PERIOD_MS);  // added to see the transition of the case

    Serial.println("Robot in Station 1");
  } else if (isSimpangKanan == true || curStationState == true) {
    setMotor(30, 30);
  } else {
    line_follow(40);
  }
}

//----------------------SWITCH FOR TASK CONVEYOR-----------------------//
void AGV_Unloading() {
  Sensor_Distance();

  currentUnloadingState = C_S_Jarak[3];

  //OLD CODE :
  if (sta2_signal) stepper_Move();  // UDP comms to STA2 to make sure its ready to receive workpiece
  if (itemCount > 0) {
    if ((millis() - moveStartTime) >= 500 && lastUnloadingState == HIGH && currentUnloadingState == LOW) {
      itemCount--;
      moveStartTime = millis();
    }
  }

  if (itemCount <= 0) {
    if (sta2_signal == true) {
      turnStartTime = millis();
      sta2_signal = false;  //false it automatically if we want to make things non handshake on the UDP comms to STA2
    } else if (sta2_signal == false) {
      if ((millis() - turnStartTime) >= 7000) {
        stopConveyor();
        itemCount = 0;
        if (sta2_5_signal == true) {
          returnPhase = PHASE_BACKWARD;         // added to make sure its Backward first
          vTaskDelay(25 / portTICK_PERIOD_MS);  // Jeda sebelum roda jalan

          turnStartTime = millis();
          g_AGVCfg.nextState = MOVING_TO_STATION_1;
          vTaskDelay(25 / portTICK_PERIOD_MS);  // Jeda sebelum roda jalan
        }
      } else {
        stepper_Move();
      }
    }
  }
  lastUnloadingState = currentUnloadingState;
}

void AGV_ReturnBackward() {

  KendaliBacasensor();

  if ((millis() - turnStartTime) >= 1500 && (sensor[0] < nilaiSens && sensor[7] > nilaiSens && (sensor[4] > nilaiSens || sensor[3] > nilaiSens)) == true) {
    Serial.println("Robot stop, Turn right");
    MotorStop();
    sta2_5_signal = false;
    vTaskDelay(500 / portTICK_PERIOD_MS);


    returnPhase = PHASE_TURN_RIGHT;
    turnStartTime = millis();

    vTaskDelay(500 / portTICK_PERIOD_MS);

  } else {
    setMotor(-30, -30);
    Serial.println("Robot backward");
  }
}


void AGV_TurnRight() {
  KendaliBacasensor();
  //Sensitive part about catching the Right turn
  //Try to make sensor 1 gone, so its a perfect left
  if ((millis() - turnStartTime) >= 1200 && (sensor[0] > nilaiSens || sensor[1] > nilaiSens) && sensor[7] < nilaiSens) {
    MotorStop();
    returnPhase = PHASE_RETURN_STRAIGHT;
    turnStartTime = millis();
    vTaskDelay(500 / portTICK_PERIOD_MS);
  } else {
    //Try to adjust the turning motion) {
    setMotor(40, -30);
    Serial.println("Robot Turn right");
  }
}

void AGV_ReturnStraight() {

  KendaliBacasensor();


  volatile bool isStation = (sensor[0] > nilaiSens && sensor[7] > nilaiSens);
  volatile bool isSimpangKanan = (sensor[0] < nilaiSens && sensor[7] > nilaiSens && (sensor[3] > nilaiSens || sensor[4] > nilaiSens) == true);

  // This is the end of the line for the SEQUENC
  if (isStation == true && (millis() - turnStartTime) >= 4000) {
    Serial.println("Robot in Station 1");
    MotorStop();
    DoneCycle = true;
    g_AGVCfg.nextState = LOADING_AT_STATION_1;
  } else if (isSimpangKanan == true || isStation == true) {
    setMotor(30, 30);
  } else {
    line_follow(40);
  }
}
void AGV_ReturnStation1() {
  switch (returnPhase) {
    case PHASE_BACKWARD:

      AGV_ReturnBackward();

      break;


    case PHASE_TURN_RIGHT:

      AGV_TurnRight();

      break;


    case PHASE_RETURN_STRAIGHT:

      AGV_ReturnStraight();

      break;
  }
}

// ************************************************************ AUTO HOME CASE, IF AGV IN ST1 ************************************************************ //
//Additional Homing for MOVING_TO_STATION_1 : As it stands now, we'll just do a little merging so that there's no need to make another separate sequence for the
// other homing state. So... Homing for STATION_2 and MOVING_TO_STATION_2 is one in the same just with a different starting point

//MOVING_TO_STATION_1 homing start point :
void AGV_HitStation() {
  KendaliBacasensor();
  // Sensor_Distance();

  volatile bool yangKanan = (sensor[0] < nilaiSens && (sensor[7] > nilaiSens || sensor[6] > nilaiSens || sensor[5] > nilaiSens) == true);
  volatile bool isStation = (sensor[0] > nilaiSens && sensor[7] > nilaiSens);

  if (isStation == true) {

    MotorStop();

    AutoHomeST1State = BACKWARD_ST1;
    turnStartTime = millis();
  } else if (yangKanan == true) {
    setMotor(30, 30);
  } else {
    line_follow(40);
  }
}


void AGV_ReturnBackward_ST1() {
  volatile bool yangKanan = (sensor[0] < nilaiSens && (sensor[7] > nilaiSens || sensor[6] > nilaiSens));
  KendaliBacasensor();
  //making sure its backign up a lil
  timer2.update();
  if (TimerState2 >= 5 && yangKanan == true) {

    MotorStop();


    AutoHomeST1State = TURN_RIGHT_ST1_1;
    turnStartTime = millis();
  } else {
    line_follow(40);
  }
}

//Turning right, make it look like the process of turn right on STA2
void AGV_TurnRight_ST1_1() {
  volatile bool yangKiri = (sensor[0] > nilaiSens && sensor[7] < nilaiSens);
  KendaliBacasensor();
  //Making sure its turning
  //Making sure it got the line
  //Trying out Ticker
  if ((millis() - turnStartTime) >= 800 && yangKiri == true) {  // A WORKING TURNING RIGHT CONFIG ???

    MotorStop();
    vTaskDelay(500 / portTICK_PERIOD_MS);
    AutoHomeST1State = STRAIGHT_ST1_1;
    turnStartTime = millis();
    moveStartTime = millis();
  } else {

    //Try to adjust the turning motion) {
    setMotor(40, -30);
  }
}


void AGV_ReturnStraight_ST1_1() {
  KendaliBacasensor();

  // volatile bool isSimpangKanan = (sensor[0] < nilaiSens && sensor[7] > nilaiSens && (sensor[4] > nilaiSens || sensor[3] > nilaiSens)); //OLD Ones
  volatile bool yangKanan = (sensor[0] < nilaiSens && sensor[7] > nilaiSens);
  volatile bool yangKiri = (sensor[0] > nilaiSens && sensor[7] < nilaiSens);
  // This is the end of the line for the SEQUENCE
  if ((millis() - moveStartTime) >= 1800) {
    Autohomedelay1 = true;
  }


  if ((millis() - turnStartTime) >= 1500 && yangKanan == true && Autohomedelay1 == true) {
    KananAja++;
    HomeChoose1++;
    turnStartTime = millis();
  }

  else if (HomeChoose1 >= Porting1 && yangKanan == true) {
    MotorStop();

    AutoHomeST1State = TURN_RIGHT_ST1_2;
    turnStartTime = millis();
    // } else if ((isSimpangKanan == true || sensor[0] < nilaiSens && sensor[7] > nilaiSens) && moveStartTime <= 1000) {  //try to make sure it moves forward first a lil bit

    //   setMotor(50, 50);
  } else if ((yangKanan == true && HomeChoose1 < Porting1)) {
    setMotor(30, 30);
  } else {

    line_follow(40);
  }
}

void AGV_TurnRight_ST1_2() {
  KendaliBacasensor();
  volatile bool yangKiri = ((sensor[0] > nilaiSens || sensor[1] > nilaiSens) && sensor[7] < nilaiSens);

  if ((millis() - turnStartTime) >= 1200 && yangKiri == true) {  // A WORKING TURNING RIGHT CONFIG ???

    MotorStop();
    turnStartTime = millis();
    AutoHomeST1State = STRAIGHT_ST1_2;

  } else {

    //Try to adjust the turning motion) {
    setMotor(40, -30);
  }
}

void AGV_ReturnStraight_ST1_2() {
  KendaliBacasensor();
  // This is the end of the line for the SEQUENC
  volatile bool isStation = (sensor[0] > nilaiSens && sensor[7] > nilaiSens);
  // volatile bool isSimpangKanan = (sensor[0] < nilaiSens && sensor[7] > nilaiSens);

  if (isStation == true && (millis() - turnStartTime) >= 1000) {

    MotorStop();
    sta1_signal = false;
    g_AGVCfg.nextState = HOME_IDLE;

  } else {

    line_follow(40);
  }
}

void AGV_AutohomeST1() {
  switch (AutoHomeST1State) {

    case HIT_ST1:

      AGV_HitStation();

      break;

    case BACKWARD_ST1:

      AGV_ReturnBackward_ST1();

      break;


    case TURN_RIGHT_ST1_1:

      AGV_TurnRight_ST1_1();

      break;

    case STRAIGHT_ST1_1:

      AGV_ReturnStraight_ST1_1();

      break;

    case TURN_RIGHT_ST1_2:

      AGV_TurnRight_ST1_2();

      break;

    case STRAIGHT_ST1_2:

      AGV_ReturnStraight_ST1_2();

      break;
  }
}

// ************************************************************ AUTO HOME CASE, IF AGV IN ST1 TO ST2 STATE ************************************************************ //

void AGV_Straight_ST1toST2_1() {
  KendaliBacasensor();
  // Sensor_Distance();

  volatile bool yangKanan = (sensor[0] < nilaiSens && (sensor[7] > nilaiSens || sensor[6] > nilaiSens));
  volatile bool isStation = (sensor[0] > nilaiSens && sensor[7] > nilaiSens);


  if (isStation == true) {

    MotorStop();
    moveStartTime = millis();
    AutoHomeST1toST2State = BACKWARD_ST1toST2;

  } else if (yangKanan == true) {

    setMotor(30, 30);

  } else {

    line_follow(40);
  }
}

void AGV_Backward_ST1toST2() {
  KendaliBacasensor();

  if ((millis() - moveStartTime) >= 2000) {
    MotorStop();

    AutoHomeST1toST2State = AROUND_ST1toST2;
  } else {
    setMotor(-30, -30);
  }
}

void AGV_ReturnAROUND_ST1toST2() {
  KendaliBacasensor();

  timer4.update();

  volatile bool yangTengahKanan = (sensor[0] < nilaiSens && (sensor[3] > nilaiSens || sensor[4] > nilaiSens || sensor[5] > nilaiSens) == true);

  if (TimerState4 >= 20 && yangTengahKanan == true) {
    MotorStop();
    turnStartTime = millis();
    AutoHomeST1toST2State = TURN_LEFT_ST1toST2_0_5;
  } else {
    setMotor(-30, 30);
  }
}

void AGV_TurnLeft_ST1toST2_0_5() {
  KendaliBacasensor();
  volatile bool yangKiri = (sensor[7] < nilaiSens && (sensor[0] > nilaiSens || sensor[1] > nilaiSens));

  if ((millis() - turnStartTime) >= 2000 && yangKiri == true) {

    MotorStop();
    // turnStartTime = millis();
    moveStartTime = millis();
    AutoHomeST1toST2State = TURN_LEFT_ST1toST2_0_5_2;
  } else if (yangKiri == true) {
    setMotor(30, 30);
  } else {
    line_follow(40);
  }
}

void AGV_TurnLeft_ST1toST2_0_5_2() {
  KendaliBacasensor();

  volatile bool yangKanan = (sensor[0] < nilaiSens && (sensor[7] > nilaiSens || sensor[6] > nilaiSens) == true);

  if ((millis() - moveStartTime) >= 800 && yangKanan == true) {  //Trying to catch the lines
    MotorStop();
    vTaskDelay(500 / portTICK_PERIOD_MS);
    turnStartTime = millis();
    moveStartTime = millis();
    AutoHomeST1toST2State = STRAIGHT_ST1toST2_2;
  } else {
    setMotor(-30, 40);
  }
}



void AGV_ReturnStraight_ST1toST2_2() {

  volatile bool isSimpangKiri = (sensor[0] > nilaiSens && sensor[7] < nilaiSens);

  if ((millis() - moveStartTime) >= 1800) {
    Autohomedelay2 = true;
  }

  if ((millis() - turnStartTime) >= 1500 && isSimpangKiri == true && Autohomedelay2 == true) {
    turnStartTime = millis();
    HomeChoose2++;
  } else if (HomeChoose2 >= Porting2 && isSimpangKiri == true) {
    MotorStop();

    turnStartTime = millis();
    AutoHomeST1toST2State = TURN_LEFT_ST1toST2;
  } else if (isSimpangKiri == true && HomeChoose2 < Porting2) {

    setMotor(30, 30);
  } else {

    line_follow(40);
  }
}

void AGV_TurnLeft_ST1toST2_1() {
  KendaliBacasensor();

  volatile bool yangKanan = (sensor[0] < nilaiSens && sensor[7] > nilaiSens);

  if ((millis() - turnStartTime) >= 800 && yangKanan == true) {

    MotorStop();
    AutoHomeST1toST2State = STRAIGHT_ST1toST2_3;
    turnStartTime = millis();

  } else {

    // to set the turning motion)
    setMotor(-30, 40);
  }
}

void AGV_ReturnStraight_ST1toST2_3() {
  KendaliBacasensor();
  // This is the end of the line for the SEQUENCE
  bool isStation = (sensor[0] > nilaiSens && sensor[7] > nilaiSens);
  if ((millis() - turnStartTime) >= 1000 && isStation == true) {

    MotorStop();
    sta1_signal = false;
    g_AGVCfg.nextState = HOME_IDLE;

  } else {

    line_follow(40);
  }
}

void AGV_AutohomeST1toST2() {
  switch (AutoHomeST1toST2State) {

    case STRAIGHT_ST1toST2_1:

      AGV_Straight_ST1toST2_1();

      break;

    case BACKWARD_ST1toST2:

      AGV_Backward_ST1toST2();

      break;

    case AROUND_ST1toST2:

      AGV_ReturnAROUND_ST1toST2();

      break;


    case TURN_LEFT_ST1toST2_0_5:

      AGV_TurnLeft_ST1toST2_0_5();

      break;

    case TURN_LEFT_ST1toST2_0_5_2:

      AGV_TurnLeft_ST1toST2_0_5_2();

      break;


    case STRAIGHT_ST1toST2_2:

      AGV_ReturnStraight_ST1toST2_2();

      break;

    case TURN_LEFT_ST1toST2:

      AGV_TurnLeft_ST1toST2_1();

      break;

    case STRAIGHT_ST1toST2_3:

      AGV_ReturnStraight_ST1toST2_3();

      break;
  }
}

// ************************************************************ AGV JOB EXECUTE ************************************************************ //
void AGV_Execute() {
  g_AGVCfg.currentState = g_AGVCfg.nextState;

  if (proxHome == true && g_AGVCfg.currentState == LOADING_AT_STATION_1) {
    g_AGVCfg.nextState = AUTO_HOME_ST1;

  } else if (proxHome == true && g_AGVCfg.currentState == MOVING_TO_STATION_2) {

    g_AGVCfg.nextState = AUTO_HOME_ST1toST2;
  } else if (proxHome == true && g_AGVCfg.currentState == UNLOADING_AT_STATION_2) {
    g_AGVCfg.nextState = AUTO_HOME_ST2;
  }


  switch (g_AGVCfg.currentState) {
    case HOME_IDLE:

      if (sta1_signal == true) {
        g_AGVCfg.nextState = HOME_TO_STATION_1;
      }

      break;


    case HOME_TO_STATION_1:

      if (ObstacleDetected()) {
        MotorStop();

        g_AGVCfg.nextState = HOME_IDLE;
        break;
      }

      AGV_MoveToStation1();

      break;


    case LOADING_AT_STATION_1:

      AGV_Loading();

      break;

    case MOVING_TO_STATION_2:
      AGV_MoveToStation2();

      break;


    case UNLOADING_AT_STATION_2:

      AGV_Unloading();

      break;


    case MOVING_TO_STATION_1:
      AGV_ReturnStation1();

      break;

    case AUTO_HOME_ST1:

      AGV_AutohomeST1();

      break;

    case AUTO_HOME_ST1toST2:

      AGV_AutohomeST1toST2();

      break;


    case AUTO_HOME_ST2:

      AGV_AutohomeST1toST2();

      break;


    default:

      g_AGVCfg.nextState = LOADING_AT_STATION_1;
      break;
  }
}


void Fn_Execute() {
  AGV_Execute();
}

//--------------------------------AGV SEQUENCE PROGRAM END--------------------//


// ************************************************************************************************************************************************************************************************//
void setup() {
  inisialisasiSistem();
}

void loop() {
  //We use FreeRTOS threading instead
}

// ******************************** LED blink function for MQTT error check ******************************** //
void LEDblink(int t, int n) {
  for (int i = 0; i < n; i++) {
    digitalWrite(led, 1);
    delay(t);
    digitalWrite(led, 0);
    delay(t);
  }
}

// ******************************** LIVETRACK VIEW ******************************** //
String JSONdata1() {
  readings["posX"] = posX;
  readings["posY"] = posY;
  readings["thetha"] = GYRO_Zdeg;
  readings["Encoder1 RPM"] = velocityEncoder[1];
  readings["Encoder2 RPM"] = velocityEncoder[2];
  readings["Cyclemicros"] = TimerState3;
  String stringJSON = JSON.stringify(readings);
  return stringJSON;
}

// ******************************** MONITORING MENU ******************************** //

//JSON build for normal monitoring
String JSONdata2() {
  monitoring["sby"] = stopstate;  //1
  monitoring["confor"] = confor;  //2
  monitoring["conrev"] = conrev;  //2
  monitoring["cnt"] = itemCount;  //3
  monitoring["lmt"] = itemLimit;  //4
  monitoring["BASEPWM"] = BASEPWM;
  monitoring["pe1"] = C_S_Jarak[0];              //5
  monitoring["pe2"] = C_S_Jarak[1];              //6
  monitoring["pe3"] = C_S_Jarak[2];              //7
  monitoring["pe4"] = C_S_Jarak[3];              //8
  monitoring["agv"] = agvmqtt;                   //10
  monitoring["ip"] = WiFi.localIP().toString();  //11
  monitoring["rssi"] = WiFi.RSSI();              //12
  monitoring["ram"] = esp_get_free_heap_size();  //13
  String JSONstring = JSON.stringify(monitoring);
  return JSONstring;
}


// ******************************** POP UP / HISTORICAL VIEW ******************************** //

//JSON build for alarm & events
String JSONdata3() {
  alarmed["od"] = ObstacleDetected();
  alarmed["ot"] = offtrack;
  String StringJSON = JSON.stringify(alarmed);
  return StringJSON;
}

// ******************************** CONTROL MENU ******************************** //

//JSON Data for PID and Sensor settings + FMS
String JSONdata4() {
  pidel["Ref0"] = String(nilaiSens);
  pidel["Sensor0"] = String(sensor[0]);
  pidel["Sensor1"] = String(sensor[1]);
  pidel["Sensor2"] = String(sensor[2]);
  pidel["Sensor3"] = String(sensor[3]);
  pidel["Sensor4"] = String(sensor[4]);
  pidel["Sensor5"] = String(sensor[5]);
  pidel["Sensor6"] = String(sensor[6]);
  pidel["Sensor7"] = String(sensor[7]);
  pidel["PID Out"] = pidOutput[1];
  pidel["Pos"] = NilaiPosisi;
  pidel["Pel"] = pel;
  pidel["Iel"] = iel;
  pidel["Del"] = del;
  pidel["Homing"] = proxHome;
  pidel["Port1"] = Porting1;  //14
  pidel["Port2"] = Porting2;  //15
  String StringJSON = JSON.stringify(pidel);
  return StringJSON;
}




void Task_MQTT(void *pvParameters) {
  mqttClient.setServer(mqtt_server, 1883);
  mqttClient.setCallback(mqttCallback);
  //tambahan
  unsigned long cycletime = 0;

  // ******************************** VOID LOOP ******************************** //
  for (;;) {  //This is where void loop lives, and most likely where we'll do modifications and adding new things here, call a function ?
              //ENCODER PART FOR X & Y
              // ******************************** FUNC TO GET POS FROM DATA ENC ******************************** //
    ElegantOTA.loop();
    Odometry();

    // ******************************** MPU READING FOR DEGREE TURNING ******************************** //
    ReadMPU6050();
    GYRO_Z -= GYRO_Z_OFFSET;
    unsigned long now = millis();
    dt = (now - lastDt) / 1000.0;
    lastDt = now;

    GYRO_Zdeg += GYRO_Z * dt;  // MATH TO GET DEG DATA

    // ******************************** OFF TRACK ALARM ******************************** //
    bool isnotStation = (bacaSensorbiner() == 0b00000000);
    offtrack = isnotStation;

    // ******************************** MQTT NOT CONNECT TRY TO RECONECT ******************************** //
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    //*********************************SENSITIVITY SETTINGS***********************************************//
    //Making sure nilaiRef = nilaiSens
    dataSensor();

    // **************************************************************************************************************************************************************** //
    mqttClient.loop();

    if (STA_1state == 1) {
      sta1_signal = true;
      STA_1state = 0;
    }

    if (STA_2state == 1) {
      sta2_signal = true;
      STA_2state = 0;
    }

    if (STA_2_5state == 1) {
      sta2_5_signal = true;
      STA_2_5state = 0;
    }

    if (STA_3state == 1) {
      sta3_signal = true;
      STA_3state = 0;
    }

    if (STA_3_5state == 1) {
      sta3_5_signal = true;
      STA_3_5state = 0;
    }

    if ((millis() - JSON1time) >= 500) {
      JSON1time = millis();
      mqttClient.publish("agv1/monitor/livetrack", JSONdata1().c_str());
      mqttClient.publish("agv1/monitor/state", agvmqtt.c_str());
    }
    if ((millis() - JSON2time) >= 1000) {
      JSON2time = millis();
      mqttClient.publish("agv1/monitor/pid", JSONdata4().c_str());
    }
    if ((millis() - JSON3time) >= 1200) {
      JSON3time = millis();
      mqttClient.publish("agv1/monitor/alarm", JSONdata3().c_str());
    }
    if ((millis() - JSON4time) >= 1500) {
      JSON4time = millis();
      mqttClient.publish("agv1/monitor/normal", JSONdata2().c_str());
    }




    mqttflag = true;
    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

void Task_Navigasi(void *pvParameters) {
  EEPROM.begin(512);




  timer1.start();
  timer2.start();
  timer4.start();
  timer5.start();
  AGVState previousState = HOME_IDLE;

  for (;;) {
    encoderToVelocity();

    if (debounceTimer > 0) debounceTimer--;      //to make sure the Unloading sensor reading is not detent
    lastUnloadingState = currentUnloadingState;  //making sure the confirmation for push-button behaviour for the var

    //-------------MAIN CONTROL FUNCTION---------------//
    if (ObstacleDetected() == true || (mqttEmergency == true && mqttReset == false)) {  //later add obstacle here
      MotorStop();
    } else if (mqttEmergency == false && mqttReset == true) {  //NEW phase to handle RESET and differ it with Continue
      sta1_signal = false;
      sta2_signal = false;
      sta3_signal = false;

      mqttReset = false;
      g_AGVCfg.nextState = HOME_IDLE;
    } else {
      Fn_Execute();  //MAIN FUNCTION
    }

    //Manual conveyor control
    if (conforward == 1) {
      stepper_Move();
    }

    if (conreverse == 1) {
      stepper_Rev();
    }

    //Manual Wheel Control for adjusting at Station
    if (MwheelR == 1) {
      setMotor(-60, 60);
    }

    if (MwheelL == 1) {
      setMotor(60, -60);
    }


    //Adding reset flag for PID damper
    if (g_AGVCfg.currentState == HOME_IDLE) {
      //Complete Cycle Whole Restart
      itemCount = 0;  //restarting the item count at idle
      TimerState = 0;
      TimerState2 = 0;
      TimerState3 = 0;
      TimerState4 = 0;
      HomeChoose1 = 0;
      HomeChoose2 = 0;
      proxHome = false;
      Autohomedelay2 = false;
      Autohomedelay1 = false;

      agvmqtt = "AGV1_HOME_IDLE";
    } else if (g_AGVCfg.currentState == HOME_TO_STATION_1) {
      agvmqtt = "AGV1_HOME_TO_STATION_1";
    } else if (g_AGVCfg.currentState == LOADING_AT_STATION_1) {
      agvmqtt = "AGV1_LOADING_AT_STATION_1";
    } else if (g_AGVCfg.currentState == MOVING_TO_STATION_2) {
      agvmqtt = "AGV1_MOVING_TO_STATION_2";
    } else if (g_AGVCfg.currentState == UNLOADING_AT_STATION_2) {
      agvmqtt = "AGV1_UNLOADING_AT_STATION_2";
    } else if (g_AGVCfg.currentState == AUTO_HOME_ST1) {
      agvmqtt = "AGV1_AUTO_HOME_ST1";
      C_S_Jarak[0] = 0;
      C_S_Jarak[1] = 0;
      if (proxHome != true) {
        g_AGVCfg.currentState = HOME_IDLE;
        sta1_signal = false;
        sta2_signal = false;
        sta3_signal = false;
      }
    } else if (g_AGVCfg.currentState == AUTO_HOME_ST1toST2) {
      agvmqtt = "AGV1_AUTO_HOME_ST1toST2";
      C_S_Jarak[0] = 0;
      C_S_Jarak[1] = 0;
      if (proxHome != true) {
        g_AGVCfg.currentState = HOME_IDLE;
        sta1_signal = false;
        sta2_signal = false;
        sta3_signal = false;
      }
    } else if (g_AGVCfg.currentState == AUTO_HOME_ST2) {
      agvmqtt = "AGV1_AUTO_HOME_ST2";
      C_S_Jarak[0] = 0;
      C_S_Jarak[1] = 0;
      if (proxHome != true) {
        g_AGVCfg.currentState = HOME_IDLE;
        sta1_signal = false;
        sta2_signal = false;
        sta3_signal = false;
      }



    } else if (g_AGVCfg.currentState == MOVING_TO_STATION_1) {
      agvmqtt = "AGV1_MOVING_TO_STATION_1";
    }

    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
}

void Indikator_Sistem(void *pvParameters) {
  timer3.start();
  for (;;) {
    //Obstacle Readings for navigation
    if ((g_AGVCfg.currentState == MOVING_TO_STATION_1 || g_AGVCfg.currentState == MOVING_TO_STATION_2 || g_AGVCfg.currentState == HOME_TO_STATION_1) == true) {
      Sensor_Distance();
    }
    if (ObstacleDetected()) {
      Error_Indikator();
      stopstate = true;
    } else if (g_AGVCfg.currentState == LOADING_AT_STATION_1 || g_AGVCfg.currentState == UNLOADING_AT_STATION_2 || g_AGVCfg.currentState == HOME_IDLE) {
      Standby_Indikator();
      stopstate = true;
    } else if (g_AGVCfg.currentState == MOVING_TO_STATION_1 || g_AGVCfg.currentState == MOVING_TO_STATION_2 || g_AGVCfg.currentState == HOME_TO_STATION_1) {
      Normal_Indikator();
      stopstate = false;
      timer3.update();
    } else if (proxHome == true) {
      Normal_Indikator();
      stopstate = false;
    } else if (g_AGVCfg.currentState == HOME_IDLE || DoneCycle == true) {
      TimerState3 = 0;
      DoneCycle = false;
    }
    vTaskDelay(100);
  }
}
