//MQTT Method in the MQTT Handler Task

// --- FUNGSI CALLBACK MQTT (Penerima Pesan) ---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  String t = String(topic);

  // Basic control via Dashboard, EMG to Reset for resetting the cycle & EMG to Continue to continue the current process
  if (t == "agv2/control/emergency") {  //Any kind of message works and it'll trigger EMG
    mqttEmergency = true;
    Serial.println("EMERGENCY STOP VIA MQTT!");
  } else if (t == "agv2/control/reset") {  //Same with RESET here
    mqttReset = true;
    mqttEmergency = false;
    Serial.println("RESET VIA MQTT");
  } else if (t == "agv2/control/continue") {  // And also this continue
    mqttEmergency = false;
    Serial.println("CONTINUE VIA MQTT");
  }

  // Still don't really know what to do with this one

  else if (t == "agv2/factory/agv") {
    current_product_id = msg.toInt();
    Serial.println("ID Produk Diterima: " + String(current_product_id));
  }

  //Parameter control from dashboard

  else if (t == "agv2/control/itemlimit") {
    int8_t msgint = msg.toInt();
    if (msgint >= 0 && (agvmqtt == "AGV2_LOADING_AT_STATION_1" || agvmqtt == "AGV2_HOME_IDLE")) {
      itemLimit = msgint;
    }
    // itemLimit = msg.toInt();
    Serial.println("Item limit : " + String(itemLimit));
  } else if (t == "agv2/control/pel") {
    double msgint = msg.toDouble();
    if (msgint >= 0 && (agvmqtt == "AGV2_LOADING_AT_STATION_1" || agvmqtt == "AGV2_HOME_IDLE")) {
      pel = msgint;
    }
  } else if (t == "agv2/control/iel") {
    double msgint = msg.toDouble();
    if (msgint >= 0 && (agvmqtt == "AGV2_LOADING_AT_STATION_1" || agvmqtt == "AGV2_HOME_IDLE")) {
      iel = msgint;
    }
  } else if (t == "agv2/control/del") {
    double msgint = msg.toDouble();
    if (msgint >= 0 && (agvmqtt == "AGV2_LOADING_AT_STATION_1" || agvmqtt == "AGV2_HOME_IDLE")) {
      del = msgint;
    }
  } else if (t == "agv2/control/rpm") {
    double msgint = msg.toDouble();
    if (msgint >= 0 && (agvmqtt == "AGV2_LOADING_AT_STATION_1" || agvmqtt == "AGV2_HOME_IDLE")) {
      RPMinput = map(msgint, 0, 313, 0, 255);
    }
  } else if (t == "agv2/control/forward") {
    bool msgbool = msg.toInt();
    if (msgbool) {
      conforward = true;
    } else conforward = false;
  } else if (t == "agv2/control/reverse") {
    bool msgbool = msg.toInt();
    if (msgbool) {
      conreverse = true;
    } else conreverse = false;
  } else if (t == "agv1/control/right") {
    bool msgbool = msg.toInt();
    if (msgbool) {
      MwheelR = true;
    } else MwheelR = false;
  } else if (t == "agv1/control/left") {
    bool msgbool = msg.toInt();
    if (msgbool) {
      MwheelL = true;
    } else MwheelL = false;
  } else if (t == "agv2/control/sens") {
    unsigned int msgint = msg.toInt();
    if (msgint >= 0) {
      nilaiSens = msgint;
    }
  } else if (t == "agv2/control/home" && (g_AGVCfg.currentState == LOADING_AT_STATION_1 || g_AGVCfg.currentState == MOVING_TO_STATION_2 || g_AGVCfg.currentState == UNLOADING_AT_STATION_2) == true && mqttEmergency == false) {
    proxHome = true;
  } else if (t == "agv2/control/work" && (g_AGVCfg.currentState == AUTO_HOME_ST1 || g_AGVCfg.currentState == AUTO_HOME_ST1toST2)) {
    proxHome = false;
  } else if (t == "agv2/control/port") {
    int8_t msgint = msg.toInt();
    if (msgint >= 0) {
      Porting1 = msgint;
      Porting2 = abs(map(msgint, 3, 1, -1, -3));
    }
  } else if (t == "agv2/control/order_sta1") {  // And also this continue
    STA_1state = 1;
  } else if (t == "agv2/control/order_sta2") {  // And also this continue
    STA_2state = 1;
  } else if (t == "agv2/control/order_sta2_5") {  // And also this continue
    STA_2_5state = 1;
  } else if (t == "agv2/control/order_sta3") {  // And also this continue
    STA_3state = 1;
  } else if (t == "agv2/control/order_sta3_5") {  // And also this continue
    STA_3_5state = 1;
  }



  //developers only for testing
  else if (t == "agv2/control/devcnt") {
    int8_t msgint = msg.toInt();
    if (msgint >= 0) {
      itemCount = msgint;
    }
  }
}

// --- FUNGSI RECONNECT MQTT ---
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Menghubungkan ke MQTT...");
    if (mqttClient.connect("AGV_Polman2")) {  //watchout for ID collision here
      Serial.println("Terhubung!");
      mqttClient.subscribe("agv2/control/emergency"); //Emergency Stop AGV
      mqttClient.subscribe("agv2/control/reset"); //Reset AGV from Emergency
      mqttClient.subscribe("agv2/control/continue"); //Continue sequence from Emergency
      mqttClient.subscribe("agv2/control/itemlimit"); //Set the itemlimit in AGV Conveyor
      mqttClient.subscribe("agv2/control/pel"); //Proportional Element for PID Line follower
      mqttClient.subscribe("agv2/control/iel"); //Integration Element for PID Line follower
      mqttClient.subscribe("agv2/control/del"); //Derivative Element for PID Line follower
      mqttClient.subscribe("agv2/control/rpm"); //Set the motor speed of AGV in RPM
      mqttClient.subscribe("agv2/control/forward"); //Manual control for conveyor
      mqttClient.subscribe("agv2/control/reverse"); //Manual control for conveyor
      mqttClient.subscribe("agv2/control/right"); //Manual control for motor
      mqttClient.subscribe("agv2/control/left"); //Manual control for motor
      mqttClient.subscribe("agv2/control/sens"); //Line-sensor sensitivity set
      mqttClient.subscribe("agv2/control/work"); //Home porting OFF trigger
      mqttClient.subscribe("agv2/control/home"); //Home porting ON trigger
      mqttClient.subscribe("agv2/control/port"); //Home porting Port set
      //external signal
      mqttClient.subscribe("agv2/control/order_sta1"); //Home to Station 1 signal trigger
      mqttClient.subscribe("agv2/control/order_sta2"); //Unloading at Station 2 signal trigger
      mqttClient.subscribe("agv2/control/order_sta2_5"); //Station 2 to Station 1 signal trigger
      mqttClient.subscribe("agv2/control/order_sta3"); //Station 1 to Station 2 signal trigger
      mqttClient.subscribe("agv2/control/order_sta3_5"); //Loading at Station 1 signal trigger
      // special devonly
      mqttClient.subscribe("agv2/control/devcnt"); //ItemCount forced setting
      mqttClient.subscribe("agv2/factory/agv"); //deprecated

    } else {
      vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
  }
}
