//Method for photoelectric sensor

//Sensor reading method
void Sensor_Distance(){
  for(int i=0; i<4; i++){
    C_S_Jarak[i] = digitalRead(sensor_Jarak[i]);
  }
  //Serial.println(C_S_Jarak[0]+String(",")+String(C_S_Jarak[1])+String(",")+String(C_S_Jarak[2])+String(",")+String(C_S_Jarak[3]));
}

//Obstacle sensor detection method
volatile bool ObstacleDetected(){
  if((C_S_Jarak[0] || C_S_Jarak[1]) == 1){
    return 1; //seharusnya 1
  }
  else{
    return 0; 
  }
}
