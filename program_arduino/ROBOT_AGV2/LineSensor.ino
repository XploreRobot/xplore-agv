//Method for line sensor measurement and DAQ

void KendaliSelector(int a, int b, int c) {
  digitalWrite(Trig1, a);
  digitalWrite(Trig2, b);
  digitalWrite(Trig3, c);
}

void KendaliBacasensor() {
  KendaliSelector(0, 0, 0);
  sensor[1] = analogRead(LineSensor) / 8;
  KendaliSelector(1, 0, 0);
  sensor[2] = analogRead(LineSensor) / 8;
  KendaliSelector(0, 1, 0);
  sensor[3] = analogRead(LineSensor) / 8;
  KendaliSelector(1, 1, 0);
  sensor[0] = analogRead(LineSensor) / 8;
  KendaliSelector(0, 0, 1);
  sensor[7] = analogRead(LineSensor) / 8;
  KendaliSelector(1, 0, 1);
  sensor[4] = analogRead(LineSensor) / 8;
  KendaliSelector(0, 1, 1);
  sensor[6] = analogRead(LineSensor) / 8;
  KendaliSelector(1, 1, 1);
  sensor[5] = analogRead(LineSensor) / 8;
}


word bacaSensorbiner() {
  rlp = 0;
  KendaliBacasensor();
  for (int j = 0; j < 8; j++) {
    if (sensor[j] > nilaiRef[j]) {
      biner[j] = 1;
      rlp |= (1 << (7 - j));
    } else {
      biner[j] = 0;
    }
  }
  return rlp;
}

void readPosition() {
  bacaSensorbiner();
  switch (bacaSensorbiner()) {
    case 0b00000001: NilaiPosisi = 7; break;
    case 0b00000011: NilaiPosisi = 6; break;
    case 0b00000010: NilaiPosisi = 5; break;
    case 0b00000110: NilaiPosisi = 4; break;
    case 0b00000100: NilaiPosisi = 3; break;
    case 0b00001100: NilaiPosisi = 2; break;
    case 0b00001000: NilaiPosisi = 1; break;
    case 0b00011000: NilaiPosisi = 0; break;
    case 0b00010000: NilaiPosisi = -1; break;
    case 0b00110000: NilaiPosisi = -2; break;
    case 0b00100000: NilaiPosisi = -3; break;
    case 0b01100000: NilaiPosisi = -4; break;
    case 0b01000000: NilaiPosisi = -5; break;
    case 0b11000000: NilaiPosisi = -6; break;
    case 0b10000000: NilaiPosisi = -7; break;
  }
}

void dataSensor() {
  for (int j = 0; j < 8; j++) {
    nilaiRef[j] = nilaiSens;
  }
}



void line_follow(int Speed) {
    if (proxHome != true) {
      BASEPWM = RPMinput;
    } else {
      BASEPWM = 40;
    }
  
  // will be replaced by a place holder for MQTT input

  readPosition();
  controlMotor();
}

