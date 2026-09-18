//This is where the program starts, and any part of the program that needs to be initialized at boot goes in here.

void inisialisasiSistem() {
  Serial.begin(115200);
  while (!Serial)
    delay(10);  // will pause Zero, Leonardo, etc until serial console opens

  OTA();
  //MPU part for degree livetracking
  Wire.begin(SDA_PIN, SCL_PIN);


  Wire.setClock(400000);
  delay(250);

  
  MPU6050_Init();

  delay(1000);

  MPU6050_Calibration();

  lastDt = millis();
  //MPU part ends
  
  pinMode(Trig1, OUTPUT);
  pinMode(Trig2, OUTPUT);
  pinMode(Trig3, OUTPUT);
  pinMode(buzz, OUTPUT);
  pinMode(led, OUTPUT);

  pinMode(STEP, OUTPUT);
  pinMode(DIR, OUTPUT);

  pinMode(LineSensor, INPUT);

  for (int i = 0; i < 4; i++) {
    pinMode(sensor_Jarak[i], INPUT);
  }

  pinMode(motor1R, OUTPUT);
  pinMode(motor1L, OUTPUT);
  pinMode(motor2R, OUTPUT);
  pinMode(motor2L, OUTPUT);
  pinMode(ENC1A, INPUT_PULLUP);
  pinMode(ENC1B, INPUT_PULLUP);
  pinMode(ENC2A, INPUT_PULLUP);
  pinMode(ENC2B, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(ENC1A), readEncoder1, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENC2A), readEncoder2, CHANGE);

  stepper.setMaxSpeed(500);
  stepper.setSpeed(300);

  xTaskCreatePinnedToCore(
    Task_MQTT,
    "Task MQTT",
    4096,
    NULL,
    2,
    &TaskMQTTHandle,
    0);

  // xTaskCreatePinnedToCore(
  //   Task_UDP,
  //   "Task UDP",
  //   4096,
  //   NULL,
  //   1,
  //   &TaskUDPHandle,
  //   0
  //    );


//1st attempt at PWM PID, try to integrate it with Task Navigasi
//Change a PWM variable to get adjusted every 100ms
  xTaskCreatePinnedToCore(
    Task_Navigasi,        // Nama fungsi Task yang tadi kita buat
    "Task_Navigasi",      // Nama alias untuk keperluan debugging
    4096,                 // Ukuran Stack memori (dalam bytes)
    NULL,                 // Parameter yang dikirim ke task (kosongkan saja)
    3,                    // Prioritas Task (1-3, angka lebih besar = prioritas lebih tinggi)
    &TaskNavigasiHandle,  // Variabel Handle Task
    1                     // Ditempatkan di Core 1
  );

//  xTaskCreatePinnedToCore(
//    Task_Conveyor,        // Nama fungsi Task yang tadi kita buat
//    "Task_Conveyor",      // Nama alias untuk keperluan debugging
//    4096,                 // Ukuran Stack memori (dalam bytes)
//    NULL,                 // Parameter yang dikirim ke task (kosongkan saja)
//    2,                    // Prioritas Task (1-3, angka lebih besar = prioritas lebih tinggi)
//    &TaskConveyorHandle,  // Variabel Handle Task
//    1                     // Ditempatkan di Core 1
//  );

  xTaskCreatePinnedToCore(
    Indikator_Sistem,             // Nama fungsi Task yang tadi kita buat
    "Indikator_Sistem",           // Nama alias untuk keperluan debugging
    2048,                         // Ukuran Stack memori (dalam bytes)
    NULL,                         // Parameter yang dikirim ke task (kosongkan saja)
    1,                            // Prioritas Task (1-3, angka lebih besar = prioritas lebih tinggi)
    &TaskIndikatorSistemrHandle,  // Variabel Handle Task
    1                             // Ditempatkan di Core 1
  );
}
