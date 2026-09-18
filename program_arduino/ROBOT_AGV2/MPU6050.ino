//MPU6050 sensor method, only using the gyroscope Z-axis for rotational movement Odometry

void MPU6050_Init()
{
  //WAKE UP MPU6050
  Wire.beginTransmission(MPU6050_ADDR); // I2C Start
  Wire.write(0x6B);                     // OPEN PWR_MGMT_1 REGISTER
  Wire.write(0x00);                     // WAKE UP MPU6050
  Wire.endTransmission();               // END

  //READ DATA CONF
  Wire.beginTransmission(MPU6050_ADDR); // I2C Start
  Wire.write(0x1A);                     // OPEN DIGITAL LOW PASS FILTER (DLPF)
  Wire.write(0x05);                     // 10Hz FILTER SELECTED
  Wire.endTransmission();               // END

  //GYRO CONF
  Wire.beginTransmission(MPU6050_ADDR); // I2C Start
  Wire.write(0x1B);                     // OPEN GYRO CONFIG REGISTER
  Wire.write(0x00);                     // SELECT GYRO SENS ±250 DEG/S
  Wire.endTransmission();               // END

  //ACCEL CONF
  Wire.beginTransmission(MPU6050_ADDR); // I2C Start
  Wire.write(0x1C);                     // OPEN ACCEL CONFIG REGISTER
  Wire.write(0x00);                     // SELECT ACCEL SENS ±2G
  Wire.endTransmission();               // END
}

//=========================================================
// MPU6050 CALIBRATION
//=========================================================
void MPU6050_Calibration()
{
  Serial.println("--------------------------------");
  Serial.println("MPU6050 CALIBRATION");
  Serial.println("KEEP SENSOR COMPLETELY STILL");
  Serial.println("--------------------------------");

  GYRO_X_OFFSET = 0;
  GYRO_Y_OFFSET = 0;
  GYRO_Z_OFFSET = 0;

  ACCEL_X_OFFSET = 0;
  ACCEL_Y_OFFSET = 0;
  ACCEL_Z_OFFSET = 0;

  for(int i = 0; i < CALIBRATION_SAMPLES; i++)
  {
    ReadMPU6050();

    //GYRO OFFSET
    GYRO_X_OFFSET += GYRO_X;
    GYRO_Y_OFFSET += GYRO_Y;
    GYRO_Z_OFFSET += GYRO_Z;

    //ACCEL OFFSET
    ACCEL_X_OFFSET += ACCEL_X;
    ACCEL_Y_OFFSET += ACCEL_Y;
    ACCEL_Z_OFFSET += ACCEL_Z;

    delay(1);
  }

  //AVERAGE GYRO OFFSET
  GYRO_X_OFFSET /= CALIBRATION_SAMPLES;
  GYRO_Y_OFFSET /= CALIBRATION_SAMPLES;
  GYRO_Z_OFFSET /= CALIBRATION_SAMPLES;

  //AVERAGE ACCEL OFFSET
  ACCEL_X_OFFSET /= CALIBRATION_SAMPLES;
  ACCEL_Y_OFFSET /= CALIBRATION_SAMPLES;
  ACCEL_Z_OFFSET /= CALIBRATION_SAMPLES;

  //REMOVE 1G FROM Z AXIS
  ACCEL_Z_OFFSET -= 1.0;


}

void ReadMPU6050()
{
  //ACCEL + TEMP + GYRO MEASURE
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B);                     // START FROM ACCEL_XOUT_H
  Wire.endTransmission(false);

  Wire.requestFrom(MPU6050_ADDR, 14);   // REQUEST 14 BYTES

  if (Wire.available() == 14)
  {
    //ACCEL RAW DATA
    int16_t AccelX = (Wire.read() << 8) | Wire.read();
    int16_t AccelY = (Wire.read() << 8) | Wire.read();
    int16_t AccelZ = (Wire.read() << 8) | Wire.read();

    //TEMPERATURE RAW DATA
    int16_t Temp = (Wire.read() << 8) | Wire.read();

    //GYRO RAW DATA
    int16_t GyroX = (Wire.read() << 8) | Wire.read();
    int16_t GyroY = (Wire.read() << 8) | Wire.read();
    int16_t GyroZ = (Wire.read() << 8) | Wire.read();

    //ACCEL CONVERT (LSB → g)
    ACCEL_X = AccelX / 16384.0;
    ACCEL_Y = AccelY / 16384.0;
    ACCEL_Z = AccelZ / 16384.0;

    //GYRO CONVERT (LSB → deg/s)
    GYRO_X = GyroX / 131.0;
    GYRO_Y = GyroY / 131.0;
    GYRO_Z = GyroZ / 131.0;

    //TEMPERATURE CONVERT
    TEMPERATURE = (Temp / 340.0) + 36.53;
  }
}
