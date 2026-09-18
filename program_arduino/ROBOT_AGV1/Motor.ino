//Method for Task Navigasi, includes AGV line following, manual motor movement, and encoder readings

void IRAM_ATTR readEncoder1() {  // Roda Kiri
  if (digitalRead(ENC1A) == digitalRead(ENC1B)) {
    encoderPosition[1]++;
  } else {
    encoderPosition[1]--;
  }
}

void IRAM_ATTR readEncoder2() {  // Roda Kanan
  if (digitalRead(ENC2A) == digitalRead(ENC2B)) {
    encoderPosition[2]--;
  } else {
    encoderPosition[2]++;
  }
}

void Odometry() {
  long pulseLeft;
  long pulseRight;

  noInterrupts();

  pulseLeft = encoderPosition[1];
  pulseRight = encoderPosition[2];

  interrupts();

  truepulseL = pulseLeft;
  truepulseR = pulseRight;

  long deltaLeft = pulseLeft - lastEncoderLeft;  // Pengukuran pulse setiap interrupt
  long deltaRight = pulseRight - lastEncoderRight;

  delL = deltaLeft;
  delR = deltaRight;

  lastEncoderLeft = pulseLeft;
  lastEncoderRight = pulseRight;

  float dLeft = deltaLeft * DISTANCE_PER_PULSE;  // Konversi data pulse ke perpindahan mm
  float dRight = deltaRight * DISTANCE_PER_PULSE;

  floatl = dLeft;
  floatr = dRight;


  float dS = (dLeft + dRight) / 2.0;  // Perhitungan perbedaan jarak tempoh motor l dan r untuk belokan

  float dTheta = (dRight - dLeft) / WHEEL_BASE;  // perhitungan sudut belokan not used

  posX += dS * cos(GYRO_Zdeg * PI / 180.0);
  posY += dS * sin(GYRO_Zdeg * PI / 180.0);
}

float mapNilai(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

void encoderToVelocity() {
  unsigned long currentMillis = millis();
  float deltaT = (currentMillis - lastMillis);

  if (deltaT >= 50) {
    float timeInSeconds = deltaT / 1000.0;
    for (int i = 1; i <= 2; i++) {
      pulsePerSecond[i] = (encoderPosition[i] - lastPulse[i]);
      lastPulse[i] = encoderPosition[i];
      velocityEncoder[i] = (float)(pulsePerSecond[i] * 60) / (PPR * (deltaT / 1000.0));  //outputnya RPM // try to yoink this one
    }
    lastMillis = currentMillis;
  }
}


void PID1(float setpoint, float feedback) {
  float kp = pel, ki = iel, kd = del;
  static unsigned long prevT = 0;
  static float prevE = 0.0, integral = 0.0;

  long currT = micros();
  float deltaT = ((float)(currT - prevT)) / (1.0e6);
  if (deltaT <= 0.0001) deltaT = 0.0001;

  float e = setpoint - feedback;

  float dedt = (e - prevE) / (deltaT);
  integral += e * deltaT;
  pidOutput[1] = (kp * e + kd * dedt + ki * integral);

  //if(setpoint < 0.1 && setpoint > -0.1){integral=0; pidOutput[1] = 0;}
  prevT = currT;
  prevE = e;
}


void controlMotor() {
  //switch to lib PID
  PID1(0, NilaiPosisi);
  // PID Library can't be set from Loop thus making it
  // PIDtry();
  const int motorR[3] = { 0, motor1R, motor2R };  //PWM pins to motor / driver
  const int motorL[3] = { 0, motor1L, motor2L };

  if (pidOutput[1] > 3000) {
    pidOutput[1] = 3000;
  } else if (pidOutput[1] < -3000) {
    pidOutput[1] = -3000;
  }  // went into 3000 again and act as a direction for the motor via  adjustment

  mutlakPidOutput[1] = abs(pidOutput[1]);
  // FPWM used for deciding direction and speed in line following
  PWM[1] = mapNilai(mutlakPidOutput[1], 0, 3000, 0, 255);
  // PWM[1] = mapNilai(mutlakPidOutput[1], 0, 2000, 0, 255);
  FPWM[1] = constrain(BASEPWM + PWM[1], 0, 255);     //for the other wheel that drives
  FPWM[2] = constrain(BASEPWM - PWM[1], -255, 255);  // for the wheel that stops and dictates direction


  KendaliBacasensor();


  //motor1 as cruise , motor2 as steer
  if (NilaiPosisi >= 0) {

    analogWrite(motorL[1], 0);
    analogWrite(motorR[1], FPWM[1]);
    if (FPWM[2] >= 0) {
      analogWrite(motorL[2], FPWM[2]);  //Check if FPWM[2] is postive
      analogWrite(motorR[2], 0);
    }
    //If its not positive it gets reversed from negative into positive
    else {
      analogWrite(motorL[2], 0);
      analogWrite(motorR[2], -FPWM[2]);  //Logic check for PWM data to make sure its positive
    }

  }



  //motor1 as steer, motor2 as cruise
  else if (NilaiPosisi < 0) {

    if (FPWM[2] >= 0) {
      analogWrite(motorL[1], 0);
      analogWrite(motorR[1], FPWM[2]);
    } else {
      analogWrite(motorL[1], -FPWM[2]);
      analogWrite(motorR[1], 0);
    }
    analogWrite(motorL[2], FPWM[1]);
    analogWrite(motorR[2], 0);
  } else {
    analogWrite(motorR[1], 0);
    analogWrite(motorL[1], 0);
    analogWrite(motorR[2], 0);
    analogWrite(motorL[2], 0);
  }
}


void MotorStop() {
  analogWrite(motor1R, 0);
  analogWrite(motor1L, 0);
  analogWrite(motor2R, 0);
  analogWrite(motor2L, 0);
}
//Important things : motor1 use R to forward and vice versa, while
//------------------ motor2 use L to forward and vice versa
//------------------ because both motors are faced back to back
void setMotor(int ki, int ka) {
  if (ki >= 0) {
    analogWrite(motor1L, 0);
    analogWrite(motor1R, ki);
  } else if (ki < 0) {
    analogWrite(motor1L, (abs(ka)));
    analogWrite(motor1R, 0);
  }
  if (ka >= 0) {
    analogWrite(motor2L, ka);
    analogWrite(motor2R, 0);
  } else if (ka < 0) {
    analogWrite(motor2L, 0);
    analogWrite(motor2R, (abs(ka)));
  }
}
